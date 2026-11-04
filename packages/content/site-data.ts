// Single maintained metadata source for both sites.
//
// This module is plain data so the Node 24 build can import it directly and
// compile the same file into either site's browser bundle. Keep it free of
// imports and of TypeScript-only runtime syntax: Node's type stripping rewrites
// it verbatim into generated browser JavaScript.
//
// What lives here: the release and package metadata, the five supported
// platforms, the shared navigation and the page registries used for sitemaps,
// expected build output and the docs search index.

/**
 * Origins written into authored sources. Both builds rewrite these to the
 * configured origin pair; a fixture test keeps them equal to the defaults in
 * `scripts/lib/origins.ts`.
 */
export type OriginPlaceholders = {
  website: string;
  docs: string;
};

export const ORIGIN_PLACEHOLDERS: OriginPlaceholders = {
  website: "http://localhost:4173",
  docs: "http://localhost:4174",
};

export const PRODUCT_REPOSITORY = "https://github.com/Syndroo/syndroo";

/** The two public languages. English is the default and keeps the root URLs. */
export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "en";
export const htmlLangByLocale: Record<Locale, "en" | "zh-CN"> = {
  en: "en",
  zh: "zh-CN",
};

export function localizePath(locale: Locale, path: string): string {
  const marker = path.search(/[?#]/);
  const pathname = marker === -1 ? path : path.slice(0, marker);
  const suffix = marker === -1 ? "" : path.slice(marker);
  const unlocalized = pathname === "/zh" || pathname === "/zh/"
    ? "/"
    : pathname.replace(/^\/zh(?=\/)/, "");
  const clean = unlocalized === "" || unlocalized === "/" ? "/" : `/${unlocalized.replace(/^\/+|\/+$/g, "")}/`;
  if (locale === "en") {
    return clean + suffix;
  }
  return (clean === "/" ? "/zh/" : `/zh${clean}`) + suffix;
}

export function counterpartPath(locale: Locale, path: string): string {
  return localizePath(locale === "en" ? "zh" : "en", path);
}

export type UiMessages = {
  language: string;
  website: {
    skipToContent: string;
    mainNav: string;
    menu: string;
    close: string;
    installSyndroo: string;
    install: string;
    sourceRepository: string;
    viewEnglish: string;
    viewChinese: string;
  };
  docs: {
    skipToContent: string;
    suffix: string;
    searchDocs: string;
    searchDocumentation: string;
    searchPrompt: string;
    noResults: string;
    noResultsHint: string;
    website: string;
    overview: string;
    navigation: string;
    openNavigation: string;
    footer: string;
    navigate: string;
    open: string;
    close: string;
    copy: string;
    copyCode: string;
    copied: string;
    copyManually: string;
    publishingCode: string;
    shell: string;
    viewEnglish: string;
    viewChinese: string;
  };
  theme: {
    title: string;
    light: string;
    dark: string;
    system: string;
    choose: string;
    close: string;
  };
};

export const ui: Record<Locale, UiMessages> = {
  en: {
    language: "Language",
    website: {
      skipToContent: "Skip to content",
      mainNav: "Main",
      menu: "Menu",
      close: "Close",
      installSyndroo: "Install Syndroo",
      install: "Install",
      sourceRepository: "Syndroo source repository",
      viewEnglish: "View this page in English",
      viewChinese: "View this page in Simplified Chinese",
    },
    docs: {
      skipToContent: "Skip to content",
      suffix: "docs",
      searchDocs: "Search docs",
      searchDocumentation: "Search documentation",
      searchPrompt: 'Search every page of the local docs. Try "connect", "publish" or "egress".',
      noResults: "No results",
      noResultsHint: 'Try a shorter term, or search for a command such as <code>status</code>.',
      website: "Website",
      overview: "Overview",
      navigation: "Documentation navigation",
      openNavigation: "Open documentation navigation",
      footer: "Footer",
      navigate: "navigate",
      open: "open",
      close: "close",
      copy: "Copy",
      copyCode: "Copy code sample",
      copied: "Copied",
      copyManually: "Select and copy manually",
      publishingCode: "Publishing is real when credentials are configured",
      shell: "shell",
      viewEnglish: "View this page in English",
      viewChinese: "View this page in Simplified Chinese",
    },
    theme: {
      title: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      choose: "Choose Light, Dark or System.",
      close: "Close",
    },
  },
  zh: {
    language: "语言",
    website: {
      skipToContent: "跳到正文",
      mainNav: "主导航",
      menu: "菜单",
      close: "关闭",
      installSyndroo: "安装 Syndroo",
      install: "安装",
      sourceRepository: "Syndroo 源码仓库",
      viewEnglish: "用英文查看此页",
      viewChinese: "用简体中文查看此页",
    },
    docs: {
      skipToContent: "跳到正文",
      suffix: "文档",
      searchDocs: "搜索文档",
      searchDocumentation: "搜索文档",
      searchPrompt: "搜索本地文档的全部页面。试试“连接”“发布”或“出站”。",
      noResults: "无结果",
      noResultsHint: '尝试更短的词，或搜索 <code>status</code> 等命令。',
      website: "网站",
      overview: "概览",
      navigation: "文档导航",
      openNavigation: "打开文档导航",
      footer: "页脚",
      navigate: "导航",
      open: "打开",
      close: "关闭",
      copy: "复制",
      copyCode: "复制代码示例",
      copied: "已复制",
      copyManually: "请选择后手动复制",
      publishingCode: "配置凭证后发布会真实发生",
      shell: "终端",
      viewEnglish: "用英文查看此页",
      viewChinese: "用简体中文查看此页",
    },
    theme: {
      title: "主题",
      light: "浅色",
      dark: "深色",
      system: "跟随系统",
      choose: "选择浅色、深色或跟随系统。",
      close: "关闭",
    },
  },
};
export const PRODUCT_LICENSE_URL = `${PRODUCT_REPOSITORY}/blob/main/LICENSE`;

/** Version facts shared by both sites and their release checks. */
export type Versions = {
  /** Published release version of `@syndroo/cli`. */
  cli: string;
  /** Version the documentation describes. */
  docs: string;
  /** Release stage in English and Chinese. */
  releaseStage: string;
  releaseStageZh: string;
};

export const versions: Versions = {
  cli: "0.7.0",
  docs: "0.7.0",
  releaseStage: "available on npm",
  releaseStageZh: "已在 npm 发布",
};

/** Minimum runtime the packaged CLI declares in its `engines` field. */
export const PUBLIC_NODE_RUNTIME = "Node.js 24.19.0 or newer";

/** Supported local-write platforms for 0.7.0. */
export const SUPPORTED_LOCAL_SYSTEMS = "macOS and Linux";

/** The CLI, provider SDK, and five explicit official providers. */
export const SYNDROO_NPM_PACKAGES = [
  "@syndroo/cli",
  "@syndroo/provider-sdk",
  "@syndroo/provider-bluesky",
  "@syndroo/provider-threads",
  "@syndroo/provider-linkedin",
  "@syndroo/provider-mastodon",
  "@syndroo/provider-devto",
] as const;

export const SYNDROO_INSTALL_COMMAND =
  `npm install --global ${SYNDROO_NPM_PACKAGES.map((name) => `${name}@${versions.cli}`).join(" ")}`;

/** Package-relative Skill path resolved below `npm root --global`. */
export const SYNDROO_SKILL_PATH = "@syndroo/cli/skills/syndroo/SKILL.md";

export const SYNDROO_AGENT_PROMPT = `You are a local-shell coding Agent. Set up Syndroo 0.7.0 for me.

1. Before installing anything, establish where Syndroo will run. If I have not said, ask me which project directory will use Syndroo and which runtime manager that directory declares (mise, asdf, Volta, nvm, Homebrew or a system Node), and stay in that directory. A chat scratch directory or my home directory is not the project.
2. In that directory, record the runtime that is actually in effect: \`command -v node npm\`, \`node --version\` (24.19.0 or newer), \`npm --version\`, \`npm root --global\` and \`npm prefix --global\`. Confirm macOS or Linux for supported local writes.
3. Use that one runtime for the install, the version check, the Skill lookup and every later command. With mise, prefix commands with \`mise exec --\`; \`mise which node\`, \`mise which npm\` and \`mise which syndroo\` each take one argument, so run them separately. Do not assume Homebrew, do not compare pathnames across managers, and never prepend another bin directory to \`PATH\` to get around a shim.
4. Install Syndroo and its official platform plugins with:
   ${SYNDROO_INSTALL_COMMAND}
5. Check what the shell resolves, then read and follow the packaged Skill: \`command -v syndroo\`, \`syndroo --version\`, then \`npm root --global\` and read \`<global-root>/${SYNDROO_SKILL_PATH}\`. Do not run or invent a separate Skill-installer command.
6. Ask whether I want the local workflow or the self-hosted Server workflow, then continue with my choice. For Server setup, ask whether I want GitHub; create or push a repository only when I explicitly authorize it, and reuse authorization I have already given. In 0.7.0, \`connect threads\` and \`publish threads\` need the project passed explicitly, for example \`syndroo server --project . connect threads --app-id <app-id>\`. Select my intended account from the accessible accounts listed by the project-local \`wrangler whoami\` output and pass that account ID with \`--account\`; if my intended account is not listed, stop and ask me instead of deploying to another account. Authenticate only when the session is missing or expired.
7. Keep secrets out of prompts, command arguments, logs, and tracked files. Publish content only with authorization for that content and destination.`;

export const SYNDROO_AGENT_PROMPT_ZH = `你是一名可在本地终端执行命令的智能体。请为我设置 Syndroo 0.7.0。

1. 安装之前先确定 Syndroo 要在哪里运行。如果我没有说明，请询问哪个项目目录会使用 Syndroo，以及该项目声明的是哪种运行时管理器（mise、asdf、Volta、nvm、Homebrew 或系统 Node），并始终留在该目录中操作。聊天临时目录或我的主目录都不是项目目录。
2. 在该目录记录实际生效的运行时：\`command -v node npm\`、\`node --version\`（24.19.0 或更新版本）、\`npm --version\`、\`npm root --global\` 和 \`npm prefix --global\`；并确认平台是 macOS 或 Linux，以获得受支持的本地写入能力。
3. 后续的安装、版本检查、Skill 查找以及所有命令都使用这同一个运行时。使用 mise 时，请在命令前加上 \`mise exec --\`；\`mise which node\`、\`mise which npm\` 和 \`mise which syndroo\` 每次只接受一个参数，请分别执行。不要假设使用 Homebrew，不要跨管理器比较路径，也不要通过向 \`PATH\` 追加其他 bin 目录来绕过 shim。
4. 使用以下命令安装 Syndroo 及其官方平台插件：
   ${SYNDROO_INSTALL_COMMAND}
5. 检查 shell 实际解析到的可执行文件，然后读取并遵循包内 Skill：先运行 \`command -v syndroo\` 和 \`syndroo --version\`，再用 \`npm root --global\` 取到全局根目录，读取 \`<global-root>/${SYNDROO_SKILL_PATH}\`。不要运行或编造单独的 Skill 安装命令。
6. 询问我要使用本地工作流还是自托管 Server 工作流，然后按我的选择继续。对于 Server 设置，询问我是否需要 GitHub；只有在我明确授权时才创建或推送仓库，并复用我已经给出的授权。在 0.7.0 中，\`connect threads\` 和 \`publish threads\` 需要显式传入项目，例如 \`syndroo server --project . connect threads --app-id <app-id>\`。请从项目本地 \`wrangler whoami\` 输出列出的可访问账号中，选出我想要使用的账号，并用 \`--account\` 传入该账号 ID；如果其中没有我想用的账号，请停下并询问我，绝不要部署到另一个账号。只有在会话缺失或已过期时才进行认证。
7. 不要让机密出现在提示词、命令参数、日志或受版本跟踪的文件中。只有已获授权的内容和目标才能发布。`;

/**
 * The accepted CLI surface the documentation is allowed to print.
 *
 * Mirrors the accepted local decision Q13 and the approved self-hosted
 * Server/Threads slice: the local commands (`connect`, `publish`, `status`)
 * plus the exact nested `server` command paths below. The global flags are
 * `--config`, `--json`, `--verbose`, `--no-color`, `--help` and `--version`.
 * `--help` and `--version` are the documented help/version surface.
 *
 * The per-command flag lists are the CLI's own `--help` output. The build
 * checker runs the real CLI and fails when this list and the shipped flags
 * drift apart, so this is a mirror to audit against, not a second source of
 * truth.
 */
export type CliCommandSurface = {
  name: string;
  flags: string[];
  /**
   * The subset of `flags` that takes a value and may therefore stand between a
   * command and the subcommand it scopes, as in
   * `server --project . connect threads`. A flag not listed here is assumed to
   * be boolean, so its token is never consumed as a value.
   */
  valueFlags?: string[];
};

export const cliSurface = {
  spec: "architecture-v1 section 12.1 / decision Q13 and approved Server CLI slice",
  globalFlags: ["--config", "--json", "--verbose", "--no-color", "--help", "--version"],
  commands: [
    {
      name: "connect",
      flags: [
        "--label",
        "--connection",
        "--from-env",
        "--credential-file",
        "--update",
        "--disconnect",
        "--input",
        "--redirect-uri",
        "--callback-url",
        "--default",
        "--no-default",
      ],
    },
    {
      name: "publish",
      flags: ["--input", "--data", "--retry", "--to", "--request-id", "--dry-run", "--yes"],
    },
    {
      name: "status",
      flags: ["--provider", "--connections", "--operation", "--operations", "--limit", "--cursor"],
    },
    {
      name: "server",
      flags: ["--project"],
      // `server --project <directory> <command>` scopes a whole Server command.
      valueFlags: ["--project"],
    },
    {
      name: "server init",
      flags: ["--github", "--public", "--private"],
    },
    {
      name: "server doctor",
      flags: [],
    },
    {
      name: "server deploy",
      flags: ["--account", "--recover", "--credentials-stdin", "--yes"],
    },
    {
      name: "server connect",
      flags: [],
    },
    {
      name: "server connect threads",
      flags: [
        "--app-id",
        "--request-id",
        "--app-secret-stdin",
        "--restart",
        "--timeout-ms",
        "--interval-ms",
      ],
    },
    {
      name: "server publish",
      flags: [],
    },
    {
      name: "server publish threads",
      flags: ["--input", "--request-id", "--wait-timeout-ms", "--interval-ms", "--yes"],
    },
    {
      name: "server ci",
      flags: [],
    },
    {
      name: "server ci setup",
      flags: [],
    },
    {
      name: "server ci setup github",
      flags: ["--repo", "--ci-token-stdin", "--yes"],
    },
  ] satisfies CliCommandSurface[],
} as const;

/**
 * The five platforms the local CLI publishes to, their CSS marks and the public
 * destination the footer links to. The homepage names them and nothing more:
 * limits and credential groups belong to the platform's own documentation, not
 * to a marketing one-liner.
 */
export type Platform = {
  /** Platform key used by a local publish document and by the CSS modifier. */
  id: string;
  name: string;
  /** CSS modifier for the local platform card, `app-icon--<icon>`. */
  icon: string;
  /** Public destination the footer links to. */
  url: string;
  /**
   * Short typographic label for a card with no local mark asset. A platform
   * that ships a mask asset leaves this unset and renders the mark instead.
   */
  label?: string;
};

export const platforms: Platform[] = [
  { id: "bluesky", name: "Bluesky", icon: "bluesky", url: "https://bsky.app" },
  { id: "threads", name: "Threads", icon: "threads", url: "https://www.threads.net" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin", url: "https://www.linkedin.com" },
  { id: "mastodon", name: "Mastodon", icon: "mastodon", url: "https://joinmastodon.org" },
  { id: "devto", name: "DEV.to", icon: "devto", url: "https://dev.to" },
];

export type NavItem = {
  label: string;
  href: string;
};

/** Site navigation. Cross-site links carry the docs placeholder origin. */
export const primaryNav: NavItem[] = [
  { label: "Workflow", href: "/#workflow" },
  { label: "Platforms", href: "/#platforms" },
  { label: "FAQ", href: "/#faq" },
  { label: "Docs", href: `${ORIGIN_PLACEHOLDERS.docs}/` },
  { label: "GitHub", href: PRODUCT_REPOSITORY },
];

export const primaryNavZh: NavItem[] = [
  { label: "工作流", href: "/zh/#workflow" },
  { label: "平台", href: "/zh/#platforms" },
  { label: "常见问题", href: "/zh/#faq" },
  { label: "文档", href: `${ORIGIN_PLACEHOLDERS.docs}/zh/` },
  { label: "GitHub", href: PRODUCT_REPOSITORY },
];

export const primaryNavByLocale: Record<Locale, NavItem[]> = {
  en: primaryNav,
  zh: primaryNavZh,
};

export type FooterGroup = {
  title: string;
  items: NavItem[];
};

export const footerGroups: FooterGroup[] = [
  {
    title: "Documentation",
    items: [
      { label: "Docs", href: `${ORIGIN_PLACEHOLDERS.docs}/` },
      { label: "CLI reference", href: `${ORIGIN_PLACEHOLDERS.docs}/reference/cli/` },
      { label: "Platform guides", href: `${ORIGIN_PLACEHOLDERS.docs}/platforms/` },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "Source code", href: PRODUCT_REPOSITORY },
      { label: "Issues", href: `${PRODUCT_REPOSITORY}/issues` },
      { label: "License", href: PRODUCT_LICENSE_URL },
    ],
  },
  {
    title: "Platforms",
    items: platforms.map((platform) => ({ label: platform.name, href: platform.url })),
  },
  {
    title: "Product",
    items: [
      { label: "Workflow", href: "/#workflow" },
      { label: "Platforms", href: "/#platforms" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

export const footerGroupsZh: FooterGroup[] = [
  {
    title: "文档",
    items: [
      { label: "文档", href: `${ORIGIN_PLACEHOLDERS.docs}/zh/` },
      { label: "CLI 参考", href: `${ORIGIN_PLACEHOLDERS.docs}/zh/reference/cli/` },
      { label: "平台指南", href: `${ORIGIN_PLACEHOLDERS.docs}/zh/platforms/` },
    ],
  },
  {
    title: "项目",
    items: [
      { label: "源代码", href: PRODUCT_REPOSITORY },
      { label: "问题", href: `${PRODUCT_REPOSITORY}/issues` },
      { label: "许可证", href: PRODUCT_LICENSE_URL },
    ],
  },
  {
    title: "平台",
    items: platforms.map((platform) => ({ label: platform.name, href: platform.url })),
  },
  {
    title: "产品",
    items: [
      { label: "工作流", href: "/zh/#workflow" },
      { label: "平台", href: "/zh/#platforms" },
      { label: "常见问题", href: "/zh/#faq" },
    ],
  },
];

export const footerNav: NavItem[] = footerGroups.flatMap((group) => group.items);
export const footerNavZh: NavItem[] = footerGroupsZh.flatMap((group) => group.items);
export const footerGroupsByLocale: Record<Locale, FooterGroup[]> = {
  en: footerGroups,
  zh: footerGroupsZh,
};
export const footerNavByLocale: Record<Locale, NavItem[]> = {
  en: footerNav,
  zh: footerNavZh,
};

export type DocsNavItem = {
  label: string;
  href: string;
  /** Rendered one step in from the group's main entry. */
  sub?: boolean;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

/**
 * Documentation navigation. The docs build injects this into every page, so a
 * new page becomes reachable everywhere by adding one entry here and one page.
 *
 * The group titles are the accepted Q39 information architecture: Getting
 * Started, Platforms, Build and Reference.
 */
export const docsNav: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Overview", href: "/" },
      { label: "Local CLI", href: "/getting-started/local-cli/", sub: true },
      { label: "Self-hosted Server", href: "/getting-started/server/", sub: true },
      { label: "Use with an Agent", href: "/getting-started/agent/", sub: true },
    ],
  },
  {
    title: "Platforms",
    items: [
      { label: "All platforms", href: "/platforms/" },
      { label: "Bluesky", href: "/platforms/bluesky/", sub: true },
      { label: "Threads", href: "/platforms/threads/", sub: true },
      { label: "LinkedIn", href: "/platforms/linkedin/", sub: true },
      { label: "Mastodon", href: "/platforms/mastodon/", sub: true },
      { label: "DEV.to", href: "/platforms/devto/", sub: true },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "Provider plugins", href: "/build/provider-plugins/" },
      { label: "Trust and registry", href: "/build/trust-and-registry/", sub: true },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "CLI", href: "/reference/cli/" },
      { label: "Configuration", href: "/reference/configuration/", sub: true },
      { label: "Credentials", href: "/reference/credentials/", sub: true },
      { label: "Requests and envelopes", href: "/reference/requests/", sub: true },
    ],
  },
];

export const docsNavZh: DocsNavGroup[] = [
  {
    title: "入门",
    items: [
      { label: "概览", href: "/zh/" },
      { label: "本地 CLI", href: "/zh/getting-started/local-cli/", sub: true },
      { label: "自托管服务器", href: "/zh/getting-started/server/", sub: true },
      { label: "与智能体配合使用", href: "/zh/getting-started/agent/", sub: true },
    ],
  },
  {
    title: "平台",
    items: [
      { label: "全部平台", href: "/zh/platforms/" },
      { label: "Bluesky", href: "/zh/platforms/bluesky/", sub: true },
      { label: "Threads", href: "/zh/platforms/threads/", sub: true },
      { label: "LinkedIn", href: "/zh/platforms/linkedin/", sub: true },
      { label: "Mastodon", href: "/zh/platforms/mastodon/", sub: true },
      { label: "DEV.to", href: "/zh/platforms/devto/", sub: true },
    ],
  },
  {
    title: "构建",
    items: [
      { label: "提供商插件", href: "/zh/build/provider-plugins/" },
      { label: "信任与注册表", href: "/zh/build/trust-and-registry/", sub: true },
    ],
  },
  {
    title: "参考",
    items: [
      { label: "CLI", href: "/zh/reference/cli/" },
      { label: "配置", href: "/zh/reference/configuration/", sub: true },
      { label: "凭证", href: "/zh/reference/credentials/", sub: true },
      { label: "请求与信封", href: "/zh/reference/requests/", sub: true },
    ],
  },
];

export const docsNavByLocale: Record<Locale, DocsNavGroup[]> = {
  en: docsNav,
  zh: docsNavZh,
};

/**
 * One authored page. `file` is the built path relative to the app's output
 * directory; `path` is the public URL path used by sitemaps and canonical links.
 */
export type PageEntry = {
  file: string;
  path: string;
  label: string;
};

export const websitePagesEn: PageEntry[] = [{ file: "index.html", path: "/", label: "Home" }];
export const websitePagesZh: PageEntry[] = [{ file: "zh/index.html", path: "/zh/", label: "首页" }];

export const docsPagesEn: PageEntry[] = [
  { file: "index.html", path: "/", label: "Overview" },
  { file: "getting-started/local-cli/index.html", path: "/getting-started/local-cli/", label: "Local CLI" },
  { file: "getting-started/server/index.html", path: "/getting-started/server/", label: "Self-hosted Server" },
  { file: "getting-started/agent/index.html", path: "/getting-started/agent/", label: "Use with an Agent" },
  { file: "platforms/index.html", path: "/platforms/", label: "All platforms" },
  { file: "platforms/bluesky/index.html", path: "/platforms/bluesky/", label: "Bluesky" },
  { file: "platforms/threads/index.html", path: "/platforms/threads/", label: "Threads" },
  { file: "platforms/linkedin/index.html", path: "/platforms/linkedin/", label: "LinkedIn" },
  { file: "platforms/mastodon/index.html", path: "/platforms/mastodon/", label: "Mastodon" },
  { file: "platforms/devto/index.html", path: "/platforms/devto/", label: "DEV.to" },
  { file: "build/provider-plugins/index.html", path: "/build/provider-plugins/", label: "Provider plugins" },
  { file: "build/trust-and-registry/index.html", path: "/build/trust-and-registry/", label: "Trust and registry" },
  { file: "reference/cli/index.html", path: "/reference/cli/", label: "CLI" },
  { file: "reference/configuration/index.html", path: "/reference/configuration/", label: "Configuration" },
  { file: "reference/credentials/index.html", path: "/reference/credentials/", label: "Credentials" },
  { file: "reference/requests/index.html", path: "/reference/requests/", label: "Requests and envelopes" },
];

export const docsPagesZh: PageEntry[] = [
  { file: "zh/index.html", path: "/zh/", label: "概览" },
  { file: "zh/getting-started/local-cli/index.html", path: "/zh/getting-started/local-cli/", label: "本地 CLI" },
  { file: "zh/getting-started/server/index.html", path: "/zh/getting-started/server/", label: "自托管服务器" },
  { file: "zh/getting-started/agent/index.html", path: "/zh/getting-started/agent/", label: "与智能体配合使用" },
  { file: "zh/platforms/index.html", path: "/zh/platforms/", label: "全部平台" },
  { file: "zh/platforms/bluesky/index.html", path: "/zh/platforms/bluesky/", label: "Bluesky" },
  { file: "zh/platforms/threads/index.html", path: "/zh/platforms/threads/", label: "Threads" },
  { file: "zh/platforms/linkedin/index.html", path: "/zh/platforms/linkedin/", label: "LinkedIn" },
  { file: "zh/platforms/mastodon/index.html", path: "/zh/platforms/mastodon/", label: "Mastodon" },
  { file: "zh/platforms/devto/index.html", path: "/zh/platforms/devto/", label: "DEV.to" },
  { file: "zh/build/provider-plugins/index.html", path: "/zh/build/provider-plugins/", label: "提供商插件" },
  { file: "zh/build/trust-and-registry/index.html", path: "/zh/build/trust-and-registry/", label: "信任与注册表" },
  { file: "zh/reference/cli/index.html", path: "/zh/reference/cli/", label: "CLI" },
  { file: "zh/reference/configuration/index.html", path: "/zh/reference/configuration/", label: "配置" },
  { file: "zh/reference/credentials/index.html", path: "/zh/reference/credentials/", label: "凭证" },
  { file: "zh/reference/requests/index.html", path: "/zh/reference/requests/", label: "请求与信封" },
];

export const websitePages: PageEntry[] = [...websitePagesEn, ...websitePagesZh];
export const docsPages: PageEntry[] = [...docsPagesEn, ...docsPagesZh];

export const websitePagesByLocale: Record<Locale, PageEntry[]> = {
  en: websitePagesEn,
  zh: websitePagesZh,
};
export const docsPagesByLocale: Record<Locale, PageEntry[]> = {
  en: docsPagesEn,
  zh: docsPagesZh,
};
