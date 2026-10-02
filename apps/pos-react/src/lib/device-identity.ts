import {
  exportPKCS8,
  exportJWK,
  importPKCS8,
  importSPKI,
  importJWK,
  exportSPKI,
  generateKeyPair,
  SignJWT,
  jwtVerify,
  type JWK_OKP_Public,
} from "jose";
import {
  DEVICE_PROOF_HEADERS,
  DEVICE_PROOF_MAX_AGE_SECONDS,
} from "@arcom/contracts";
import { isTauri, safeInvoke } from "@/lib/tauri";

const DEVICE_IDENTITY_STORAGE_KEY = "arcom_device_identity";

const ED25519_ALG = "EdDSA";

// The TTL lives in the contract so the POS and the server cannot drift apart:
// a proof minted with a longer window than the server accepts would fail as an
// opaque signature error on every boot.
const PROOF_TTL_SECONDS = DEVICE_PROOF_MAX_AGE_SECONDS;

const DEVICE_ID_HEADER = DEVICE_PROOF_HEADERS.deviceId;
const DEVICE_PROOF_HEADER = DEVICE_PROOF_HEADERS.proof;

/**
 * Device identity for license issuance.
 *
 * WHY THIS EXISTS
 * License issuance used to be `POST /api/license/issue { email }` with no proof
 * of anything. An email is public data, so anyone who knew a subscriber's
 * address could mint a valid, signed license for themselves. The server now
 * issues licenses only to requests carrying a proof signed by the private key
 * bound to the account on this device, so knowing an email is not enough.
 *
 * WHY Ed25519
 * The license token itself is already signed with Ed25519 by the admin-panel
 * and verified in this same app with `jwtVerify`, so the device proof reuses
 * the exact code path that already has to work. No new dependency.
 *
 * WHY A COMPACT JWS AND NOT A RAW SIGNATURE
 * The proof is a `SignJWT` compact token, not a bare signature over a string.
 * Two reasons, both learned the hard way:
 *   1. jose 6 has no bare `sign()`. The only signer is `FlattenedSign`, which
 *      builds a whole JWS and returns already-base64url fields. Hand-rolling the
 *      signature encoding around it produced a "proof" that was just the email
 *      in base64 and verified against nothing.
 *   2. A compact JWS carries `iat`/`exp`, so replay bounding is enforced by
 *      `jwtVerify` on the server instead of by hand-rolled timestamp math.
 *
 * WHY THE DEVICE ID IS GENERATED HERE
 * The id is a uuid minted on first run, not one handed down by the server. An
 * earlier version used a `pending-<uuid>` placeholder that the server replaced
 * after registration. That was needless: `Instance.localIdentifier` is already
 * `@unique`, so a self-minted id makes registration idempotent for free and
 * removes an entire intermediate state (plus the `adoptServerDeviceId` step that
 * came with it) that nothing else needed.
 *
 * STORAGE (interim)
 * The identity is persisted through the Tauri command `save_device_identity`,
 * which writes ~/.arcom/data/device.identity.json with 0600 permissions. In a
 * plain browser (dev / portable mode) there is no Tauri, so it falls back to
 * localStorage: acceptable for development, never used by the packaged app.
 */

/** Public shape of a device. Never holds the private key. */
export interface DeviceIdentity {
  /** Client-minted uuid; the server stores it as `Instance.localIdentifier`. */
  deviceId: string;
  publicKeyPem: string;
}

interface StoredIdentity extends DeviceIdentity {
  privateKeyPem: string;
}

/** Headers attached to a license request. */
export interface DeviceProof {
  deviceId: string;
  /** Compact JWS the server verifies against the stored public key. */
  proof: string;
}

/**
 * Ed25519 public JWK with literal discriminants.
 *
 * jose resolves `importJWK`'s return type from a conditional on `kty`. Its own
 * `JWK_OKP_Public` types `kty` as the broad `JWKKeyType`, so the conditional
 * falls through to the `CryptoKey | Uint8Array` union and `exportSPKI` rejects
 * it. Narrowing the literals here makes the conditional resolve to `CryptoKey`.
 */
interface Ed25519PublicJwk extends JWK_OKP_Public {
  kty: "OKP";
  crv: "Ed25519";
}

/**
 * Reads the stored identity, returning `null` on a fresh install.
 *
 * Two integrity checks run on the way out, so a corrupted or hand-edited file
 * surfaces here instead of as an opaque signature failure later:
 *   1. the private key must still import, and
 *   2. the stored public key must actually be the pair's public half.
 * A mismatch means the file was tampered with or half-written, and the safe
 * move is to treat the identity as absent rather than register a pair the
 * device cannot actually sign for.
 */
export async function readDeviceIdentity(): Promise<StoredIdentity | null> {
  const raw = await readRawIdentity();
  if (!raw) return null;

  try {
    const derived = await derivePublicKeyPem(raw.privateKeyPem);
    if (derived !== raw.publicKeyPem) return null;
    return raw;
  } catch {
    return null;
  }
}

