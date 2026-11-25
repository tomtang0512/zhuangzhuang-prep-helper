import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertOctagon,
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronRight,
  Droplets,
  Flame,
  FlaskConical,
  Info,
  Megaphone,
  Minus,
  Scissors,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import data from "@/sop_data.json";
import bulletinData from "@/bulletins.json";
import wikiData from "@/wiki_data.json";

const { sections, conversions, redlines } = data;
const TILE_TONES = {
meat: { tile: "bg-rose-50 ring-rose-200", badge: "bg-rose-600", name: "text-rose-900", grams: "text-rose-600" },
veg: { tile: "bg-emerald-50 ring-emerald-200", badge: "bg-emerald-600", name: "text-emerald-900", grams: "text-emerald-600" },
staple: { tile: "bg-amber-50 ring-amber-200", badge: "bg-amber-600", name: "text-amber-900", grams: "text-amber-600" },
sauce: { tile: "bg-violet-50 ring-violet-200", badge: "bg-violet-600", name: "text-violet-900", grams: "text-violet-600" },
other: { tile: "bg-white ring-slate-100", badge: "bg-slate-500", name: "text-slate-800", grams: "text-slate-500" },
};

const moduleTone = (name) => {
if (/肉|鸡腿|牛排|牛腱|牛片|虾|鲷|鱼|鱿鱼|黑鱼|花甲|锡纸/.test(name)) return "meat";
if (/主食|米饭|糙米|藜麦|红薯|南瓜|紫薯|贝贝|燕麦|荞麦|土豆|山药|芋头/.test(name)) return "staple";
if (/料汁|酱|蘸水|调味/.test(name)) return "sauce";
if (/蔬菜|生菜|西兰花|菇|菌|秋葵|芦笋|彩椒|玉米|豌豆|胡萝卜|黄瓜|圣女果|娃娃菜|番茄|洋葱|西葫芦|菠菜|油麦|苦苣|甘蓝|萝卜|豆腐|蛋|基底/.test(name)) return "veg";
return "other";
};

const fmtGrams = (item) => {
const raw = item.gramsRaw;
if (!raw) return item.grams != null ? `${item.grams}g` : "-";
const s = String(raw).trim();
if (/^\d+(?:\.\d+)?$/.test(s)) return `${s}g`;
if (/(ml|g|kg|L|张|片|枚|个|根|枝|倍|份)/.test(s)) return s;
return s.replace(/^(\d+(?:\.\d+)?)/, "$1g");
};

const wikiDishes = wikiData.dishes || [];
const wikiMeta = wikiData.meta || {};
const issues = bulletinData.issues || [];
const latestIssue = issues[0];

const stepOf = (step) => (typeof step === "string" ? { t: step } : step);
const stepsOf = (item) => (item.steps || []).map(stepOf);
const countOf = (section) => section.groups.reduce((sum, group) => sum + group.items.length, 0);

const SECTION_ICON = { cutting: Scissors, marinade: FlaskConical, cooking: Flame, packing: Droplets };

