// Loopback static server for one built app.
//
// Requests are GET/HEAD only, resolved through `realpath` and confined to the
// document root, filtered by the publishable-extension allowlist, and never
// answered with a directory listing. No outbound request is made on behalf of a
// client and no source, map, Markdown or environment file can be served.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { lstat, readFile, realpath, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { CONTENT_TYPES, PUBLISHABLE_EXTENSIONS, isIgnoredName } from "./files.ts";

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "cache-control": "no-store, no-transform",
  "x-content-type-options": "nosniff",
};

/** Hosts this server is willing to bind: loopback only, by literal address. */
export const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(["127.0.0.1", "::1"]);

export type StaticServerOptions = {
  label: string;
  root: string;
  host?: string;
  port?: number;
};

export type RunningServer = {
  label: string;
  root: string;
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
};

function send(
  res: ServerResponse,
  status: number,
  body: string,
  extra: Record<string, string> = {},
): void {
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    "content-type": "text/plain; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...extra,
  });
  res.end(body);
}

function isInside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(root + sep);
}

async function realRootFor(root: string): Promise<string | null> {
  try {
    return await realpath(root);
  } catch {
    return null;
  }
}

/** True when the document root itself is a symlink. Ancestor symlinks are fine. */
async function isSymlinkedRoot(root: string): Promise<boolean> {
  try {
    return (await lstat(root)).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Segments of `candidate` relative to `root`, or null when it is outside.
 * Hidden segments after symlink resolution are refused separately, so a
 * harmless-looking alias cannot expose a hidden directory.
 */
function relativeSegments(root: string, candidate: string): string[] | null {
  const rel = relative(root, candidate);
  if (rel === "") {
    return [];
  }
  if (rel.startsWith("..") || rel.startsWith(sep)) {
    return null;
  }
  return rel.split(sep);
}

export function createStaticHandler(options: { label: string; root: string }) {
  const { label, root } = options;

  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "HEAD") {
      send(res, 405, "Method Not Allowed\n", { allow: "GET, HEAD" });
      return;
    }

    const rawUrl = req.url ?? "/";
    const hashIndex = rawUrl.indexOf("#");
    const withoutHash = hashIndex === -1 ? rawUrl : rawUrl.slice(0, hashIndex);
    const queryIndex = withoutHash.indexOf("?");
    const rawPath = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
    const query = queryIndex === -1 ? "" : withoutHash.slice(queryIndex);

    // A backslash is never a path separator in a URL.
    if (rawPath.includes("\\")) {
      send(res, 403, "Forbidden\n");
      return;
    }

    let pathname: string;
    try {
      pathname = decodeURIComponent(rawPath);
    } catch {
      send(res, 400, "Bad Request\n");
      return;
    }

    if (pathname.includes("\0")) {
      send(res, 400, "Bad Request\n");
      return;
    }
    if (pathname.includes("\\")) {
      send(res, 403, "Forbidden\n");
      return;
    }
    if (!pathname.startsWith("/")) {
      send(res, 400, "Bad Request\n");
      return;
    }
    // A path starting with "//" is protocol-relative in a browser: redirecting
    // `//host/dir` to `//host/dir/` would hand the visitor to another origin.
    if (pathname.startsWith("//")) {
      send(res, 400, "Bad Request\n");
      return;
    }
    // Residual percent-encoding of separators or dots would only turn into a
    // path separator after a second decode somewhere else.
    if (/%2e|%2f|%5c/i.test(pathname)) {
      send(res, 403, "Forbidden\n");
      return;
    }

    for (const segment of pathname.split("/").slice(1)) {
      if (segment === "." || segment === "..") {
        send(res, 403, "Forbidden\n");
        return;
      }
      if (segment.startsWith(".")) {
        send(res, 404, "Not Found\n");
        return;
      }
    }

    const rootReal = await realRootFor(root);
    if (rootReal === null) {
      send(res, 503, `${label} has no build output yet\n`);
      return;
    }
    // The document root must be a real directory. Adopting the target of a
    // symlinked root would silently widen the served tree.
    if (await isSymlinkedRoot(root)) {
      send(res, 403, "Forbidden\n");
      return;
    }

    const candidate = resolve(rootReal, "." + pathname);
    if (!isInside(rootReal, candidate)) {
      send(res, 403, "Forbidden\n");
      return;
    }

    let target: string;
    try {
      target = await realpath(candidate);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP") {
        send(res, 404, "Not Found\n");
        return;
      }
      send(res, 500, "Internal Server Error\n");
      return;
    }

    // realpath resolves symlinks, so this also rejects links leaving the root.
    const targetSegments = relativeSegments(rootReal, target);
    if (targetSegments === null) {
      send(res, 403, "Forbidden\n");
      return;
    }
    // Hidden segments are refused after resolution too, so an alias cannot
    // reach a hidden directory such as `.git`.
    if (targetSegments.some((segment) => segment.startsWith("."))) {
      send(res, 404, "Not Found\n");
      return;
    }

    const info = await stat(target);
    let file = target;
    if (info.isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(301, { ...SECURITY_HEADERS, location: pathname + "/" + query });
        res.end();
        return;
      }
      try {
        file = await realpath(join(target, "index.html"));
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ENOENT" || code === "ENOTDIR") {
          send(res, 404, "Not Found\n");
          return;
        }
        send(res, 500, "Internal Server Error\n");
        return;
      }
      if (!isInside(rootReal, file)) {
        send(res, 403, "Forbidden\n");
        return;
      }
      const indexSegments = relativeSegments(rootReal, file);
      if (indexSegments === null || indexSegments.some((segment) => segment.startsWith("."))) {
        send(res, 404, "Not Found\n");
        return;
      }
      const indexInfo = await stat(file);
      if (!indexInfo.isFile()) {
        send(res, 404, "Not Found\n");
        return;
      }
    } else if (!info.isFile()) {
      send(res, 404, "Not Found\n");
      return;
    }

    const extension = extname(file).toLowerCase();
    if (!PUBLISHABLE_EXTENSIONS.has(extension) || isIgnoredName(file)) {
      send(res, 404, "Not Found\n");
      return;
    }

    let payload: Buffer;
    try {
      payload = await readFile(file);
    } catch {
      send(res, 500, "Internal Server Error\n");
      return;
    }

    res.writeHead(200, {
      ...SECURITY_HEADERS,
      "content-type": CONTENT_TYPES[extension] ?? "application/octet-stream",
      "content-length": payload.byteLength,
    });
    if (method === "HEAD") {
      res.end();
      return;
    }
    res.end(payload);
  };
}

