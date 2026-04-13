import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Trime.ai — Real-time News & Trends Intelligence",
  description:
    "Monitor news feeds, detect emerging trends, and get real-time signals powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-body">
        <div className="max-w-[1600px] mx-auto">
          <div
            className="border border-stone-300/60 rounded-md bg-[#EAE8E2] shadow-2xl shadow-stone-800/10 flex flex-col md:flex-row overflow-hidden relative"
            style={{ height: "100vh" }}
          >
            <Sidebar />
            <main className="flex-1 flex flex-col bg-[#EAE8E2] overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