function WikiView({ onBack }) {
const [q, setQ] = useState("");
const [cat, setCat] = useState("全部");
const [picked, setPicked] = useState(null);
const [variantIdx, setVariantIdx] = useState(0);

const shortSpec = (spec) => {
const line = String(spec || "").split("\n").map((s) => s.trim()).filter(Boolean)[0] || "";
return line.replace(/^[\/\s]+/, "") || "标准";
};

const categories = ["全部", ...new Set(wikiDishes.map((d) => d.category))];
const keyword = q.trim().toLowerCase();
const list = wikiDishes.filter((dish) => {
if (cat !== "全部" && dish.category !== cat) return false;
if (!keyword) return true;
return (
dish.sku.toLowerCase().includes(keyword) ||
dish.variants.some((v) => v.items.some((item) => item.name.toLowerCase().includes(keyword)))
);
});

if (picked) {
const vIndex = Math.min(variantIdx, picked.variants.length - 1);
const v = picked.variants[vIndex];
const t = v.total || {};
const pkgRef = (wikiMeta.packaging || {})[picked.category] || [];
const selling = picked.selling || v.selling || "";
return (
<div className="mx-auto max-w-2xl pb-20">
<div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
<button onClick={() => setPicked(null)} className="flex items-center gap-1 text-[15px] font-semibold text-emerald-700">
<ArrowLeft size={18} />返回
</button>
<h2 className="text-[17px] font-bold text-slate-900">菜品构成</h2>
</div>

<div className="px-4 pt-3">
{picked.variants.length > 1 ? (
<div className="flex gap-1.5 overflow-x-auto pb-1">
{picked.variants.map((variant, i) => (
<button
key={i}
onClick={() => setVariantIdx(i)}
className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
i === vIndex ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
}`}
>
{shortSpec(variant.spec)}
</button>
))}
</div>
) : null}

<div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
<div className="flex items-center gap-2">
<span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{picked.category}</span>
{picked.variants.length > 1 ? (
<span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{shortSpec(v.spec)}</span>
) : null}
</div>
<p className="mt-1.5 text-[17px] font-bold leading-snug text-slate-900">{picked.sku}</p>
{selling ? <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{selling}</p> : null}
</div>

<div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200">
<span className="text-[12px] text-slate-400">整碗总重</span>
<span className="text-[20px] font-black text-slate-900">{t.grams != null ? `${t.grams}g` : "-"}</span>
<span className="ml-auto text-[11px] text-slate-400">营养/成本/损耗见「问智能小助手」</span>
</div>

<div className="mt-4 space-y-1.5">
{(() => {
// 模块行（无编号）= 分组标题；只有模块名带「N选1」时，编号行才是“选项”
// 同编号 = 一个组合选项（如 ②红薯+南瓜）；未标 N选1 的编号行只是普通食材序号
const groups = [];
let current = null;
v.items
.filter((item) => item.module !== "整体")
.forEach((item) => {
const match = item.name.match(/^([①②③④⑤⑥⑦⑧⑨⑩])?(.*)$/);
const num = match[1];
const rest = match[2];
if (!num) {
current = {
type: "module",
name: item.name,
gramsRaw: item.gramsRaw,
pick: /(\d+)\s*选\s*(\d+)/.test(item.name),
options: [],
rows: [],
};
groups.push(current);
return;
}
if (current && current.pick) {
const last = current.options[current.options.length - 1];
if (last && last.num === num) last.items.push({ ...item, name: rest });
else current.options.push({ num, items: [{ ...item, name: rest }] });
} else if (current) {
current.rows.push(item);
}
});

return groups.map((group, i) => {
const pickMatch = group.name.match(/(\d+)\s*选\s*(\d+)/);
const pickLabel = pickMatch ? `${pickMatch[1]}选${pickMatch[2]}` : null;
const tone = TILE_TONES[moduleTone(group.name)] || TILE_TONES.other;
return (
<div key={i}>
<div className="mt-3 flex items-center gap-2">
<span className={`h-2 w-2 shrink-0 rounded-full ${tone.badge}`} />
<span className="shrink-0 text-[12px] font-bold text-slate-500">{group.name}</span>
{pickLabel ? (
<span className="shrink-0 rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-bold text-violet-600">
{pickLabel} · 任选其一
</span>
) : null}
<span className="h-px flex-1 bg-slate-200" />
{group.gramsRaw ? <span className="shrink-0 text-[12px] font-medium text-slate-500">{fmtGrams(group)}</span> : null}
</div>

{group.pick ? (
<div className="mt-1.5 grid grid-cols-4 gap-1.5">
{group.options.map((option) => (
<div key={option.num} className={`rounded-lg px-2 py-2 ring-1 ${tone.tile}`}>
<span className={`mb-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${tone.badge}`}>
{option.num}
</span>
<p className={`text-[12px] font-bold leading-tight ${tone.name}`}>
{option.items.map((it) => it.name).join(" + ")}
</p>
<p className={`mt-0.5 whitespace-nowrap text-[12px] font-semibold ${tone.grams}`}>
{option.items.map((it) => fmtGrams(it)).join(" + ")}
</p>
</div>
))}
</div>
) : (
<div className="mt-1.5 grid grid-cols-4 gap-1.5">
{group.rows.map((item, j) => (
<div key={j} className={`rounded-lg px-2 py-2 ring-1 ${tone.tile}`}>
<p className={`text-[12px] font-bold leading-tight ${tone.name}`}>{item.name}</p>
<p className={`mt-0.5 whitespace-nowrap text-[12px] font-semibold ${tone.grams}`}>{fmtGrams(item)}</p>
</div>
))}
</div>
)}
</div>
);
});
})()}
</div>

{(() => {
const pkgNames = [];
v.packaging?.forEach((p) => {
if (p.name && !pkgNames.includes(p.name)) pkgNames.push(p.name);
});
pkgRef.forEach((p) => {
if (p.name && !pkgNames.includes(p.name)) pkgNames.push(p.name);
});
if (!pkgNames.length) return null;
return (
<div className="mt-4">
<p className="text-[15px] font-bold text-slate-900">物料</p>
<p className="mt-1 text-[13px] leading-relaxed text-slate-600">{pkgNames.join(" + ")}</p>
</div>
);
})()}
</div>
</div>
);
}

return (
<div className="mx-auto max-w-2xl pb-20">
<div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
<div className="flex items-center gap-2">
<button onClick={onBack} className="flex items-center gap-1 text-[15px] font-semibold text-emerald-700">
<ArrowLeft size={18} />返回
</button>
<h2 className="text-[17px] font-bold text-slate-900">菜品构成</h2>
<span className="ml-auto text-[12px] text-slate-400">{wikiDishes.length} 道</span>
</div>
<div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-100 px-3">
<Search size={16} className="shrink-0 text-slate-400" />
<input
value={q}
onChange={(e) => setQ(e.target.value)}
placeholder="搜菜名或食材，如：冬阴功 / 鸡腿"
className="h-10 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
/>
{q ? (
<button onClick={() => setQ("")} className="shrink-0 text-slate-400">
<X size={16} />
</button>
) : null}
</div>
<div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
{categories.map((c) => (
<button
key={c}
onClick={() => setCat(c)}
className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
cat === c ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
}`}
>
{c}
</button>
))}
</div>
</div>

<div className="px-4 pt-3">
<p className="text-[12px] text-slate-400">
{keyword ? `找到 ${list.length} 道` : `共 ${list.length} 道`}
</p>
<div className="mt-2 space-y-2">
{list.map((dish) => (
<button
key={dish.sku}
onClick={() => setPicked(dish)}
className="w-full rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
>
<div className="flex items-center gap-2">
<span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{dish.category}</span>
<span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
{dish.variants.length > 1 ? `${dish.variants.length}种规格` : shortSpec(dish.variants[0]?.spec)}
</span>
<span className="ml-auto text-[11px] text-slate-400">
{dish.variants.reduce((sum, v) => sum + v.items.filter((i) => i.module !== "整体").length, 0)} 项食材
</span>
</div>
<p className="mt-1.5 text-[15px] font-bold leading-snug text-slate-900">{dish.sku}</p>
<div className="mt-1 flex items-center gap-2 text-[12px] text-slate-400">
{dish.variants.slice(0, 2).map((v, i) => (
<span key={i} className="whitespace-nowrap">
{v.total?.grams != null ? `${shortSpec(v.spec)} ${v.total.grams}g` : shortSpec(v.spec)}
</span>
))}
{dish.variants.length > 2 ? <span>…</span> : null}
<ChevronRight size={14} className="ml-auto shrink-0" />
</div>
</button>
))}
</div>
</div>
</div>
);
}

const NUM_RE = /(\d+(?:[.,]\d+)?(?:\s*[~～-]\s*\d+(?:[.,]\d+)?)?\s*(?:g|G|ml|°C|℃|%|分钟|小时|天|秒|份|只|颗|枚|喷|种|sku)?|≤|≥|±)/;
function Rich({ text, tone = "text-slate-900" }) {
  const parts = String(text).split(NUM_RE);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className={`whitespace-nowrap font-bold ${tone}`}>
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

const allItems = sections.flatMap((section) =>
section.groups.flatMap((group, gi) =>
group.items.map((item, ii) => ({
secId: section.id,
secName: section.name,
group: group.name,
name: item.name,
gi,
ii,
steps: stepsOf(item),
note: item.note || "",
haystack: [section.name, group.name, item.name, item.note || "", stepsOf(item).map((step) => step.t).join(" ")].join(" "),
}))
)
);

// ===== 问 SOP：本地检索 + Kimi 回答 =====
// 代理地址：线上用 Netlify 函数（key 存在服务端，页面拿不到）；本地调试可改回 127.0.0.1:8787
const AI_ENDPOINT = "https://zz-kimi-proxy.netlify.app/api/ask";
// 页面版本号（每次发版递增，方便确认手机浏览器拿到的是不是最新页面）
const APP_VERSION = "2026.11.16.5";

function tokenize(text) {
return String(text).toLowerCase().replace(/[，。？！?,.\s！!]/g, " ");
}

// 中文滑窗：整句没命中时，用 2~3 字片段匹配（如“照烧汁放多少” → 照烧/烧汁/汁放…）
function ngrams(text) {
const clean = String(text).toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, "");
const out = new Set();
for (let n = 2; n <= 3; n += 1) {
for (let i = 0; i + n <= clean.length; i += 1) out.add(clean.slice(i, i + n));
}
return [...out];
}

function rankItems(question) {
const tokens = tokenize(question).split(" ").filter((t) => t.length >= 2);
const grams = ngrams(question);
return allItems
.map((item) => {
let score = 0;
tokens.forEach((token) => {
if (item.name.toLowerCase().includes(token)) score += 10;
if (item.secName.toLowerCase().includes(token) || item.group.toLowerCase().includes(token)) score += 1;
item.steps.forEach((step) => {
if (step.t.toLowerCase().includes(token)) score += 3;
});
if (item.note && item.note.toLowerCase().includes(token)) score += 2;
});
grams.forEach((gram) => {
if (item.name.toLowerCase().includes(gram)) score += 6;
if (item.secName.toLowerCase().includes(gram) || item.group.toLowerCase().includes(gram)) score += 1;
item.steps.forEach((step) => {
if (step.t.toLowerCase().includes(gram)) score += 2;
});
if (item.note && item.note.toLowerCase().includes(gram)) score += 2;
});
if (question.length >= 4 && item.name.toLowerCase().includes(question.toLowerCase())) score += 25;
return { item, score };
})
.filter((row) => row.score > 0)
.sort((a, b) => b.score - a.score);
}

function rankRedlines(question) {
const tokens = tokenize(question).split(" ").filter((t) => t.length >= 2);
const grams = ngrams(question);
return redlines
.map((line) => {
const text = [line.title, ...(line.points || []), ...(line.limits || []).map((l) => `${l.item} ${l.limit}`)].join(" ");
let score = 0;
tokens.forEach((token) => {
if (text.toLowerCase().includes(token)) score += 3;
});
grams.forEach((gram) => {
if (text.toLowerCase().includes(gram)) score += 1.5;
});
return { line, score };
})
.filter((row) => row.score > 0)
.sort((a, b) => b.score - a.score);
}

function rankDishes(question) {
const grams = ngrams(question);
return wikiDishes
.map((dish) => {
let score = 0;
const name = dish.sku.toLowerCase();
grams.forEach((gram) => {
if (name.includes(gram)) score += 3;
});
if (question.length >= 4 && name.includes(question.toLowerCase())) score += 20;
dish.variants.forEach((v) => {
v.items.forEach((item) => {
const itemName = item.name.toLowerCase();
grams.forEach((gram) => {
if (itemName.includes(gram)) score += 2;
});
});
});
return { dish, score };
})
.filter((row) => row.score > 0)
.sort((a, b) => b.score - a.score);
}

function dishToText(dish, qty) {
const lines = [`■ 菜品：${dish.sku}（${dish.category}）`];
dish.variants.forEach((v) => {
lines.push(`◆ 规格：${v.spec || "标准"}${qty ? ` × ${qty} 份` : ""}`);
const t = v.total || {};
lines.push(
`整体：${t.grams ?? "-"}g / ${t.kcal ?? "-"}kcal / 蛋白质${t.protein ?? "-"}g / 脂肪${t.fat ?? "-"}g / 碳水${t.carbs ?? "-"}g / 成本${t.cost ?? "-"}元`
);
v.items.forEach((item) => {
if (item.module === "整体") return;
const pickMatch = item.module.match(/(\d+)\s*选\s*(\d+)/);
const tag = pickMatch ? `【${pickMatch[1]}选${pickMatch[2]}·任选其一】` : "";
const bits = [
tag + item.name,
item.gramsRaw || (item.grams != null ? `${item.grams}` : "-"),
item.kcal != null ? `${item.kcal}kcal` : null,
item.protein != null ? `蛋白${item.protein}g` : null,
item.fat != null ? `脂肪${item.fat}g` : null,
item.carbs != null ? `碳水${item.carbs}g` : null,
item.cost != null ? `成本${item.cost}元` : null,
item.note ? `备注：${item.note}` : null,
].filter(Boolean);
const scale = qty && typeof item.grams === "number" ? `（${qty}份共${Math.round(item.grams * qty)}g）` : "";
lines.push(`- ${bits.join(" / ")}${scale}`);
});
});
return lines.join("\n");
}

function buildContext(question) {
const qtyMatch = question.match(/(\d+)\s*(?:个|份|碗|盒|只|人份)/);
const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : null;
const items = rankItems(question).slice(0, 2);
const lines = rankRedlines(question).slice(0, 2);
const dishes = rankDishes(question).slice(0, 2);
const parts = [];

// 页面先把总量算好，避免 AI 漏乘：把含克重/±的片段按 N 份放大
const scaleStep = (text, n) => {
if (!n || n <= 1 || !/(g|克|±)/.test(text)) return null;
const out = String(text)
.split(/([/、；;]+)/)
.map((seg) => {
if (!/(±|\d\s*(?:g|克|ml))/.test(seg)) return seg;
return seg.replace(/(\d+(?:\.\d+)?)(\s*±\s*\d+(?:\.\d+)?)?(\s*(?:g|克|ml))?/g, (m, base, pm, unit) => {
const b = parseFloat(base);
if (!isFinite(b) || b === 0) return m;
let s = `${Math.round(b * n)}${unit ? unit.trim() : ""}`;
if (pm) s += `±${Math.round(parseFloat(pm.replace(/[^\d.]/g, "")) * n)}`;
return s;
});
})
.join("");
if (out === text) return null;
return out.replace(/\/份/g, `/份×${n}（即${n}份总量）`);
};
items.forEach(({ item }) => {
parts.push(`■ ${item.name}（${item.secName} › ${item.group}）`);
item.steps.forEach((step, i) => parts.push(`${i + 1}. ${step.key ? "【关键】" : ""}${step.t}`));
if (item.note) parts.push(`备注：${item.note}`);
if (qty) {
const scaled = item.steps.map((step) => scaleStep(step.t, qty)).filter(Boolean);
if (scaled.length) parts.push(`【按 ${qty} 份换算】` + scaled.join("；"));
}
});
lines.forEach(({ line }) => {
parts.push(`◆ 红线${line.no}：${line.title}`);
(line.points || []).forEach((p) => parts.push(`- ${p}`));
(line.limits || []).forEach((l) => parts.push(`- ${l.item}：${l.limit}`));
if (line.warn) parts.push(`- ${line.warn}`);
});
dishes.forEach(({ dish }) => {
parts.push(dishToText(dish, qty));
});
if (!parts.length) {
parts.push("◆ 全店红线（共 " + redlines.length + " 条）");
redlines.forEach((line) => parts.push(`红线${line.no}：${line.title}`));
}
return { text: parts.join("\n"), items, lines, dishes };
}

async function askKimi(question, context, signal, onRetry) {
const maxAttempts = 3;
let lastErr = null;
for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
try {
const res = await fetch(AI_ENDPOINT, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ question, context }),
signal,
});
if (!res.ok) throw new Error(`代理返回 ${res.status}`);
const data = await res.json();
if (data.error) throw new Error(data.error);
return String(data.answer || "").trim();
} catch (e) {
lastErr = e;
if (attempt < maxAttempts - 1 && !(signal && signal.aborted)) {
if (onRetry) onRetry(attempt + 2, maxAttempts);
await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
continue;
}
throw e;
}
}
throw lastErr;
}

