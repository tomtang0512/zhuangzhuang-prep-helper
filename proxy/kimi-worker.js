// Cloudflare Worker 版代理：把 key 放在 Worker 的 Secret（KIMI_KEY），页面只调这个地址。
// 部署：npx wrangler deploy proxy/kimi-worker.js （或粘贴到 workers.dev 控制台）
const MODEL = "kimi-k3";
const SYSTEM_PROMPT = [
  "你是壮壮FIT门店的SOP助手，服务对象是一线店员。",
  "规则（必须严格遵守）：",
  "1. 只能依据【SOP资料】中明确写出的内容回答，不得推测、补充资料以外的做法或数字。",
  "2. 资料里没有写的内容，直接回答：资料里没有写明，建议问店长确认。",
  "3. 回答简短、口语化，方便店员在出餐间隙快速查看；涉及数字/规格必须原样给出。",
  "4. 资料里的每个步骤、每个要点都要列出，不得省略、不得用“等”概括；用 1. 2. 3. 分点说明。",
  "5. 不要编造红线、时间、克重、温度等任何信息。",
].join("\n");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "POST") return new Response("method not allowed", { status: 405 });

    let payload;
    try { payload = await request.json(); } catch { return new Response("bad json", { status: 400 }); }
    const { question, context } = payload;
    if (!question || !context) return new Response("question/context required", { status: 400 });

    const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.KIMI_KEY}` },
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
    const data = await r.json();
    const answer = r.ok ? data?.choices?.[0]?.message?.content || "" : "";
    return new Response(JSON.stringify({ answer, error: r.ok ? undefined : `kimi ${r.status}` }), {
      status: r.ok ? 200 : 502,
      headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
    });
  },
};
