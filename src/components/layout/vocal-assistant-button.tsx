"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export function VocalAssistantButton() {
  const pathname = usePathname();
  const active = pathname === "/vocal" || pathname.startsWith("/vocal/");

  return (
    <Link
      href="/vocal"
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-brand-500 text-white shadow-sm shadow-brand-900/30"
          : "bg-white/5 text-white border border-white/15 hover:bg-white/10"
      )}
    >
      <Mic size={17} strokeWidth={2.2} />
      Assistant vocal
    </Link>
  );
}
