import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { CONTACT_URL, GITHUB_URL, LIVE_URL } from "@/features/docs/constants";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "ProWater · Case Study",
      url: "/docs",
    },
    githubUrl: GITHUB_URL,
    links: [
      {
        type: "main",
        text: "Live demo",
        url: LIVE_URL,
        external: true,
      },
      {
        type: "button",
        text: "Hire me",
        url: CONTACT_URL,
        external: true,
      },
    ],
    // Removes the theme switcher from the nav + docs sidebar footer
    themeSwitch: {
      enabled: false,
    },
  };
}
