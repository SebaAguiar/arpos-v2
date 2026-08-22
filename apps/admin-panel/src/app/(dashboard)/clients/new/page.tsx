"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import Link from "next/link";
import { Button, Text, TextField, Select, Flex, Heading, Card, Grid, Callout } from "@radix-ui/themes";
import { ArrowLeftIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useState } from "react";

const onlyPhoneChars = (value: string) => value.replace(/[^0-9+()\s-]/g, "");
const onlyTaxIdChars = (value: string) => value.replace(/[^0-9-]/g, "");

export default function NewClientPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"persona" | "empresa">("persona");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [taxId, setTaxId] = useState("");
  const [country, setCountry] = useState("AR");
  const [notes, setNotes] = useState("");

  const createClient = api.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      router.push("/clients");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createClient.mutate({
      name,
      email,
      type,
      phone: phone || undefined,
      company: company || undefined,
      taxId: taxId || undefined,
      country,
      notes: notes || undefined,
    });
  }

  return (
    <>
      <Link href="/clients" style={{ textDecoration: "none" }}>
        <Button variant="ghost" size="2" mb="4">
          <ArrowLeftIcon /> Volver
        </Button>
      </Link>

      <Heading size="6" mb="4">Nuevo Cliente</Heading>

      {createClient.isError && (
        <Callout.Root color="red" mb="4">
          <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
          <Callout.Text>{createClient.error.message}</Callout.Text>
        </Callout.Root>
      )}

      <Card size="3">
        <form onSubmit={handleSubmit}>
          <Grid columns="2" gap="4">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Nombre *</Text>
              <TextField.Root
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Email *</Text>
              <TextField.Root
                placeholder="email@ejemplo.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Tipo</Text>
              <Select.Root value={type} onValueChange={(v) => setType(v as "persona" | "empresa")}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="persona">Persona</Select.Item>
                  <Select.Item value="empresa">Empresa</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Telefono</Text>
              <TextField.Root
                placeholder="Telefono"
                value={phone}
                onChange={(e) => setPhone(onlyPhoneChars(e.target.value))}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Empresa</Text>
              <TextField.Root
                placeholder="Empresa"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">CUIT / Tax ID</Text>
              <TextField.Root
                placeholder="CUIT / Tax ID"
                value={taxId}
                onChange={(e) => setTaxId(onlyTaxIdChars(e.target.value))}
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Pais</Text>
              <Select.Root value={country} onValueChange={setCountry}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="AR">Argentina</Select.Item>
                  <Select.Item value="UY">Uruguay</Select.Item>
                  <Select.Item value="CL">Chile</Select.Item>
                  <Select.Item value="BR">Brasil</Select.Item>
                  <Select.Item value="PY">Paraguay</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>

            <div />
          </Grid>

          <Flex direction="column" gap="1" mt="4">
            <Text size="2" weight="medium">Notas internas</Text>
            <TextField.Root
              placeholder="Notas internas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Flex>

          <Flex gap="3" mt="6" justify="end">
            <Link href="/clients" style={{ textDecoration: "none" }}>
              <Button variant="soft" color="gray" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" loading={createClient.isPending} disabled={createClient.isPending}>
              Crear cliente
            </Button>
          </Flex>
        </form>
      </Card>
    </>
  );
}
