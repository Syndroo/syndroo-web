// Server fixtures: path handling, method limits and the extension allowlist.
//
// The fixture directory is temporary, the port is ephemeral and nothing in this
// file talks to a network service or a real API.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after, before } from "node:test";

import {
  startStaticServer,
  startStaticServers,
  type RunningServer,
} from "../scripts/lib/static-server.ts";

const INDEX_HTML =
  '<!doctype html>\n<html lang="en">\n<head><title>Server fixture</title></head>\n<body><h1>Server fixture marker</h1></body>\n</html>\n';
const NESTED_HTML =
  '<!doctype html>\n<html lang="en">\n<head><title>Nested fixture</title></head>\n<body><h1>Nested fixture marker</h1></body>\n</html>\n';

let root = "";
let outsideRoot = "";
let server: RunningServer;

before(async () => {
  root = await mkdtemp(join(tmpdir(), "syndroo-server-"));
  outsideRoot = await mkdtemp(join(tmpdir(), "syndroo-server-outside-"));

  await mkdir(join(root, "nested"), { recursive: true });
  await mkdir(join(root, "assets"), { recursive: true });
  await mkdir(join(root, ".git"), { recursive: true });

  await writeFile(join(root, "index.html"), INDEX_HTML);
  await writeFile(join(root, "nested/index.html"), NESTED_HTML);
  await writeFile(join(root, "assets/logo.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>\n');
  await writeFile(join(root, "app.js"), "export const marker = 'generated browser script';\n");
  await writeFile(join(root, "data.json"), '{ "marker": true }\n');
  await writeFile(join(root, "notes.md"), "# Private notes\n");
  await writeFile(join(root, "source.ts"), "export const leaked = true;\n");
  await writeFile(join(root, "app.js.map"), '{ "version": 3 }\n');
  await writeFile(join(root, ".env"), "SECRET=must-not-serve\n");
  await writeFile(join(root, "package.json"), '{ "name": "must-not-serve" }\n');
  await writeFile(join(root, "tsconfig.json"), '{ "compilerOptions": {} }\n');
  await writeFile(join(root, ".git/config"), "[core]\n\trepositoryformatversion = 0\n");
  await writeFile(join(outsideRoot, "secret.txt"), "must-not-serve\n");
  await symlink(join(outsideRoot, "secret.txt"), join(root, "escape.txt"));

  server = await startStaticServer({ label: "Fixture", root, host: "127.0.0.1", port: 0 });
});

after(async () => {
  if (server !== undefined) {
    await server.close();
  }
  await rm(root, { recursive: true, force: true });
  await rm(outsideRoot, { recursive: true, force: true });
});

function get(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(new URL(path, server.url), { redirect: "manual", ...init });
}

function rawRequest(path: string, method = "GET"): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: server.host, port: server.port, path, method }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode ?? 0));
    });
    req.on("error", reject);
    req.end();
  });
}

function assertSecurityHeaders(response: Response): void {
  const cacheControl = response.headers.get("cache-control") ?? "";
  assert.match(cacheControl, /no-store/);
  assert.match(cacheControl, /no-transform/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
}

test("the server binds an ephemeral loopback port for the fixture", () => {
  assert.equal(server.host, "127.0.0.1");
  assert.ok(server.port > 0, "an ephemeral port should be assigned");
  assert.equal(server.url, `http://127.0.0.1:${server.port}/`);
});

test("pages, assets and generated scripts are served with security headers", async () => {
  const home = await get("/");
  assert.equal(home.status, 200);
  assert.match(home.headers.get("content-type") ?? "", /^text\/html/);
  assertSecurityHeaders(home);
  const body = await home.text();
  assert.match(body, /Server fixture marker/);
  assert.equal(home.headers.get("content-length"), String(Buffer.byteLength(body)));

  const nested = await get("/nested/");
  assert.equal(nested.status, 200);
  assert.match(await nested.text(), /Nested fixture marker/);

  const svg = await get("/assets/logo.svg");
  assert.equal(svg.status, 200);
  assert.equal(svg.headers.get("content-type"), "image/svg+xml");

  const script = await get("/app.js");
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type") ?? "", /^text\/javascript/);
  assert.match(await script.text(), /generated browser script/);

  const json = await get("/data.json");
  assert.equal(json.status, 200);
  assert.equal(json.headers.get("content-type"), "application/json; charset=utf-8");
});

test("HEAD returns headers without a body and other methods are refused", async () => {
  const head = await get("/", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const response = await get("/", { method });
    assert.equal(response.status, 405, `${method} should be refused`);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assertSecurityHeaders(response);
    await response.text();
  }
});

test("a directory without a trailing slash redirects and unknown paths are 404", async () => {
  const redirect = await get("/nested");
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "/nested/");

  const missing = await get("/nested/missing.html");
  assert.equal(missing.status, 404);
  assertSecurityHeaders(missing);
  await missing.text();

  const emptyRedirect = await get("/nested?x=1");
  assert.equal(emptyRedirect.status, 301);
  assert.equal(emptyRedirect.headers.get("location"), "/nested/?x=1");
});

