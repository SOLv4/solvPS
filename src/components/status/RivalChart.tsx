"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const filtered = data.comparison.filter((d) => d.me > 0 || d.rival > 0);
  const winning = data.comparison.filter((d) => d.diff > 0).length;
  const losing = data.comparison.filter((d) => d.diff < 0).length;
  const even = data.comparison.filter((d) => d.diff === 0 && (d.me > 0 || d.rival > 0)).length;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0046FE] inline-block" />
          <span className="font-medium text-gray-700">@{data.me.handle}</span>
          <span className="text-gray-400 text-xs">{data.me.tierName} · {data.me.rating}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">{data.rival.tierName} · {data.rival.rating}</span>
          <span className="font-medium text-gray-700">@{data.rival.handle}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E67FE] inline-block" />
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={filtered} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" />
          <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
          <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #DBEAFE", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,70,254,0.08)" }}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#6B7280" }} />
          <Bar dataKey="me" name={`@${data.me.handle}`} fill="#0046FE" radius={[3, 3, 0, 0]} />
          <Bar dataKey="rival" name={`@${data.rival.handle}`} fill="#2E67FE" radius={[3, 3, 0, 0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-blue-50 border border-blue-100 rounded-xl py-3">
          <p className="text-[#0046FE] font-bold text-lg">{winning}</p>
          <p className="text-gray-400 mt-0.5">내가 앞선 태그</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl py-3">
          <p className="text-gray-600 font-bold text-lg">{even}</p>
          <p className="text-gray-400 mt-0.5">비슷한 태그</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl py-3">
          <p className="text-[#2E67FE] font-bold text-lg">{losing}</p>
          <p className="text-gray-400 mt-0.5">라이벌이 앞선 태그</p>
        </div>
      </div>
    </div>
  );
}
