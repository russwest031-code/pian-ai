const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    const value = match[2].replace(/^['"]|['"]$/g, "");
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

loadEnv();
const token = process.env.TMDB_READ_TOKEN || "";
const apiKey = process.env.TMDB_API_KEY || "";
const PORT = Number(process.env.PORT || 4173);
const tmdbConfigured = Boolean(token || apiKey);
const allowedPaths = [/^\/discover\/movie$/, /^\/search\/movie$/, /^\/movie\/\d+$/];
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8" };

function json(res, status, body) {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store"});
  res.end(JSON.stringify(body));
}

async function proxyTmdb(req, res, requestUrl) {
  if (!tmdbConfigured) return json(res, 503, {error:"TMDB credentials are not configured"});
  const apiPath = requestUrl.searchParams.get("path") || "";
  if (!allowedPaths.some(rule => rule.test(apiPath))) return json(res, 400, {error:"Unsupported TMDB path"});
  const target = new URL(`https://api.themoviedb.org/3${apiPath}`);
  requestUrl.searchParams.forEach((value, key) => { if (key !== "path") target.searchParams.set(key, value); });
  if (!token) target.searchParams.set("api_key", apiKey);
  try {
    const headers = {accept:"application/json"};
    if (token) headers.Authorization = `Bearer ${token}`;
    const upstream = await fetch(target, {headers});
    const body = await upstream.text();
    res.writeHead(upstream.status, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"public, max-age=300"});
    res.end(body);
  } catch (error) {
    json(res, 502, {error:"TMDB request failed"});
  }
}

function serveStatic(res, pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(ROOT, requested);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return json(res, 404, {error:"Not found"});
  res.writeHead(200, {"Content-Type":mime[path.extname(filePath)] || "application/octet-stream"});
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  if (requestUrl.pathname === "/api/status") return json(res, 200, {tmdbConfigured});
  if (requestUrl.pathname === "/api/tmdb") return proxyTmdb(req, res, requestUrl);
  serveStatic(res, decodeURIComponent(requestUrl.pathname));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`偏爱已启动：http://127.0.0.1:${PORT}`);
  console.log(tmdbConfigured ? "TMDB 片库已配置。" : "尚未配置 TMDB 凭证，当前使用演示片库。");
});
