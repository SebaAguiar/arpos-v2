import { Theme } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme.store";

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Theme
      appearance={theme}
      accentColor="orange"
      grayColor="slate"
      radius="medium"
      scaling="100%"
    >
      {children}
    </Theme>
  );
}
