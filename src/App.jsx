import { useState } from "react";
import { Leaf, ShieldAlert } from "lucide-react";
import Index from "./pages/Index.jsx";
import ExceptionPage from "./pages/ExceptionPage.jsx";

const TABS = [
  { id: "prep", label: "餐品备料", icon: Leaf },
  { id: "exception", label: "异常处理", icon: ShieldAlert },
];

const App = () => {
  const [tab, setTab] = useState("prep");
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-slate-800">
      <header className="border-b border-emerald-900/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white">
              <Leaf size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">壮壮FIT 门店助手</h1>
              <p className="text-sm text-slate-500">餐品备料 · 门店异常处理</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-1">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      {tab === "prep" ? <Index /> : <ExceptionPage />}
    </main>
  );
};

export default App;
