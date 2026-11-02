import type { Metadata } from "next";
import {
  ORIGIN_PLACEHOLDERS,
  PRODUCT_REPOSITORY,
  platforms,
  versions,
} from "@syndroo/content/site-data";

const DESCRIPTION =
  "Syndroo 是一个命令行工具，可从你的机器或自托管部署发布同一份文档：纯文本发送到 Bluesky、Threads、LinkedIn 和 Mastodon，文章发送到 DEV.to。";

export const metadata: Metadata = {
  title: "Syndroo - 从终端发布到五个平台",
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/",
    languages: {
      en: "/",
      "zh-CN": "/zh/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: "/zh/",
    title: "Syndroo - 从终端发布到五个平台",
    description: DESCRIPTION,
  },
  twitter: { card: "summary" },
};

const docs = `${ORIGIN_PLACEHOLDERS.docs}/zh`;

const facts = [
  {
    term: "以命令方式运行",
    detail: "通过构建此仓库安装，而不是从包注册表安装。",
  },
  {
    term: "直接走本地链路",
    detail: "本地 CLI 直接访问平台 API，中间没有 Syndroo 服务。",
  },
  {
    term: "可选自托管",
    detail: "Threads 工作流可以运行在你自己的 Cloudflare 账户中的部署上。",
  },
];

const faq = [
  {
    question: "Syndroo 已经发布了吗？",
    answer: `${versions.cli} 仍未发布，是候选版本，真实账号验收也尚未完成。目前不能从包注册表安装，因此运行它的方式是从源码构建。`,
  },
  {
    question: "它可以发布到哪些平台？",
    answer:
      "五个官方提供商。Bluesky、Threads、LinkedIn 和 Mastodon 发布纯文本，DEV.to 发布文章。请求只携带一次内容，并通过 targets 列表指定提供商；需要时，还会指定连接和提供商选项。",
  },
  {
    question: "我的凭证保存在哪里？",
    answer:
      "在你的机器上，绝不会进入发布请求。连接只会读取一次凭证，来源是环境变量 SYNDROO_CREDENTIALS 或你拥有的私有文件，随后由本地凭证存储保存。发布过程不会重新读取环境变量或文件。",
  },
  {
    question: "试运行实际会做什么？",
    answer:
      "syndroo publish --input post.json --dry-run --json 会冻结并校验请求，打印预览，然后退出。它是可选的只读操作：不获取写入锁、不解析凭证、不发起网络请求，也不写入本地状态。",
  },
  {
    question: "发布时会发送什么？",
    answer:
      "请求准备时会冻结内容。确认后会发送完全相同的冻结预览，因此之后再修改文件不会改变即将发送的内容；重新准备则是另一个具有自身标识的新请求。",
  },
  {
    question: "我可以用一个命令完成准备和发布吗？",
    answer:
      "可以。syndroo publish --input post.json --yes --json 会在一次调用中准备、确认并执行，只打印一个最终信封，不再返回第二个准备结果，也不返回批准令牌。不带 --yes 的同一 --json 调用只返回准备结果，不发送任何内容。",
  },
  {
    question: "会涉及 Syndroo 服务器吗？",
    answer:
      "本地链路会从你的机器直接访问平台 API。对于 Threads，你可以将 Syndroo 服务器部署到你自己的 Cloudflare 账户，连接账号，然后手动发布或从 GitHub CI 发布。SDK 不在本文档范围内。",
  },
  {
    question: "如何查看一次运行的结果？",
    answer:
      "syndroo status --operation <operationId> --json 会报告该操作以及每个目标的一次投递。投递状态可能是 succeeded；带 not-applied 处置的 failed；unknown；或者目标从未开始时出现的 not sent。未知写入绝不会自动重试。",
  },
];

