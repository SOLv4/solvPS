"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CompareItem {
  tag: string;
  name: string;
  me: number;
  rival: number;
  diff: number;
}

interface RivalData {
  me: { handle: string; tierName: string; rating: number };
  rival: { handle: string; tierName: string; rating: number };
  comparison: CompareItem[];
}

export default function RivalChart({ data }: { data: RivalData }) {
  const filtered = data.comparison.filter((item) => item.me > 0 || item.rival > 0);
  const winning = filtered.filter((item) => item.diff > 0).length;
  const losing = filtered.filter((item) => item.diff < 0).length;
  const even = filtered.filter((item) => item.diff === 0).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-[#F8FBFF] px-3.5 py-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1E56F0]" />
            <span className="font-semibold text-slate-700">@{data.me.handle}</span>
            <span className="text-xs text-slate-500">
              {data.me.tierName} · {data.me.rating}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {data.rival.tierName} · {data.rival.rating}
            </span>
            <span className="font-semibold text-slate-700">@{data.rival.handle}</span>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#6A91FF]" />
          </div>
        </div>
      </div>

      <div className="h-[270px] rounded-2xl bg-gradient-to-b from-[#f8fbff] to-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filtered} margin={{ top: 6, right: 8, left: -20, bottom: 2 }}>
            <defs>
              <linearGradient id="rival-me-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E56F0" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#3F75FF" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="rival-opponent-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8AAAFF" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#6A91FF" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7EEFF" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              cursor={{ fill: "rgba(236, 244, 255, 0.7)" }}
              contentStyle={{
                border: "1px solid #D9E6FF",
                borderRadius: 12,
                background: "rgba(255,255,255,0.97)",
                boxShadow: "0 12px 30px -24px rgba(15,70,216,0.6)",
              }}
              formatter={(value, key) => {
                if (key === "me") return [`${value}문제`, `@${data.me.handle}`];
                return [`${value}문제`, `@${data.rival.handle}`];
              }}
            />
            <Bar dataKey="me" name={`@${data.me.handle}`} fill="url(#rival-me-bar)" radius={[5, 5, 0, 0]} />
            <Bar dataKey="rival" name={`@${data.rival.handle}`} fill="url(#rival-opponent-bar)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-blue-100 bg-[#F5F8FF] py-3">
          <p className="text-lg font-bold text-[#1248DA]">{winning}</p>
          <p className="text-slate-500">내가 앞선 태그</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white py-3">
          <p className="text-lg font-bold text-slate-700">{even}</p>
          <p className="text-slate-500">비슷한 태그</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-[#F5F8FF] py-3">
          <p className="text-lg font-bold text-[#4B6FE0]">{losing}</p>
          <p className="text-slate-500">라이벌 우위 태그</p>
        </div>
      </div>
    </div>
  );
}