test("traversal, encoded separators and hidden paths are refused", async () => {
  // `fetch` normalizes a percent-encoded double-dot segment before sending it,
  // so traversal attempts are issued as raw HTTP requests instead: these are the
  // paths a hostile client can actually put on the wire.
  for (const path of [
    "/%2e%2e/",
    "/%2E%2E/",
    "/%2e%2e%2fescape.txt",
    "/nested/%2e%2e/index.html",
    "/..%2f..%2fetc%2fpasswd",
  ]) {
    assert.equal(await rawRequest(path), 403, `${path} should be forbidden`);
  }

  for (const path of ["/.env", "/.git/config", "/nested/.hidden"]) {
    const response = await get(path);
    assert.equal(response.status, 404, `${path} should not be found`);
    await response.text();
  }
});

test("malformed encodings, NUL bytes and backslashes are refused", async () => {
  for (const path of ["/%zz", "/index.html%zz", "/%e0%a4%a"]) {
    const response = await get(path);
    assert.equal(response.status, 400, `${path} should be a bad request`);
    await response.text();
  }

  for (const path of ["/%00", "/index.html%00"]) {
    const response = await get(path);
    assert.equal(response.status, 400, `${path} should be a bad request`);
    await response.text();
  }

  const encoded = await get("/%5c..%5cescape.txt");
  assert.equal(encoded.status, 403);
  await encoded.text();

  assert.equal(await rawRequest("/nested\\index.html"), 403, "a literal backslash should be forbidden");
});

test("sources, maps, environment files and symlink escapes are never served", async () => {
  for (const path of ["/notes.md", "/source.ts", "/app.js.map", "/package.json", "/tsconfig.json"]) {
    const response = await get(path);
    assert.equal(response.status, 404, `${path} must not be served`);
    await response.text();
  }

  const escape = await get("/escape.txt");
  assert.equal(escape.status, 403, "a symlink leaving the document root must be refused");
  await escape.text();
});

test("a protocol-relative request path is refused instead of redirected", async () => {
  // `//nested` would otherwise redirect to `//nested/`, which a browser reads as
  // another origin entirely.
  assert.equal(await rawRequest("//nested"), 400);
  assert.equal(await rawRequest("//nested/"), 400);
  assert.equal(await rawRequest("//"), 400);

  // The ordinary directory redirect still works and stays same-origin.
  const redirect = await get("/nested");
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "/nested/");
});

test("an alias into a hidden directory is refused", async () => {
  const hidden = join(root, ".hidden");
  await mkdir(hidden, { recursive: true });
  await writeFile(join(hidden, "secret.txt"), "must-not-serve\n");
  await symlink(hidden, join(root, "alias"));

  for (const path of ["/alias/secret.txt", "/alias", "/alias/"]) {
    const response = await get(path);
    assert.equal(response.status, 404, `${path} must not expose a hidden directory`);
    await response.text();
  }
});

test("a symlinked document root is refused at startup and at request time", async () => {
  const target = await mkdtemp(join(tmpdir(), "syndroo-root-target-"));
  const link = await mkdtemp(join(tmpdir(), "syndroo-root-link-"));
  await writeFile(join(target, "index.html"), INDEX_HTML);

  try {
    await rm(link, { recursive: true, force: true });
    await symlink(target, link);

    await assert.rejects(
      () => startStaticServer({ label: "Linked", root: link, host: "127.0.0.1", port: 0 }),
      /symlinked document root/,
    );

    // The same content served from its real path is unaffected.
    const direct = await startStaticServer({ label: "Direct", root: target, host: "127.0.0.1", port: 0 });
    try {
      const response = await fetch(direct.url);
      assert.equal(response.status, 200);
      await response.text();
    } finally {
      await direct.close();
    }
  } finally {
    await rm(target, { recursive: true, force: true });
    await rm(link, { recursive: true, force: true });
  }
});

test("only loopback bind addresses are accepted", async () => {
  for (const host of ["0.0.0.0", "localhost", "192.168.1.10", "::"]) {
    await assert.rejects(
      () => startStaticServer({ label: "Fixture", root, host, port: 0 }),
      /loopback address/,
      `${host} should be refused`,
    );
  }
});

test("a partially started server pair closes the listener it already opened", async () => {
  // Occupy a port, then ask for a pair whose second port is that occupied port.
  const blocker = await startStaticServer({ label: "Blocker", root, host: "127.0.0.1", port: 0 });
  const reserve = await startStaticServer({ label: "Reserve", root, host: "127.0.0.1", port: 0 });
  const freePort = reserve.port;
  await reserve.close();

  try {
    await assert.rejects(
      () =>
        startStaticServers([
          { label: "First", root, host: "127.0.0.1", port: freePort },
          { label: "Second", root, host: "127.0.0.1", port: blocker.port },
        ]),
      /Second could not bind/,
    );

    // The first listener must be gone: its port can be bound again at once.
    const rebound = await startStaticServer({ label: "Rebound", root, host: "127.0.0.1", port: freePort });
    assert.equal(rebound.port, freePort);
    const response = await fetch(rebound.url);
    assert.equal(response.status, 200);
    await response.text();
    await rebound.close();
  } finally {
    await blocker.close();
  }
});
