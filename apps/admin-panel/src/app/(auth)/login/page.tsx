"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Box, Card, Heading, Text, TextField, Button, Flex, Callout } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

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
      setError(err.message || "Credenciales invalidas");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
      <Card style={{ width: 400 }}>
        <Flex direction="column" align="center" gap="1" mb="6">
          <Heading size="6">Arcom Admin</Heading>
          <Text size="2" color="gray">Panel de administracion</Text>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {error && (
              <Callout.Root color="red">
                <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Email</Text>
              <TextField.Root
                type="email"
                placeholder="admin@arcom.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Password</Text>
              <TextField.Root
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Flex>

            <Button type="submit" loading={loginMutation.isPending} style={{ width: "100%" }}>
              Ingresar
            </Button>
          </Flex>
        </form>
      </Card>
    </Flex>
  );
}
