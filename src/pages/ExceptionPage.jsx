import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Search, ShieldAlert } from "lucide-react";
import exceptionData from "@/exception_flow.json";

const { categories } = exceptionData;
const allItems = categories.flatMap((cat) => cat.items.map((item) => ({ ...item, type: cat.type })));

const LEVEL_STYLE = {
  L1: "bg-emerald-100 text-emerald-700",
  L2: "bg-amber-100 text-amber-700",
  L3: "bg-red-100 text-red-700",
};

function tokenize(text) {
  return String(text || "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase();
}

function matchItems(query) {
  const q = tokenize(query);
  if (!q) return [];
  const qChars = new Set(q);

  const scored = allItems.map((item) => {
    const keywords = [item.type, item.module, item.description, ...(item.keywords || [])].filter(Boolean);
    let score = 0;

    // 1. 精确子串匹配（最高权重）
    for (const kw of keywords) {
      const k = tokenize(kw);
      if (!k) continue;
      if (q.includes(k)) score = Math.max(score, k.length * 4);
      else if (k.length >= 2 && k.includes(q)) score = Math.max(score, q.length * 2);
    }

    // 2. 字符重叠模糊匹配（兜底：至少 2 个共同字符才计入）
    const searchChars = new Set(tokenize(keywords.join("")));
    let overlap = 0;
    for (const ch of qChars) if (searchChars.has(ch)) overlap++;
    if (overlap >= 2) score += overlap * 2;

    return { item, score };
  });

  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
}

export default function ExceptionPage() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const results = useMemo(() => matchItems(query), [query]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[0.9fr_1.2fr]">
      <section className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-emerald-600" />
            <h2 className="font-bold">异常处理助手</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">输入顾客反馈的问题，自动匹配对应处理流程。</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：餐里有头发、漏了餐具、骑手送错了…"
              className="h-12 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {query.trim() && results.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              没找到匹配项，换个说法试试，或从右侧 FAQ 列表直接查找。
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400">匹配到 {results.length} 条处理流程</p>
              {results.map(({ item }) => (
                <ResultCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-emerald-600" />
            <h2 className="font-bold">异常处理流程（FAQ）</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">按问题类型浏览全部处理流程。</p>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.type} className="px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">{cat.type}</h3>
                {cat.note && <span className="text-xs text-slate-400">（{cat.note}）</span>}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{cat.items.length}</span>
              </div>
              <div className="mt-2 space-y-2">
                {cat.items.map((item) => (
                  <FaqItem
                    key={item.id}
                    item={{ ...item, type: cat.type }}
                    open={openId === item.id}
                    toggle={() => setOpenId(openId === item.id ? null : item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ResultCard({ item }) {
  return (
    <article className="overflow-hidden rounded-xl border border-emerald-200">
      <div className="bg-emerald-50/50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-emerald-700">{item.type}</span>
          {item.module && <span className="text-xs text-slate-500">{item.module}</span>}
          <LevelBadge level={item.level} />
        </div>
        <p className="mt-1 font-semibold text-slate-800">{item.description}</p>
      </div>
      <div className="space-y-2.5 p-4">
        <ActionRow label="周期购订单" text={item.subscription} />
        <ActionRow label="域内订单" text={item.domain} />
      </div>
    </article>
  );
}

function FaqItem({ item, open, toggle }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <button onClick={toggle} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={item.level} />
          <span className="text-sm font-medium text-slate-700">
            {item.module ? `${item.module} · ` : ""}
            {item.description}
          </span>
        </div>
        {open ? <ChevronUp size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          <ActionRow label="周期购订单处理" text={item.subscription} />
          <ActionRow label="域内订单处理" text={item.domain} />
        </div>
      )}
    </div>
  );
}

function ActionRow({ label, text }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-emerald-50/50 px-3 py-2.5">
      <p className="text-xs font-bold text-emerald-700">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function LevelBadge({ level }) {
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${LEVEL_STYLE[level] || "bg-slate-100 text-slate-600"}`}>{level}</span>;
}
