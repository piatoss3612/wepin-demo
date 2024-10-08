"use client";

import dynamic from "next/dynamic";

const WepinBox = dynamic(() => import("@/components"), { ssr: false });

export default function Home() {
  return (
    <div className="flex items-center justify-center p-16 min-h-screen bg-gray-200">
      <WepinBox />
    </div>
  );
}
