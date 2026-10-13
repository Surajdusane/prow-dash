import { defineConfig } from "fumadocs-mdx/config";

import { transformers } from "@/lib/highlight-code";

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "min-light",
        dark: "vesper",
      },
      defaultColor: false,
      transformers,
    },
  },
});