const QA_KEY = "zz_sop_qa_history";

function AiView({ onOpenItem, onMinimize, onClose }) {
const [q, setQ] = useState("");
const [busy, setBusy] = useState(false);
const [stage, setStage] = useState(0);
const [retryMsg, setRetryMsg] = useState("");
const stageTimers = useRef([]);
const scrollRef = useRef(null);
const [history, setHistory] = useState(() => {
try {
return JSON.parse(localStorage.getItem(QA_KEY) || "[]");
} catch {
return [];
}
});

const save = (next) => {
setHistory(next);
try {
localStorage.setItem(QA_KEY, JSON.stringify(next));
} catch {
/* ignore */
}
};

useEffect(() => () => {
stageTimers.current.forEach((t) => clearTimeout(t));
}, []);

const ask = async (questionText) => {
const question = (questionText != null ? questionText : q).trim();
if (!question || busy) return;
setBusy(true);
setStage(0);
setRetryMsg("");
requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
stageTimers.current.forEach((t) => clearTimeout(t));
stageTimers.current = [
setTimeout(() => setStage(1), 4000),
setTimeout(() => setStage(2), 12000),
];
const { text, items, lines, dishes } = buildContext(question);
const fallback = () => {
const qtyMatch = question.match(/(\d+)\s*(?:个|份|碗|盒|只|人份)/);
const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : null;
const parts = [];
dishes.forEach(({ dish }) => parts.push(dishToText(dish, qty)));
items.forEach(({ item }) => {
parts.push(`■ ${item.name}（${item.secName} › ${item.group}）`);
item.steps.forEach((step, i) => parts.push(`${i + 1}. ${step.key ? "【关键】" : ""}${step.t}`));
if (item.note) parts.push(`备注：${item.note}`);
});
lines.forEach(({ line }) => {
parts.push(`◆ 红线${line.no}：${line.title}`);
(line.points || []).forEach((p) => parts.push(`- ${p}`));
});
if (parts.length) return { q: question, kind: "ai", answer: parts.join("\n"), items, lines, dishes: dishes.map((r) => r.dish), local: true };
return { q: question, kind: "none", items, lines, dishes: dishes.map((r) => r.dish) };
};
let entry;
try {
if (AI_ENDPOINT) {
const answer = await askKimi(question, text, null, (n, total) => setRetryMsg(`网络繁忙，第 ${n}/${total} 次重试…`));
entry = { q: question, kind: "ai", answer, items, lines, dishes: dishes.map((r) => r.dish) };
} else {
entry = fallback();
}
} catch (e) {
const fb = fallback();
entry = { ...fb, error: fb.local ? "AI 暂时不可用，已按本地资料回答" : String(e.message || e) };
}
save([entry, ...history].slice(0, 20));
setQ("");
setBusy(false);
setStage(0);
setRetryMsg("");
stageTimers.current.forEach((t) => clearTimeout(t));
};

const STAGE_TEXT = [
"正在检索 SOP 与菜品资料…",
"已找到资料，正在组织答案…",
"正在核对数字与规格，马上就好…",
];

const examples = [
"柠檬黑椒鸡腿出餐时要放柠檬吗？",
"照烧汁放多少？",
"留档留样怎么弄？",
"哪些菜要日清？",
];

return (
<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4">
<div className="flex h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:h-[86vh] sm:rounded-3xl">
<div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5">
<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
<Sparkles size={16} className="text-violet-600" />
</span>
<div className="min-w-0 flex-1">
<p className="truncate text-[16px] font-bold text-slate-900">问问智能小助手</p>
<p className="truncate text-[11px] text-slate-400">只按 SOP 回答，不知道会直说</p>
</div>
<button onClick={onMinimize} aria-label="最小化" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100">
<Minus size={17} />
</button>
<button onClick={onClose} aria-label="关闭" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100">
<X size={17} />
</button>
</div>

<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
{history.length === 0 ? (
<div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
<p className="text-[15px] font-semibold text-slate-900">直接问，只按 SOP 回答</p>
<p className="mt-1 text-[13px] leading-relaxed text-slate-500">
AI 只会依据店里的 SOP 资料作答，资料里没写的会直接说不知道，不会瞎编。
</p>
<div className="mt-3 flex flex-wrap gap-2">
{examples.map((ex) => (
<button
key={ex}
onClick={() => ask(ex)}
className="rounded-full bg-slate-100 px-3 py-1.5 text-left text-[13px] font-medium text-slate-700 active:bg-slate-200"
>
{ex}
</button>
))}
</div>
</div>
) : null}

<div className="space-y-4">
{busy ? (
<>
<div className="mb-1.5 flex justify-end">
<p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 px-3 py-2 text-[15px] font-medium text-white">{q}</p>
</div>
<div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white p-3 ring-1 ring-violet-200">
<div className="flex items-center gap-2">
<span className="flex items-end gap-1">
<span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.3s]" />
<span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.15s]" />
<span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
</span>
<p className="text-[14px] font-medium text-slate-600">{retryMsg || STAGE_TEXT[stage]}</p>
</div>
<div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
<div className="h-full w-1/3 animate-[slide_1.6s_ease-in-out_infinite] rounded-full bg-violet-400" />
</div>
<p className="mt-2 text-[12px] text-slate-400">只按店里 SOP 与菜品资料作答，通常 10-20 秒</p>
</div>
</>
) : null}
{history.map((entry, idx) => (
<div key={`${entry.q}-${idx}`}>
<div className="mb-1.5 flex justify-end">
<p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 px-3 py-2 text-[15px] font-medium text-white">
{entry.q}
</p>
</div>
<div className="max-w-[92%]">
{entry.kind === "ai" ? (
<div className="rounded-2xl rounded-tl-sm bg-white p-3 ring-1 ring-slate-200">
<p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">{entry.answer || "（AI 没有给出回答）"}</p>
{entry.error ? (
<p className="mt-2 text-[12px] text-amber-600">AI 调用失败，已退回资料检索：{entry.error}</p>
) : null}
{entry.dishes?.length ? (
<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
<span className="text-[12px] text-slate-400">资料：</span>
{entry.dishes.map((d) => (
<span key={d.sku} className="rounded bg-amber-50 px-2 py-0.5 text-[12px] font-medium text-amber-700">
{d.sku}
</span>
))}
</div>
) : null}
{entry.items.length ? (
<button
onClick={() => onOpenItem(entry.items[0].item)}
className="mt-2.5 flex items-center gap-1 text-[13px] font-semibold text-emerald-700"
>
依据：{entry.items[0].item.name}
<ChevronRight size={14} />
</button>
) : null}
</div>
) : null}

{entry.kind === "item" ? (
<div className="rounded-2xl rounded-tl-sm bg-white p-3 ring-1 ring-slate-200">
<p className="text-[13px] text-slate-400">
{entry.item.secName} › {entry.item.group}
</p>
<p className="mt-0.5 text-[16px] font-bold text-slate-900">{entry.item.name}</p>
<div className="mt-1">
<Steps item={entry.item} anchorId={`qa-${idx}`} />
</div>
{entry.item.note ? (
<p className="mt-2 text-[13px] leading-relaxed text-slate-500">{entry.item.note}</p>
) : null}
<button
onClick={() => onOpenItem(entry.item)}
className="mt-2.5 flex items-center gap-1 text-[13px] font-semibold text-emerald-700"
>
打开这条 SOP
<ChevronRight size={14} />
</button>
</div>
) : null}

{entry.kind === "redline" ? (
<div className="rounded-2xl rounded-tl-sm bg-red-50 p-3 ring-1 ring-red-200">
<p className="flex items-center gap-1 text-[13px] font-bold text-red-700">
<AlertOctagon size={14} />
红线 {entry.line.no}
</p>
<p className="mt-1 text-[15px] font-semibold text-red-900">{entry.line.title}</p>
{(entry.line.points || []).map((p) => (
<p key={p} className="mt-1 text-[13px] text-red-900/80">· {p}</p>
))}
{(entry.line.limits || []).map((l) => (
<p key={l.item} className="mt-1 text-[13px] text-red-900/80">· {l.item}：{l.limit}</p>
))}
</div>
) : null}

{entry.kind === "none" ? (
<div className="rounded-2xl rounded-tl-sm bg-white p-3 ring-1 ring-slate-200">
<p className="text-[15px] text-slate-700">资料里没查到相关内容，建议直接问店长确认。</p>
</div>
) : null}
</div>
</div>
))}
</div>
</div>

