"use client";

import dynamic from "next/dynamic";

const AlgoRadarChart = dynamic(() => import("@/components/status/RadarChart"), { ssr: false });

export default AlgoRadarChart;
