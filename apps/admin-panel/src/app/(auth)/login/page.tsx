"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      document.cookie = `arcom_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setError(err.message || "Credenciales inválidas");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  }

  return (
    <div className="flex min-h-screen items-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md mx-auto">
        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Arcom Admin</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Panel de administración</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full"
            >
              {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
