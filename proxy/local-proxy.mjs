// Kimi 代理：本地开发用。key 从环境变量 KIMI_KEY 读取，不要写进文件、不要提交。
// 启动：$env:KIMI_KEY="sk-xxx"; node proxy/local-proxy.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 读取 proxy/.env（已 gitignore）
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const PORT = 8787;
const MODEL = "kimi-k3";
const SYSTEM_PROMPT = [
  "你是壮壮FIT门店的SOP助手，服务对象是一线店员。",
  "规则（必须严格遵守）：",
  "1. 只能依据【SOP资料】中明确写出的内容回答，不得推测、补充资料以外的做法或数字。",
  "2. 资料里没有写的内容，直接回答：资料里没有写明，建议问店长确认。",
  "3. 回答简短、口语化，方便店员在出餐间隙快速查看；涉及数字/规格必须原样给出。",
  "4. 资料里的每个步骤、每个要点都要列出，不得省略、不得用“等”概括；用 1. 2. 3. 分点说明。",
  "5. 不要编造红线、时间、克重、温度等任何信息。",
  "6. 如果店员问「做 N 份 / N 个 / N 碗」，必须把资料里每份的克重 × N，列出每种食材的总量（如 30g/份 × 8 = 240g），不要只重复每份的量。",
].join("\n");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...CORS });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true });
  if (req.method !== "POST" || req.url !== "/ask") return send(res, 404, { error: "not found" });

  let raw = "";
  for await (const chunk of req) raw += chunk;
  let payload;
  try { payload = JSON.parse(raw); } catch { return send(res, 400, { error: "bad json" }); }
  const { question, context } = payload;
  if (!question || !context) return send(res, 400, { error: "question/context required" });

  const key = process.env.KIMI_KEY || "";
  if (!key) return send(res, 500, { error: "KIMI_KEY not set" });

  const upstream = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 1,
      max_tokens: 1600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `【SOP资料】\n${context}\n\n【店员的问题】\n${question}` },
      ],
    }),
  });

  const data = await upstream.json();
  if (!upstream.ok) return send(res, 502, { error: `kimi ${upstream.status}`, detail: data });
  const answer = data?.choices?.[0]?.message?.content || "";
  send(res, 200, { answer });
});

server.listen(PORT, () => console.log(`kimi proxy on http://127.0.0.1:${PORT}/ask`));
