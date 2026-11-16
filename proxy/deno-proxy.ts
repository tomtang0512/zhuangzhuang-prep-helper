// Deno Deploy 版代理：把问题+资料发给 Kimi，key 存在项目环境变量 KIMI_KEY 里（页面上拿不到）
// 部署：console.deno.com → 新建项目 → 粘贴本文件 → 设置环境变量 KIMI_KEY
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/") {
    return Response.json({ ok: true, name: "zz-kimi-proxy" }, { headers: CORS });
  }
  if (request.method !== "POST" || url.pathname !== "/ask") {
    return new Response("not found", { status: 404 });
  }

  let payload: { question?: string; context?: string };
  try {
    payload = await request.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const { question, context } = payload;
  if (!question || !context) {
    return new Response("question/context required", { status: 400 });
  }

  const key = Deno.env.get("KIMI_KEY");
  if (!key) {
    return new Response("KIMI_KEY not set", { status: 500 });
  }

  const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
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
  return Response.json(
    { answer, error: r.ok ? undefined : `kimi ${r.status}` },
    {
      status: r.ok ? 200 : 502,
      headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
    },
  );
});
