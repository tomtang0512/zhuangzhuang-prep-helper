// Netlify Function：接收 {question, context} → 调 Kimi → 返回答案
// key 存在站点环境变量 KIMI_KEY 里（页面上拿不到）
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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok: true, name: "zz-kimi-proxy" }),
    };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 404, headers: CORS, body: "not found" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: CORS, body: "bad json" };
  }
  const { question, context } = payload || {};
  if (!question || !context) {
    return { statusCode: 400, headers: CORS, body: "question/context required" };
  }

  const key = process.env.KIMI_KEY;
  if (!key) return { statusCode: 500, headers: CORS, body: "KIMI_KEY not set" };

  const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
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
  const data = await r.json();
  const answer = r.ok ? data?.choices?.[0]?.message?.content || "" : "";
  return {
    statusCode: r.ok ? 200 : 502,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ answer, error: r.ok ? undefined : `kimi ${r.status}` }),
  };
};
