"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  Radio,
  Rss,
  Settings,
  Zap,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";

const navSections = [
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/feeds", icon: Newspaper, label: "Live Feeds" },
      { href: "/trends", icon: TrendingUp, label: "Trends", badge: "Live" },
      { href: "/signals", icon: Radio, label: "Signals" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/feeds#sources", icon: Rss, label: "Feed Sources" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-stone-300/60 bg-[#EAE8E2] flex flex-col shrink-0">
      {/* Workspace selector */}
      <div className="p-5 border-b border-stone-300/60 flex items-center justify-between cursor-pointer hover:bg-stone-300/20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-stone-900 text-[#EAE8E2] flex items-center justify-center font-medium text-sm font-display">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-stone-800 tracking-tight">
              Trime.ai
            </span>
            <span className="text-xs text-stone-500">Real-time Intel</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-stone-400" />
      </div>

      {/* Nav */}
      <div className="p-4 flex-1 overflow-y-auto space-y-1">
        {navSections.map((section) => (
          <div key={section.label}>
            <p
              className="px-3 text-[10px] uppercase tracking-widest text-stone-400 font-medium mb-3 mt-6"
              style={{ letterSpacing: "-0.025em" }}
            >
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                    active
                      ? "text-stone-900 bg-stone-300/40"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-300/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-[18px] h-[18px]" />
                    {item.label}
                  </div>
                  {"badge" in item && item.badge && (
                    <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded border border-stone-300/50">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-stone-300/60">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-stone-300 flex items-center justify-center text-stone-600 text-xs font-medium">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-stone-700">Pipeline Active</span>
            <span className="text-[10px] text-green-600">Processing</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
