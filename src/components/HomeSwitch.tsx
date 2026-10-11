"use client";

import { useSearchParams } from "next/navigation";

/** `/` shows the landing page; `/?begin=1` shows the guided intake. */
export function HomeSwitch({ landing, intake }: { landing: React.ReactNode; intake: React.ReactNode }) {
  const params = useSearchParams();
  return <>{params.get("begin") === "1" ? intake : landing}</>;
}
