import type { MDXComponents } from "mdx/types";

import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";

import { H1, H2, H3, H4, H5, H6 } from "./headings";
import { ProjectLinks } from "./project-links";
import { RouteMeta } from "./route-meta";
import { SourceLink } from "./source-link";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    SourceLink,
    RouteMeta,
    ProjectLinks,
    Tab,
    Tabs,
    Step,
    Steps,
    Accordion,
    Accordions,
    File,
    Files,
    Folder,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
