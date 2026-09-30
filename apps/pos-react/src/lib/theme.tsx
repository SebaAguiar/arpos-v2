import { Theme } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme.store";
import type { Theme as ThemeName } from "@/stores/theme.store";

interface AppThemeProviderProps {
  children: ReactNode;
}

/**
 * Radix Themes' `appearance` prop only accepts "light" | "dark" | "inherit" —
 * it has no notion of a third, branded theme. The brand theme is therefore a
 * *light* appearance whose palette comes from our own CSS custom properties
 * (see `[data-theme="arcom"]` in `styles/globals.css`), which override the
 * Radix colour scales at equal specificity but later in source order.
 */
const RADIX_APPEARANCE: Record<ThemeName, "light" | "dark"> = {
  arcom: "light",
  dark: "dark",
  light: "light",
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Theme
      appearance={RADIX_APPEARANCE[theme]}
      // `gray` and `orange` are only the *source* of the alpha (`-a*`) ramps and
      // the `-surface` tokens; the 12 solid steps they contribute are replaced
      // per-theme in globals.css, which is what makes the 355 Radix semantic
      // colour props follow the brand.
      accentColor="orange"
      grayColor="gray"
      radius="medium"
      scaling="100%"
    >
      {children}
    </Theme>
  );
}
