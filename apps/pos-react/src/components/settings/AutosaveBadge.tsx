import { useEffect, useRef, useState } from "react";
import { Text } from "@radix-ui/themes";
import { CheckIcon } from "@radix-ui/react-icons";

export function AutosaveBadge({ revision }: { revision: unknown }) {
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(timer);
  }, [revision]);

  if (!visible) return null;

  return (
    <Text size="1" color="green" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <CheckIcon width={12} height={12} />
      Guardado
    </Text>
  );
}