<div className="border-t border-slate-200 bg-white px-3 py-2.5">
<div className="mx-auto flex max-w-2xl items-center gap-2">
<input
value={q}
onChange={(e) => setQ(e.target.value)}
onKeyDown={(e) => {
if (e.key === "Enter" && !e.nativeEvent.isComposing) ask();
}}
placeholder="例如：柠檬黑椒鸡腿出餐时要放柠檬吗？"
className="h-11 flex-1 rounded-xl bg-slate-100 px-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
/>
<button
onClick={() => ask()}
disabled={busy || !q.trim()}
className="flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-[15px] font-bold text-white disabled:opacity-40"
>
{busy ? (
<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
) : (
<Sparkles size={16} />
)}
{busy ? "查询中" : "问"}
</button>
</div>
</div>
</div>
</div>
);
}

function Steps({ item, anchorId }) {
return (
<div className="mt-0.5" id={anchorId}>
<ul className="space-y-2">
        {stepsOf(item).map((step) =>
          step.key ? (
            <li key={step.t} className="flex gap-2 rounded-lg border-l-[3px] border-red-500 bg-red-50 py-2 pl-2 pr-2.5">
              <Star size={14} className="mt-[3px] shrink-0 fill-red-500 text-red-500" />
              <p className="text-[15px] font-semibold leading-relaxed text-red-800">
                <span className="mr-1 inline-block rounded bg-red-500 px-1 py-0.5 align-[1px] text-[10px] font-bold leading-none text-white">关键</span>
                <Rich text={step.t} tone="text-red-900" />
              </p>
            </li>
          ) : (
            <li key={step.t} className="flex gap-2 px-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <p className="text-[15px] leading-relaxed text-slate-700">
                <Rich text={step.t} />
                {step.spec ? <span className="ml-1 rounded bg-sky-100 px-1 py-0.5 text-[11px] font-normal text-sky-700">规格</span> : null}
              </p>
            </li>
          )
        )}
      </ul>
      {item.note ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[13px] leading-relaxed text-amber-800">
          <Rich text={item.note} tone="text-amber-900" />
        </p>
      ) : null}
    </div>
  );
}