async function readRawIdentity(): Promise<StoredIdentity | null> {
  if (isTauri()) {
    try {
      const blob = await safeInvoke<string | null>("get_device_identity");
      if (!blob) return null;
      return JSON.parse(blob) as StoredIdentity;
    } catch {
      // fall through to storage
    }
  }
  try {
    const raw = localStorage.getItem(DEVICE_IDENTITY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredIdentity;
  } catch {
    return null;
  }
}

async function writeRawIdentity(identity: StoredIdentity): Promise<void> {
  if (isTauri()) {
    try {
      await safeInvoke("save_device_identity", {
        identity: JSON.stringify(identity),
      });
      return;
    } catch {
      // fall through to storage
    }
  }
  try {
    localStorage.setItem(DEVICE_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // ignore
  }
}

/**
 * Derives the SPKI public key from a PKCS#8 private key.
 *
 * jose has no `derivePublicKey`, but Ed25519 exposes the public half inside the
 * JWK of the private key: stripping `d` from that JWK yields a valid public JWK
 * that imports under the same algorithm. That is the supported path, and it
 * avoids hand-slicing the 32-byte scalar out of the PKCS#8 wrapper.
 *
 * `extractable: true` is required, not cosmetic: jose imports PEM keys as
 * non-extractable by default, and `exportJWK` then throws "non-extractable
 * CryptoKey cannot be exported as a JWK". The key is only exported to derive the
 * public half for the integrity check; signing uses a non-extractable import.
 */
async function derivePublicKeyPem(privateKeyPem: string): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, ED25519_ALG, {
    extractable: true,
  });
  const jwk = await exportJWK(privateKey);

  // Validate rather than blind-delete `d`: jose types `JWK` as a flat object
  // with every field optional, so nothing stops a non-Ed25519 key from reaching
  // here. Asserting the curve also gives `importJWK` a concrete key type, which
  // is what keeps its return value a CryptoKey instead of `CryptoKey | Uint8Array`.
  if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || typeof jwk.x !== "string") {
    throw new Error("Device key material is not an Ed25519 key");
  }

  const publicJwk: Ed25519PublicJwk = {
    kty: "OKP",
    crv: "Ed25519",
    x: jwk.x,
    key_ops: ["verify"],
  };
  const publicKey = await importJWK(publicJwk, ED25519_ALG);
  return exportSPKI(publicKey);
}

/** Generates and persists a fresh Ed25519 identity on first run. */
export async function ensureDeviceIdentity(): Promise<StoredIdentity> {
  const existing = await readDeviceIdentity();
  if (existing) return existing;

  const { privateKey, publicKey } = await generateKeyPair(ED25519_ALG, {
    extractable: true,
  });

  const identity: StoredIdentity = {
    deviceId: crypto.randomUUID(),
    privateKeyPem: await exportPKCS8(privateKey),
    publicKeyPem: await exportSPKI(publicKey),
  };

  await writeRawIdentity(identity);
  return identity;
}

/** Drops the local identity (device unlink / full reset). */
export async function clearDeviceIdentity(): Promise<void> {
  if (isTauri()) {
    try {
      await safeInvoke("clear_device_identity");
      return;
    } catch {
      // fall through to storage
    }
  }
  try {
    localStorage.removeItem(DEVICE_IDENTITY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Builds the proof-of-possession for a license request.
 *
 * There is no local "is this device registered" flag on purpose. The server owns
 * that truth, and the issue endpoint reports `device_not_registered` /
 * `confirmation_required` as distinct error codes, so the POS reacts to the
 * server rather than to a cached guess that can go stale.
 *
 * Returns `null` only when the device has no usable identity at all, which
 * callers must treat as "generate one", never as "skip the check".
 */
export async function buildDeviceProof(
  email: string,
): Promise<DeviceProof | null> {
  const identity = await ensureDeviceIdentity();

  try {
    const privateKey = await importPKCS8(identity.privateKeyPem, ED25519_ALG);
    const proof = await new SignJWT({ email: email.trim().toLowerCase() })
      .setProtectedHeader({ alg: ED25519_ALG })
      .setIssuedAt()
      .setExpirationTime(`${PROOF_TTL_SECONDS}s`)
      .sign(privateKey);
    return { deviceId: identity.deviceId, proof };
  } catch {
    return null;
  }
}

/** Renders a proof as the headers to attach to a license request. */
export function toProofHeaders(proof: DeviceProof): Record<string, string> {
  return {
    [DEVICE_ID_HEADER]: proof.deviceId,
    [DEVICE_PROOF_HEADER]: proof.proof,
  };
}

/**
 * Server-side verification counterpart, used by the admin-panel.
 *
 * Returns the claimed email on success and `null` on any failure: bad
 * signature, wrong algorithm, or an expired token. Keeping the failure
 * undifferentiated stops the endpoint from becoming a signature oracle.
 */
export async function verifyDeviceProof(args: {
  publicKeyPem: string;
  proof: string;
  expectedEmail: string;
}): Promise<{ email: string } | null> {
  try {
    const publicKey = await importSPKI(args.publicKeyPem, ED25519_ALG);
    const { payload } = await jwtVerify(args.proof, publicKey, {
      algorithms: [ED25519_ALG],
    });

    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email) return null;
    // The signed email must match the one in the request body, otherwise an
    // attacker could replay a captured proof for their own account against
    // someone else's email.
    if (email !== args.expectedEmail.trim().toLowerCase()) return null;

    return { email };
  } catch {
    return null;
  }
}

export const DEVICE_PROOF_HEADER_NAMES = {
  deviceId: DEVICE_ID_HEADER,
  proof: DEVICE_PROOF_HEADER,
} as const;