/** Start one loopback server. `port: 0` picks an ephemeral port. */
export async function startStaticServer(options: StaticServerOptions): Promise<RunningServer> {
  const host = options.host ?? "127.0.0.1";
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(`${options.label} must bind a loopback address (127.0.0.1 or ::1), not ${host}`);
  }
  if (await isSymlinkedRoot(options.root)) {
    throw new Error(`${options.label} refuses to serve the symlinked document root ${options.root}`);
  }
  const requestedPort = options.port ?? 0;
  const handler = createStaticHandler({ label: options.label, root: options.root });

  const server: Server = createServer((req, res) => {
    handler(req, res).catch(() => {
      if (res.headersSent) {
        res.end();
        return;
      }
      send(res, 500, "Internal Server Error\n");
    });
  });

  try {
    await new Promise<void>((done, fail) => {
      server.once("error", fail);
      server.listen(requestedPort, host, () => {
        server.off("error", fail);
        done();
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${options.label} could not bind http://${host}:${requestedPort}/ - ${message}`);
  }

  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : requestedPort;

  return {
    label: options.label,
    root: options.root,
    host,
    port,
    url: `http://${host}:${port}/`,
    close: () =>
      new Promise<void>((done, fail) => {
        server.close((error) => (error ? fail(error) : done()));
      }),
  };
}

/**
 * Start several servers as one unit.
 *
 * A partially started pair is the practical failure mode for local previews: if
 * the second port is already occupied, the first listener must be closed before
 * the error is reported, otherwise the process would keep running with a half
 * started preview.
 */
export async function startStaticServers(
  options: ReadonlyArray<StaticServerOptions>,
): Promise<RunningServer[]> {
  const started: RunningServer[] = [];
  try {
    for (const option of options) {
      started.push(await startStaticServer(option));
    }
  } catch (error) {
    await Promise.all(started.map((server) => server.close().catch(() => undefined)));
    throw error;
  }
  return started;
}

/** Register shutdown handlers that close every server once. */
export function closeOnShutdown(servers: ReadonlyArray<RunningServer>): void {
  const stop = async (): Promise<void> => {
    await Promise.all(servers.map((server) => server.close().catch(() => undefined)));
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
