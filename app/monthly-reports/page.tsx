"use client";

import dynamic from "next/dynamic";

const MonthlyReportsClient = dynamic(() => import("./MonthlyReportsClient"), { ssr: false });

export default function Page() {
  return <MonthlyReportsClient />;
}
