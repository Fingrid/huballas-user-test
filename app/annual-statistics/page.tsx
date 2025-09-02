"use client";

import dynamic from "next/dynamic";

const AnnualStatisticsClient = dynamic(() => import("./AnnualStatisticsClient"), { ssr: false });

export default function Page() {
  return <AnnualStatisticsClient />;
}
