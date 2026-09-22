"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Boxes,
  FileText,
  Receipt,
  Sparkles,
  Mic,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/vehicules", label: "Véhicules", icon: Car },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/documents/devis", label: "Devis", icon: FileText },
  { href: "/documents/factures", label: "Factures", icon: Receipt },
  { href: "/sav", label: "SAV intelligent", icon: Sparkles },
  { href: "/vocal", label: "Assistant vocal", icon: Mic },
  { href: "/parametres", label: "Réglages", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-500 text-white shadow-sm shadow-brand-900/30"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon size={17} strokeWidth={2} className={active ? "text-white" : "text-slate-400"} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
