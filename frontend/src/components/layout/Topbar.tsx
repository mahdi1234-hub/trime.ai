"use client";

import { Bell, Home, Search } from "lucide-react";
import { useState } from "react";

export function Topbar({ title }: { title: string }) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <header className="h-16 border-b border-stone-300/60 px-6 flex items-center justify-between shrink-0 bg-[#EAE8E2]/80 backdrop-blur-sm z-10">
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Home className="w-4 h-4" />
        <span>/</span>
        <span className="text-stone-900 font-medium">{title}</span>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center cursor-pointer gap-2">
          <span
            className="text-[10px] uppercase tracking-widest text-stone-500 font-medium"
            style={{ letterSpacing: "-0.025em" }}
          >
            Auto-Refresh
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              autoRefresh ? "bg-stone-900" : "bg-stone-300"
            }`}
          >
            <div
              className={`w-3 h-3 bg-[#EAE8E2] rounded-full absolute top-0.5 transition-transform ${
                autoRefresh ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
        </label>
        <div className="w-px h-4 bg-stone-300/80" />
        <button className="text-stone-500 hover:text-stone-900 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="text-stone-500 hover:text-stone-900 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
