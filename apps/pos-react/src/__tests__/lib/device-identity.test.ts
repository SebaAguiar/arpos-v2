import { describe, it, expect, beforeEach } from "vitest";
import { exportSPKI, generateKeyPair } from "jose";
import {
  ensureDeviceIdentity,
  buildDeviceProof,
  toProofHeaders,
  verifyDeviceProof,
  readDeviceIdentity,
  clearDeviceIdentity,
  DEVICE_PROOF_HEADER_NAMES,
} from "@/lib/device-identity";

// The POS has no Tauri host under vitest, so the module falls back to
// localStorage. jsdom provides localStorage and the WebCrypto primitives jose
// needs for Ed25519.

const EMAIL = "cliente@arcom.test";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("device identity", () => {
  beforeEach(async () => {
    await clearDeviceIdentity();
  });

  it("generates an Ed25519 identity on first run", async () => {
    const identity = await ensureDeviceIdentity();

    expect(identity.privateKeyPem).toContain("PRIVATE KEY");
    expect(identity.publicKeyPem).toContain("PUBLIC KEY");
  });

  it("mints the device id locally as a uuid, not a placeholder", async () => {
    const identity = await ensureDeviceIdentity();

    // Regression guard for the earlier design: the id used to be
    // `pending-<uuid>` until the server reassigned it. The POS is the only
    // party that needs it to be unique, and `Instance.localIdentifier` is
    // already `@unique`, so registration is idempotent without a server round
    // trip. A `pending-` id would be rejected by the server as malformed.
    expect(identity.deviceId).toMatch(UUID_RE);
    expect(identity.deviceId).not.toMatch(/^pending-/);
  });

  it("gives distinct ids to distinct devices", async () => {
    const first = await ensureDeviceIdentity();
    await clearDeviceIdentity();
    const second = await ensureDeviceIdentity();

    expect(first.deviceId).not.toBe(second.deviceId);
  });

  it("returns the same identity on subsequent calls", async () => {
    const first = await ensureDeviceIdentity();
    const second = await ensureDeviceIdentity();

    expect(second.privateKeyPem).toBe(first.privateKeyPem);
    expect(second.deviceId).toBe(first.deviceId);
  });

  it("produces a proof the server can verify", async () => {
    const identity = await ensureDeviceIdentity();

    const proof = await buildDeviceProof(EMAIL);
    expect(proof).not.toBeNull();
    expect(proof?.deviceId).toBe(identity.deviceId);

    const verified = await verifyDeviceProof({
      publicKeyPem: identity.publicKeyPem,
      proof: proof!.proof,
      expectedEmail: EMAIL,
    });
    expect(verified).toEqual({ email: EMAIL });
  });

  it("mints a proof without any prior registration step", async () => {
    // There is deliberately no local "am I registered" flag: the server owns
    // that truth and reports it via error codes. A fresh install must still be
    // able to attempt issuance so it can receive `device_not_registered`.
    await clearDeviceIdentity();

    const proof = await buildDeviceProof(EMAIL);
    expect(proof).not.toBeNull();
  });

  it("renders both proof headers", async () => {
    const identity = await ensureDeviceIdentity();

    const headers = toProofHeaders((await buildDeviceProof(EMAIL))!);

    expect(headers[DEVICE_PROOF_HEADER_NAMES.deviceId]).toBe(identity.deviceId);
    expect(headers[DEVICE_PROOF_HEADER_NAMES.proof].split(".")).toHaveLength(3);
  });

  it("signs a token, not a bare encoding of the email", async () => {
    await ensureDeviceIdentity();

    const proof = await buildDeviceProof(EMAIL);

    // Regression guard. The first implementation used jose's FlattenedSign,
    // which returns a full JWS whose `payload` field is the base64url message.
    // Mistaking that for the signature produced a "proof" that was just the
    // email in base64 and verified against nothing. A real proof must be a
    // signed JWS that fails verification without the private key.
    const naive = Buffer.from(proof!.proof).toString("utf8");
    expect(naive).not.toContain("@arcom.test");

    const segments = proof!.proof.split(".");
    expect(segments).toHaveLength(3);
    const header = JSON.parse(
      Buffer.from(segments[0]!, "base64url").toString("utf8"),
    ) as { alg: string };
    expect(header.alg).toBe("EdDSA");
  });

  it("rejects a proof replayed against a different email", async () => {
    const identity = await ensureDeviceIdentity();

    const proof = await buildDeviceProof(EMAIL);

    // The attack device binding exists to stop: a valid proof captured for one
    // identity, presented against someone else's email.
    expect(
      await verifyDeviceProof({
        publicKeyPem: identity.publicKeyPem,
        proof: proof!.proof,
        expectedEmail: "victim@arcom.test",
      }),
    ).toBeNull();
  });

  it("rejects a proof signed by a different device key", async () => {
    const attacker = await ensureDeviceIdentity();
    const attackerProof = await buildDeviceProof(EMAIL);

    await clearDeviceIdentity();
    const victim = await ensureDeviceIdentity();
    const victimProof = await buildDeviceProof(EMAIL);

    expect(attacker.publicKeyPem).not.toBe(victim.publicKeyPem);
    expect(
      await verifyDeviceProof({
        publicKeyPem: victim.publicKeyPem,
        proof: attackerProof!.proof,
        expectedEmail: EMAIL,
      }),
    ).toBeNull();

    expect(
      await verifyDeviceProof({
        publicKeyPem: victim.publicKeyPem,
        proof: victimProof!.proof,
        expectedEmail: EMAIL,
      }),
    ).not.toBeNull();
  });

  it("rejects a garbage proof without throwing", async () => {
    const identity = await ensureDeviceIdentity();

    for (const bad of ["", "not-a-jws", "a.b.c", identity.publicKeyPem]) {
      expect(
        await verifyDeviceProof({
          publicKeyPem: identity.publicKeyPem,
          proof: bad,
          expectedEmail: EMAIL,
        }),
      ).toBeNull();
    }
  });

  it("bounds the proof lifetime via an exp claim", async () => {
    await ensureDeviceIdentity();

    const proof = await buildDeviceProof(EMAIL);

    // The server enforces the window, so the token has to carry the claim for
    // it to have anything to check.
    const payload = JSON.parse(
      Buffer.from(proof!.proof.split(".")[1]!, "base64url").toString("utf8"),
    ) as { exp: number; iat: number; email: string };

    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(payload.email).toBe(EMAIL);
  });

  it("treats an identity with a mismatched public key as absent", async () => {
    await ensureDeviceIdentity();
    expect(await readDeviceIdentity()).not.toBeNull();

    // Simulate a tampered or half-written file: public key swapped for an
    // unrelated pair. The identity must be treated as absent, never registered.
    const { publicKey: unrelated } = await generateKeyPair("EdDSA", {
      extractable: true,
    });
    const raw = localStorage.getItem("arcom_device_identity");
    expect(raw).not.toBeNull();

    const tampered = JSON.parse(raw!) as {
      deviceId: string;
      privateKeyPem: string;
      publicKeyPem: string;
    };
    tampered.publicKeyPem = await exportSPKI(unrelated);
    localStorage.setItem("arcom_device_identity", JSON.stringify(tampered));

    expect(await readDeviceIdentity()).toBeNull();
  });

  it("drops the identity so a fresh keypair and id are generated", async () => {
    const before = await ensureDeviceIdentity();

    await clearDeviceIdentity();

    const after = await ensureDeviceIdentity();
    expect(after.privateKeyPem).not.toBe(before.privateKeyPem);
    expect(after.deviceId).not.toBe(before.deviceId);
  });
});