function ItemCard({ item, groupIndex, itemIndex, open, onToggle, flash }) {
const summary = stepsOf(item)[0];
return (
<li className={`border-t border-slate-100 first:border-t-0 ${flash ? "bg-emerald-50" : ""}`}>
<button onClick={onToggle} className={`flex w-full items-center gap-2 px-3 py-3 text-left active:bg-slate-50 ${flash ? "ring-2 ring-inset ring-emerald-300" : ""}`}>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-slate-900">{item.name}</p>
          {!open && summary ? (
            <p className="mt-1 line-clamp-1 text-[13px] text-slate-500">
              <Rich text={summary.t} />
            </p>
          ) : null}
        </div>
        <ChevronDown size={18} className={`shrink-0 text-slate-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="pb-3 pl-3 pr-2">
          <Steps item={item} anchorId={`${groupIndex}-${itemIndex}`} />
        </div>
      ) : null}
    </li>
  );
}

function BulletinView({ onBack }) {
  return (
    <div className="mx-auto max-w-2xl pb-20">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[15px] font-semibold text-emerald-700">
          <ArrowLeft size={18} />返回
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold leading-tight text-slate-900">黑板报</h2>
          <p className="truncate text-[11px] text-slate-400">共 {issues.length} 期 · 每周一更新</p>
        </div>
      </div>
      <div className="space-y-3 px-3 pt-3">
        {issues.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-slate-400">还没有通知</p>
        ) : null}
        {issues.map((issue, index) => {
          const isLatest = index === 0;
          return (
            <section
              key={issue.week}
              className={
                isLatest
                  ? "rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4"
                  : "rounded-2xl bg-white p-4 ring-1 ring-slate-200"
              }
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-bold ${isLatest ? "text-amber-300" : "text-slate-400"}`}
                >
                  {isLatest ? <Megaphone size={14} /> : null}
                  {isLatest ? "本周黑板报" : "往期"}
                </span>
                <span className={`text-[11px] ${isLatest ? "text-slate-400" : "text-slate-400"}`}>
                  {issue.week.replace(/^\d{4}-/, "")} · {issue.range}
                </span>
              </div>
              <p className={`mt-1.5 text-[16px] font-bold leading-snug ${isLatest ? "text-white" : "text-slate-900"}`}>
                {issue.title}
              </p>
              <ul className="mt-2 space-y-1.5">
                {(issue.items || []).map((raw) => {
                  const item = typeof raw === "string" ? { t: raw } : raw;
                  return (
                    <li key={item.t} className="flex gap-2">
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${isLatest ? "bg-amber-300" : "bg-slate-300"}`} />
                      <p className={`text-[14px] leading-relaxed ${isLatest ? "text-slate-100" : "text-slate-700"}`}>
                        <Rich text={item.t} tone={isLatest ? "text-white" : "text-slate-900"} />
                        {item.tag ? (
                          <span
                            className={`ml-1 whitespace-nowrap rounded px-1 py-0.5 text-[11px] font-medium ${
                              isLatest ? "bg-white/15 text-amber-200" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.tag}
                          </span>
                        ) : null}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {issue.note ? (
                <p
                  className={`mt-2 rounded-lg px-2.5 py-1.5 text-[12px] leading-relaxed ${
                    isLatest ? "bg-white/10 text-slate-200" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {issue.note}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function RedlineCard({ line }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-md ring-2 ring-red-300">
      <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-500 px-3 py-2">
        <span className="text-[30px] font-black leading-none text-white/90">{String(line.no).padStart(2, "0")}</span>
        <span className="flex h-6 shrink-0 items-center whitespace-nowrap rounded-full bg-white/20 px-2 text-[12px] font-bold text-white">大前提</span>
        <AlertOctagon size={20} className="ml-auto shrink-0 text-white/70" />
      </div>
      <div className="p-4 pt-3">
        <p className="text-[19px] font-black leading-snug text-red-700">
          <Rich text={line.title} tone="text-red-800" />
        </p>
        {line.figures?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {line.figures.map((fig) => (
              <div key={fig.value} className="flex min-w-[9rem] flex-1 flex-col items-center rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-200">
                <span className="whitespace-nowrap text-[26px] font-black leading-none text-red-600">{fig.value}</span>
                <span className="mt-1 whitespace-nowrap text-[12px] font-medium text-red-900/70">{fig.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        {line.limits?.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {line.limits.map((row) => (
              <div key={row.item} className="flex flex-col rounded-xl bg-red-50 px-3 py-2 ring-1 ring-red-200">
                <span className="text-[13px] font-medium text-slate-600">{row.item}</span>
                <span className="mt-0.5 whitespace-nowrap text-[20px] font-black leading-tight text-red-600">{row.limit}</span>
              </div>
            ))}
          </div>
        ) : null}
        {line.points?.length ? (
          <ul className={`mt-3 ${line.inline ? "flex flex-wrap gap-1.5" : "space-y-1.5"}`}>
            {line.points.map((point) =>
              line.inline ? (
                <li key={point} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[15px] font-bold text-red-700 ring-1 ring-red-200">
                  {point}
                </li>
              ) : (
                <li key={point} className="flex gap-2">
                  <span className="mt-2.5 h-2 w-2 shrink-0 rounded-sm bg-red-500" />
                  <p className="text-[15px] font-semibold leading-relaxed text-slate-800">
                    <Rich text={point} />
                  </p>
                </li>
              )
            )}
          </ul>
        ) : null}
        {line.warn ? (
          <p className="mt-3 rounded-xl bg-red-600 px-3 py-2.5 text-[14px] font-bold leading-relaxed text-white">
            ⚠ <Rich text={line.warn} tone="text-white" />
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RedlinesView({ onBack }) {
  return (
    <div className="mx-auto max-w-2xl pb-20">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-700 to-red-500 px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-[15px] font-semibold text-white/90">
            <ArrowLeft size={18} />返回
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap">
            <AlertOctagon size={22} className="shrink-0 text-amber-300" />
            <span className="text-[20px] font-black text-white">{redlines.length} 条红线 · 大前提</span>
          </div>
          <span className="w-[52px] shrink-0" />
        </div>
        <p className="mt-0.5 text-center text-[12px] font-medium text-red-100">所有环节都得先过这 7 条 · 违反了停业整改或返工</p>
      </div>
      <div className="space-y-4 bg-red-50/60 px-3 pt-4">
        {redlines.map((line) => (
          <RedlineCard key={line.no} line={line} />
        ))}
        <p className="px-1 pb-2 text-center text-[12px] text-slate-400">发现违反红线：立即停止操作，报告店长</p>
      </div>
    </div>
  );
}

function SectionView({ section, onBack, focus }) {
const groupRefs = useRef([]);
const chipRefs = useRef([]);
const [active, setActive] = useState(0);
const [flash, setFlash] = useState(null);
const [openKeys, setOpenKeys] = useState(() => {
const init = new Set();
section.groups.forEach((group, gi) => {
if (group.items.length <= 4) group.items.forEach((_, ii) => init.add(`${gi}-${ii}`));
});
return init;
});

// 从搜索跳转：自动展开目标品名、滚动到位并高亮
useEffect(() => {
if (!focus) return;
const [gi, ii] = focus;
const key = `${gi}-${ii}`;
setOpenKeys((prev) => new Set(prev).add(key));
setActive(gi);
setFlash(key);
const t1 = setTimeout(() => {
document.getElementById(key)?.scrollIntoView({ block: "center", behavior: "smooth" });
chipRefs.current[gi]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
}, 120);
const t2 = setTimeout(() => setFlash(null), 2600);
return () => { clearTimeout(t1); clearTimeout(t2); };
}, [focus?.[0], focus?.[1]]);

  const toggle = (key) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const jump = (index) => {
    setActive(index);
    groupRefs.current[index]?.scrollIntoView({ block: "start", behavior: "smooth" });
    chipRefs.current[index]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button onClick={onBack} className="flex items-center gap-0.5 text-[15px] font-semibold text-emerald-700">
            <ArrowLeft size={18} />返回
          </button>
          <div className="ml-1 min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-bold leading-tight text-slate-900">
              {section.name}
              {section.name.length <= 2 ? " SOP" : ""}
            </h2>
            <p className="truncate text-[11px] text-slate-400">{countOf(section)} 项</p>
          </div>
        </div>
        {section.groups.length > 1 ? (
          <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
            {section.groups.map((group, index) => (
              <button
                key={group.name}
                ref={(el) => (chipRefs.current[index] = el)}
                onClick={() => jump(index)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${
                  active === index ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {group.name.replace(/^[一二三四五六七八九十]+、/, "")}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 px-3 pt-3">
        {section.notes.length ? (
          <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <div className="flex items-center gap-1.5 text-[14px] font-bold text-amber-700">
              <Info size={15} />
              注意
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {section.notes.map((line) => (
                <li key={line} className="text-[14px] leading-relaxed text-amber-900">
                  <Rich text={line} tone="text-amber-950" />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.groups.map((group, gi) => (
          <section key={group.name} ref={(el) => (groupRefs.current[gi] = el)} className="scroll-mt-[104px]">
            <h3 className="mb-1.5 flex items-baseline gap-2 px-1">
              <span className="text-[15px] font-bold text-slate-800">{group.name}</span>
              <span className="text-[12px] font-normal text-slate-400">{group.items.length}</span>
            </h3>
            <ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {group.items.map((item, ii) => {
                const key = `${gi}-${ii}`;
                return (
<ItemCard
key={item.name}
item={item}
groupIndex={gi}
itemIndex={ii}
open={openKeys.has(key)}
onToggle={() => toggle(key)}
flash={flash === key}
/>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function ConvertView({ onBack }) {
  const tables = Object.entries(conversions).filter(([key]) => key !== "meta");
  return (
    <div className="mx-auto max-w-2xl pb-20">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[15px] font-semibold text-emerald-700">
          <ArrowLeft size={18} />返回
        </button>
        <h2 className="text-[17px] font-bold text-slate-900">换算表</h2>
      </div>
      <div className="space-y-3 px-3 pt-3">
        <p className="rounded-xl bg-slate-100 px-3 py-2.5 text-[14px] leading-relaxed text-slate-700">{conversions.meta.ratios}</p>
        {tables.map(([name, rows]) => {
          const isShrimp = name === "虾仁";
          const isTeriyaki = name === "照烧鸡腿";
          return (
            <section key={name} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <h3 className="bg-slate-50 px-3 py-2 text-[15px] font-bold text-slate-800">{name}</h3>
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="text-[12px] text-slate-400">
                    <th className="px-3 py-1.5 text-left font-normal">生重</th>
                    <th className="px-3 py-1.5 text-right font-normal">{isShrimp ? "数量" : "熟重"}</th>
                    {isTeriyaki ? <th className="px-3 py-1.5 text-right font-normal">照烧汁</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row[0]} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-600">
                        <Rich text={String(row[0])} tone="text-slate-800" />
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{row[1]}</td>
                      {isTeriyaki ? <td className="px-3 py-2 text-right font-bold text-emerald-700">{row[2]}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function SopPage() {
const [view, setView] = useState({ type: "home" });
const [aiOpen, setAiOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [seenWeek, setSeenWeek] = useState(() => {
    try {
      return localStorage.getItem("zz_sop_bulletin_seen") || "";
    } catch {
      return "";
    }
  });

  const openBulletin = () => {
    setView({ type: "bulletin" });
    if (latestIssue) {
      try {
        localStorage.setItem("zz_sop_bulletin_seen", latestIssue.week);
      } catch {
        /* ignore */
      }
      setSeenWeek(latestIssue.week);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const results = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) return [];
    const words = keyword.split(/\s+/).filter(Boolean);
    return allItems.filter((item) => words.every((word) => item.haystack.includes(word))).slice(0, 40);
  }, [query]);

  const totalRed = redlines.length;

const openAiItem = (item) => {
setAiOpen(false);
setView({ type: "section", id: item.secId, focus: [item.gi, item.ii] });
};

const page = (() => {
if (view.type === "bulletin") return <BulletinView onBack={() => setView({ type: "home" })} />;
if (view.type === "redlines") return <RedlinesView onBack={() => setView({ type: "home" })} />;
if (view.type === "convert") return <ConvertView onBack={() => setView({ type: "home" })} />;
if (view.type === "wiki") return <WikiView onBack={() => setView({ type: "home" })} />;
  if (view.type === "section") {
    const section = sections.find((item) => item.id === view.id);
        if (section) return <SectionView section={section} onBack={() => setView({ type: "home" })} focus={view.focus} />;
  }

  return (
    <div className="mx-auto max-w-2xl pb-20">
      <header className="sticky top-0 z-10 bg-white px-3 pb-2 pt-3">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h1 className="whitespace-nowrap text-[17px] font-bold text-slate-900">SOP百科</h1>
          <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400">先看红线，再查步骤</span>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-2xl bg-slate-100 px-3">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="忘记步骤、规格、规定？搜一搜试试"
            className="h-12 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="清空" className="p-1 text-slate-400">
              <X size={18} />
            </button>
          ) : null}
        </div>
      </header>

      <div className="space-y-3 px-3 pt-1">
        {query.trim() ? (
          results.length ? (
            <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <h2 className="bg-slate-50 px-3 py-2 text-[13px] font-bold text-slate-500">找到 {results.length} 条</h2>
              <ul>
                {results.map((item) => (
                  <li key={`${item.secId}-${item.group}-${item.name}`} className="border-t border-slate-100 first:border-t-0">
                    <button
                      onClick={() => setView({ type: "section", id: item.secId, focus: [item.gi, item.ii] })}
                      className="flex w-full items-center gap-2 px-3 py-3 text-left active:bg-slate-50"
                    >
                        <div className="min-w-0 flex-1">
                          <p className="text-[16px] font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-0.5 text-[12px] text-slate-400">{item.secName} › {item.group}</p>
                        </div>
                      <ChevronRight size={18} className="shrink-0 text-slate-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-slate-400">没找到，换个词试试</p>
          )
        ) : (
          <>
            {latestIssue ? (
              <button
                onClick={openBulletin}
                className="w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-left active:from-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-amber-300">
                    <Megaphone size={14} />
                    本周黑板报
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {seenWeek !== latestIssue.week ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">新</span>
                    ) : null}
                    <span className="text-[11px] text-slate-400">
                      {latestIssue.week.replace(/^\d{4}-/, "")} · {latestIssue.range}
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 text-[16px] font-bold leading-snug text-white">{latestIssue.title}</p>
<ul className="mt-2 space-y-1.5">
{(latestIssue.items || []).map((raw) => {
const item = typeof raw === "string" ? { t: raw } : raw;
return (
<li key={item.t} className="flex gap-1.5">
<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
<p className="text-[13px] leading-relaxed text-slate-200">
<Rich text={item.t} tone="text-white" />
</p>
</li>
);
})}
</ul>
<div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2">
<span className="text-[12px] text-slate-400">
往期 {Math.max(issues.length - 1, 0)} 期
</span>
                  <span className="flex items-center gap-0.5 text-[12px] font-semibold text-amber-300">
                    查看
                    <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            ) : null}

            <button
              onClick={() => setView({ type: "redlines" })}
              className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-red-700 to-red-500 px-4 py-4 text-left shadow-md active:from-red-800"
            >
              <span className="shrink-0 text-[38px] font-black leading-none text-white">{totalRed}</span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-nowrap text-[18px] font-black leading-tight text-white">
                  条红线 · 大前提
                  <AlertOctagon size={18} className="mb-0.5 ml-1 inline text-amber-300" />
                </p>
                <p className="mt-1 text-[12px] font-medium leading-snug text-red-100">所有环节都得先过这关 · 违反要停业整改</p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-red-100" />
            </button>

            <button
              onClick={() => setAiOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                <Sparkles size={22} className="text-violet-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-slate-900">问 SOP</p>
                <p className="mt-0.5 truncate text-[12px] text-slate-400">忘了步骤、规格、规定，问智能小助手</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-300" />
            </button>

            <div>
              <p className="mb-1.5 flex items-center gap-1 px-1 text-[12px] font-medium text-slate-400">
                店内出餐顺序
                <span className="font-bold text-slate-500">切配&amp;调料分装 → 腌制 → 熟制 → 出餐（菜品构成）</span>
              </p>
              {[
                ...sections.map((section) => ({ type: "section", section })),
                { type: "wiki" },
              ].map((step, index, all) => {
                const isLast = index === all.length - 1;
                const Icon = step.type === "wiki" ? Info : SECTION_ICON[step.section.id] || Scissors;
                const name = step.type === "wiki" ? "菜品构成" : step.section.name;
                const subtitle = step.type === "wiki" ? "每碗的食材与克重" : step.section.subtitle;
                const count = step.type === "wiki" ? `${wikiDishes.length} 道` : `${countOf(step.section)} 项`;
                return (
                  <div key={step.type === "wiki" ? "wiki" : step.section.id} className="flex gap-2.5">
                    <div className="flex w-9 shrink-0 flex-col items-center">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[15px] font-black text-white shadow-sm">
                        {index + 1}
                      </span>
                      {isLast ? null : <span className="mt-1 w-px flex-1 bg-emerald-200" />}
                    </div>
                    <button
                      onClick={() => setView(step.type === "wiki" ? { type: "wiki" } : { type: "section", id: step.section.id })}
                      className="mb-2 flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <Icon size={22} className="text-emerald-600" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="whitespace-nowrap text-[17px] font-bold text-slate-900">{name}</p>
                          {isLast ? (
                            <span className="shrink-0 text-[11px] font-bold text-slate-400">出餐</span>
                          ) : (
                            <span className="shrink-0 text-[11px] font-bold text-emerald-500">下一步 ›</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-[12px] text-slate-400">{subtitle}</p>
                          <span className="shrink-0 whitespace-nowrap text-[12px] font-medium text-slate-400">{count}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-slate-300" />
                    </button>
                  </div>
                );
              })}
            </div>

              <button
                onClick={() => setView({ type: "convert" })}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <Calculator size={22} className="text-slate-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-bold text-slate-900">换算表</p>
                  <p className="mt-0.5 truncate text-[12px] text-slate-400">生重换了熟重多少、照烧汁放多少</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-slate-300" />
              </button>

<p className="flex items-start gap-1.5 px-1 pt-1 text-[12px] leading-relaxed text-slate-400">
          <Star size={12} className="mt-0.5 shrink-0 fill-red-500 text-red-500" />
          <span>步骤里标红的“关键”步骤是维持品质稳定的重点，不可省略或改动。</span>
          <span className="ml-auto shrink-0 pl-2 text-[11px] text-slate-300">v{APP_VERSION}</span>
        </p>
          </>
        )}
      </div>
    </div>
  );
})();

return (
<>
{page}
{aiOpen ? (
<AiView
onOpenItem={openAiItem}
onMinimize={() => setAiOpen(false)}
onClose={() => setAiOpen(false)}
/>
) : (
<button
onClick={() => setAiOpen(true)}
className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-violet-600 px-4 py-3 text-[14px] font-bold text-white shadow-lg active:bg-violet-700"
>
<Sparkles size={16} />
问问智能小助手
</button>
)}
</>
);
}