export default function ChineseIndexPage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="shell">
          <h1 className="hero__title" id="hero-title">
            <span className="title__ink">一次写作，</span>{" "}
            <span className="title__dim">多处发布</span>
          </h1>
          <p className="lead hero__lede">
            草稿就是仓库中的一个纯文本文件。{" "}
            <strong>Syndroo 读取这个文件并发布内容</strong>，将纯文本发送到 Bluesky、Threads、
            LinkedIn 和 Mastodon，将文章发送到 DEV.to，全程从终端完成。
          </p>
          <div className="hero__cta">
            <a className="button button--primary button--lg" href={`${PRODUCT_REPOSITORY}#readme`}>
              从源码构建
            </a>
            <a className="button button--ghost button--lg" href={`${docs}/getting-started/server/`}>
              服务器设置
            </a>
          </div>
          <p className="note-line">
            v{versions.cli} &middot; 未发布候选版本 &middot; 真实账号验收仍待完成
          </p>
        </div>
      </section>

      <section className="platforms" id="platforms" aria-labelledby="platforms-title">
        <div className="shell">
          <h2 className="title title--left" id="platforms-title">
            <span className="title__ink">一份草稿。</span>
            <br />
            <span className="title__dim">多个目的地。</span>
          </h2>
          <div className="app-cards">
            {platforms.map((platform) => (
              <a
                className="app-card"
                key={platform.id}
                href={`${docs}/platforms/${platform.id}/`}
              >
                <span className={`app-icon app-icon--${platform.icon}`} aria-hidden="true">
                  {platform.label === undefined ? (
                    <span className={`mark mark--white mark--${platform.icon}`}></span>
                  ) : (
                    <span className="app-icon__text">{platform.label}</span>
                  )}
                </span>
                <span className="app-card__name">{platform.name}</span>
              </a>
            ))}
          </div>
          <div className="platform-copy">
            <p>
              从一份文档发布：向 Bluesky 和 Threads 发送纯文本，从个人 LinkedIn 资料发布纯文本，
              发布公开 Mastodon 状态，以及发布公开的个人 DEV.to 文章。请求使用严格 JSON：
              <code>content.text</code> 只携带一次文本，<code>targets</code> 指定每个目的地，并通过可选的
              每目标 <code>options</code> 为需要的平台提供设置。文章目标使用自己的{" "}
              <code>title</code> 和 <code>body_markdown</code> 选项。
            </p>
            <p className="platform-fact">
              LinkedIn 个人账号 &middot; Mastodon 公开状态 &middot; DEV.to 公开文章
            </p>
          </div>
        </div>
      </section>

      <section className="publish" id="workflow" aria-labelledby="publish-title">
        <div className="shell">
          <h2 className="title title--center" id="publish-title">
            发布
          </h2>
          <div className="rows">
            <article className="row">
              <div className="row__copy">
                <h3>编写请求</h3>
                <p>
                  请求是你放在项目旁边的小型 JSON 文件。<code>content</code> 是文本，
                  <code>targets</code> 指定发送位置。
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">输入文件</span>
                  <span className="tag">示例</span>
                </div>
                <div className="panel panel--flat">
                  <p className="panel__head">post.json</p>
                  <pre className="code">
                    {"{\n  "}
                    <span className="code__key">&quot;content&quot;</span>
                    {": { "}
                    <span className="code__key">&quot;text&quot;</span>
                    {": "}
                    <span className="code__str">&quot;一份文档，选定目标。&quot;</span>
                    {" },\n  "}
                    <span className="code__key">&quot;targets&quot;</span>
                    {": ["}
                    {"{ "}
                    <span className="code__key">&quot;provider&quot;</span>
                    {": "}
                    <span className="code__str">&quot;bluesky&quot;</span>
                    {" }, { "}
                    <span className="code__key">&quot;provider&quot;</span>
                    {": "}
                    <span className="code__str">&quot;linkedin&quot;</span>
                    {" }"}
                    {"]\n}"}
                  </pre>
                </div>
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>发送前预览</h3>
                <p>
                  试运行会冻结并校验请求，然后停止。它是可选的只读操作：不发起网络请求、不解析凭证，
                  也不写入本地状态。
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">试运行</span>
                  <span className="tag">示意</span>
                </div>
                <div className="term">
                  <div className="term__bar">
                    <i></i>
                    <i></i>
                    <i></i>
                    <em>试运行</em>
                  </div>
                  <p>
                    <span className="term__prompt">$</span> syndroo publish --input post.json
                    --dry-run --json
                  </p>
                </div>
                <div className="panel">
                  试运行 &middot; 无网络请求 &middot; 无本地状态
                  <span className="panel__note">
                    继续之前，请检查打印的文本和目标账号。稍后准备请求时，会冻结当时读取的输入。
                  </span>
                </div>
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>确认后发布</h3>
                <p>
                  发布分为两个阶段。准备会冻结内容并返回一次性批准令牌；执行会消费该令牌，
                  只发送完全相同的冻结预览。
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">发送</span>
                  <span className="tag">示意</span>
                </div>
                <div className="term">
                  <div className="term__bar">
                    <i></i>
                    <i></i>
                    <i></i>
                    <em>publish</em>
                  </div>
                  <p>
                    <span className="term__prompt">$</span> syndroo publish --input post.json
                  </p>
                  <p>
                    <span className="term__out">
                      已冻结的预览 &middot; 一个批准令牌 &middot; 尚未发送
                    </span>
                  </p>
                  <p>
                    <span className="term__prompt">$</span> syndroo publish --input - &lt;
                    execute.json
                  </p>
                </div>
                <div className="panel">
                  准备后再修改文件，不会改变即将发送的内容。
                  <span className="panel__note">执行阶段只能从标准输入读取。</span>
                </div>
              </div>
            </article>

            <article className="row">
              <div className="row__copy">
                <h3>检查结果</h3>
                <p>
                  发布结果带有操作 ID。读取它是只读查询，并且绝不访问平台：
                  <code>syndroo status --operation &lt;operationId&gt;</code>。
                </p>
              </div>
              <div className="visual">
                <div className="visual__head">
                  <span className="visual__title">状态</span>
                  <span className="tag">示意</span>
                </div>
                <div className="term">
                  <div className="term__bar">
                    <i></i>
                    <i></i>
                    <i></i>
                    <em>status</em>
                  </div>
                  <p>
                    <span className="term__prompt">$</span> syndroo status --operation
                    &lt;operationId&gt; --json
                  </p>
                </div>
                <div className="panel">
                  <pre className="receipt">
                    <span className="code__key">operationId</span>
                    {"  <operationId>\n"}
                    <span className="code__key">status</span>
                    {"       succeeded\n"}
                    <span className="code__key">每个目标</span>
                    {"   deliveryId \u00b7 attempts \u00b7 outcome"}
                  </pre>
                  <span className="panel__note">
                    未知结果会报告为 unknown，绝不会自动重试。此候选版本的真实账号验收仍待完成。
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="local" aria-labelledby="local-title">
        <div className="local__band">
          <div className="shell">
            <h2 className="title title--center" id="local-title">
              <span className="title__ink">为本地使用</span>{" "}
              <span className="title__dim">而设计</span>
            </h2>
            <p className="lead lead--center">
              草稿是你磁盘上的文件。Syndroo 只在你运行它时读取，并使用你已有的凭证发送。
              发生的一切都由你输入的最后一个命令决定。
            </p>
            <ul className="local__facts">
              {facts.map((fact) => (
                <li key={fact.term}>
                  <strong>{fact.term}</strong>
                  <span>{fact.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="workflow" aria-labelledby="workflow-title">
        <div className="shell">
          <div className="split">
            <div className="split__copy">
              <h2 className="title title--left" id="workflow-title">
                <span className="title__ink">你的工作流，</span>
                <br />
                <span className="title__dim">你的终端。</span>
              </h2>
              <p>
                没有仪表盘，也不需要一直打开浏览器标签页。编辑文件、运行命令、读取结果。
                你的编辑器、Shell 和自己的平台凭证始终掌握控制权。
              </p>
              <a className="button button--ghost" href="#workflow">
                查看命令
              </a>
            </div>
            <div className="terminal">
              <div className="term__bar">
                <i></i>
                <i></i>
                <i></i>
                <em>示意</em>
              </div>
              <p>
                <span className="term__prompt">$</span> $EDITOR post.json
              </p>
              <p>
                <span className="term__prompt">$</span> syndroo publish --input post.json --dry-run
                --json
              </p>
              <p>
                <span className="term__out">
                  试运行 &middot; 无网络请求 &middot; 无本地状态
                </span>
              </p>
              <span className="terminal__gap"></span>
              <p>
                <span className="term__prompt">$</span> syndroo publish --input post.json
              </p>
              <p>
                <span className="term__out">
                  已冻结 &middot; 等待确认 &middot; 发布到 bluesky, linkedin
                </span>
              </p>
              <span className="terminal__gap"></span>
              <p>
                <span className="term__prompt">$</span> syndroo status --operation
                &lt;operationId&gt; --json
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="faq" id="faq" aria-labelledby="faq-title">
        <div className="shell shell--narrow">
          <h2 className="title title--center" id="faq-title">
            常见问题
          </h2>
          <p className="lead lead--center">
            这个候选版本目前的状态，以及读者最常询问的问题。
          </p>
          <div className="faq__list">
            {faq.map((item) => (
              <details className="faq__item" key={item.question}>
                <summary>
                  {item.question}
                  <span className="chevron" aria-hidden="true"></span>
                </summary>
                <div className="faq__body">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="get-started" id="get-started" aria-labelledby="get-started-title">
        <div className="shell">
          <img
            className="mascot get-started__mascot"
            src="/assets/droo-success.png"
            alt=""
            width="116"
            height="116"
            decoding="async"
          />
          <h2 className="title title--hero" id="get-started-title">
            准备好开始了吗
          </h2>
          <p className="lead lead--center">
            从源码构建候选版本，然后从终端发布第一条内容。
          </p>
          <div className="get-started__actions">
            <a className="button button--primary button--lg" href={`${PRODUCT_REPOSITORY}#readme`}>
              开始
            </a>
            <a className="button button--ghost button--lg" href={`${docs}/getting-started/server/`}>
              服务器设置
            </a>
          </div>
          <p className="note-line">
            v{versions.cli} &middot; 从源码构建 &middot; 未发布候选版本 &middot;
            真实账号验收仍待完成
          </p>
        </div>
      </section>
    </>
  );
}
