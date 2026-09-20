// Required by @next/mdx: the element map every MDX page renders through. The
// authored pages use plain elements, so this only has to exist and stay typed.
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components };
}
