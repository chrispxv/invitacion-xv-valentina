import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const outputDir = resolve(projectRoot, "dist", "server");
const [html, css, javascript, preview] = await Promise.all([
  readFile(resolve(projectRoot, "index.html"), "utf8"),
  readFile(resolve(projectRoot, "styles.css"), "utf8"),
  readFile(resolve(projectRoot, "script.js"), "utf8"),
  readFile(resolve(projectRoot, "assets", "images", "preview.jpg"))
]);

const worker = `const INDEX_HTML = ${JSON.stringify(html)};
const STYLES = ${JSON.stringify(css)};
const SCRIPT = ${JSON.stringify(javascript)};
const PREVIEW_BASE64 = ${JSON.stringify(preview.toString("base64"))};

function binaryFromBase64(value) {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

function withHeaders(body, contentType, cacheControl = "public, max-age=300") {
  return new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": cacheControl,
      "x-content-type-options": "nosniff"
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\\/+$/, "") || "/";

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }

    if (path === "/" || path === "/index.html") {
      const socialImage = url.origin + "/assets/images/preview.jpg";
      const page = INDEX_HTML.replace(
        '<meta property="og:image" content="./assets/images/preview.jpg">',
        '<meta property="og:image" content="' + socialImage + '">' 
      );
      return withHeaders(request.method === "HEAD" ? null : page, "text/html; charset=utf-8", "no-cache");
    }

    if (path === "/styles.css") return withHeaders(request.method === "HEAD" ? null : STYLES, "text/css; charset=utf-8");
    if (path === "/script.js") return withHeaders(request.method === "HEAD" ? null : SCRIPT, "text/javascript; charset=utf-8");
    if (path === "/assets/images/preview.jpg") return withHeaders(request.method === "HEAD" ? null : binaryFromBase64(PREVIEW_BASE64), "image/jpeg", "public, max-age=86400");
    if (path === "/favicon.ico") return new Response(null, { status: 204 });

    return withHeaders("Página no encontrada", "text/plain; charset=utf-8", "no-cache");
  }
};
`;

await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "index.js"), worker, "utf8");
console.log("Sitio estático preparado para publicación.");
