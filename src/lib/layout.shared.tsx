import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Prow Dash",
    },
    // Removes the theme switcher from the nav + docs sidebar footer
    themeSwitch: {
      enabled: false,
    },
  };
}
