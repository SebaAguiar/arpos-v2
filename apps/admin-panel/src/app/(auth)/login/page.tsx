"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, Heading, Text, TextField, Button, Flex } from "@radix-ui/themes";
import { getFormErrorMessages } from "@/lib/form-errors";
import { ErrorCallout } from "@/components/ui/error-callout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      document.cookie = `arcom_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setErrors(getFormErrorMessages(err));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
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
            {errors.length > 0 && <ErrorCallout messages={errors} />}

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
