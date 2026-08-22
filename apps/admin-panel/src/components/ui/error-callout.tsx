"use client";

import { Flex, Text, Callout } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface ErrorCalloutProps {
  messages: string[];
}

export function ErrorCallout({ messages }: ErrorCalloutProps) {
  return (
    <Callout.Root color="red" mb="4">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Callout.Text>
        <Flex direction="column" gap="1">
          {messages.map((message) => (
            <Text key={message} size="2">
              {message}
            </Text>
          ))}
        </Flex>
      </Callout.Text>
    </Callout.Root>
  );
}
