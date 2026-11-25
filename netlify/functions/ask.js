// Netlify Function：接收 {question, context} → 调 Kimi → 返回答案
// 2026-11 优化：模型可指定 + 429 重试 + 错误详情 + 模型列表调试
const DEFAULT_MODEL = "kimi-k3";
const SYSTEM_PROMPT = [
  "你是壮壮FIT门店的SOP助手，服务对象是一线店员。",
  "规则（必须严格遵守）：",
  "1. 只能依据【SOP资料】中明确写出的内容回答，不得推测、补充资料以外的做法或数字。",
  "2. 资料里没有写的内容，直接回答：资料里没有写明，建议问店长确认。",
  "3. 回答简短、口语化，方便店员在出餐间隙快速查看；涉及数字/规格必须原样给出。",
  "4. 资料里的每个步骤、每个要点都要列出，不得省略、不得用“等”概括；用 1. 2. 3. 分点说明。",
  "5. 不要编造红线、时间、克重、温度等任何信息。",
  "6. 资料里如有【按 N 份换算】的行，直接照它回答，把每种食材的总量逐个列出（例如 杏鲍菇240g、西葫芦240g、西兰花480g），不要只重复每份的量。",
].join("\n");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 429/529 自动重试；其他错误直接返回详情
async function callKimi(key, model, payload, maxAttempts = 3) {
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ ...payload, model }),
    });
    const data = await r.json().catch(() => null);
    if (r.status === 429 || r.status === 529) {
      lastStatus = r.status;
      lastBody = JSON.stringify(data || {});
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!r.ok) {
      return { ok: false, status: r.status, error: JSON.stringify(data || {}).slice(0, 300) };
    }
    return { ok: true, status: r.status, data };
  }
  return { ok: false, status: lastStatus || 429, error: lastBody.slice(0, 300) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  const key = process.env.KIMI_KEY;

  if (event.httpMethod === "GET") {
    // 调试：列出账号可用模型
    if (event.queryStringParameters && event.queryStringParameters.models === "1") {
      if (!key) return { statusCode: 500, headers: CORS, body: "KIMI_KEY not set" };
      const r = await fetch("https://api.moonshot.cn/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      const data = await r.json().catch(() => null);
      return {
        statusCode: r.ok ? 200 : 502,
        headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(data || { error: r.status }),
      };
    }
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
  const { question, context, model } = payload || {};
  if (!question || !context) {
    return { statusCode: 400, headers: CORS, body: "question/context required" };
  }
  if (!key) return { statusCode: 500, headers: CORS, body: "KIMI_KEY not set" };

  const { ok, status, data, error } = await callKimi(key, model || DEFAULT_MODEL, {
    temperature: 1,
    max_tokens: 800,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `【SOP资料】\n${context}\n\n【店员的问题】\n${question}` },
    ],
  });
  const answer = ok ? data?.choices?.[0]?.message?.content || "" : "";
  return {
    statusCode: ok ? 200 : 502,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ answer, error: ok ? undefined : error || `kimi ${status}` }),
  };
};
