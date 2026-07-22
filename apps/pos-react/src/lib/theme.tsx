import { Theme } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <Theme
      appearance="dark"
      accentColor="orange"
      grayColor="slate"
      radius="medium"
      scaling="100%"
    >
      {children}
    </Theme>
  );
}
