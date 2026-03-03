"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

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
  // 차이가 있는 태그만 표시
  const filtered = data.comparison.filter((d) => d.me > 0 || d.rival > 0);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span className="text-gray-300 font-medium">@{data.me.handle}</span>
          <span className="text-gray-600">{data.me.tierName} · {data.me.rating}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">{data.rival.tierName} · {data.rival.rating}</span>
          <span className="text-gray-300 font-medium">@{data.rival.handle}</span>
          <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={filtered} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            labelStyle={{ color: "#f3f4f6", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
          <Bar dataKey="me" name={`@${data.me.handle}`} fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="rival" name={`@${data.rival.handle}`} fill="#f97316" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        {(() => {
          const winning = data.comparison.filter((d) => d.diff > 0).length;
          const losing = data.comparison.filter((d) => d.diff < 0).length;
          const even = data.comparison.filter((d) => d.diff === 0 && (d.me > 0 || d.rival > 0)).length;
          return (
            <>
              <div className="bg-blue-900/40 rounded-lg py-2">
                <p className="text-blue-300 font-bold text-lg">{winning}</p>
                <p className="text-gray-500">내가 앞선 태그</p>
              </div>
              <div className="bg-gray-800 rounded-lg py-2">
                <p className="text-gray-300 font-bold text-lg">{even}</p>
                <p className="text-gray-500">비슷한 태그</p>
              </div>
              <div className="bg-orange-900/40 rounded-lg py-2">
                <p className="text-orange-300 font-bold text-lg">{losing}</p>
                <p className="text-gray-500">라이벌이 앞선 태그</p>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
