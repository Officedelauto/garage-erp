"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Boxes,
  ShoppingCart,
  FileText,
  Receipt,
  CalendarClock,
  Sparkles,
  Mic,
  IdCard,
  Settings,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavEntry = NavLink | { label: string; icon: LucideIcon; items: NavLink[] };

const nav: NavEntry[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/vehicules", label: "Véhicules", icon: Car },
  { href: "/stock", label: "Stock garage", icon: Boxes },
  {
    label: "Vente",
    icon: ShoppingCart,
    items: [
      { href: "/documents/devis", label: "Devis", icon: FileText },
      { href: "/documents/factures", label: "Factures", icon: Receipt },
    ],
  },
  { href: "/atelier", label: "Atelier", icon: CalendarClock },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/sav", label: "SAV intelligent", icon: Sparkles },
  { href: "/vocal", label: "Assistant vocal", icon: Mic },
  { href: "/siv", label: "SIV", icon: IdCard },
  { href: "/parametres", label: "Paramètres", icon: Settings },
  { href: "/compte", label: "Compte", icon: UserCircle },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function LinkItem({ href, label, icon: Icon, active }: NavLink & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-500 text-white shadow-sm shadow-brand-900/30"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={17} strokeWidth={2} className={active ? "text-white" : "text-slate-400"} />
      {label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {nav.map((entry) => {
        if ("href" in entry) {
          return <LinkItem key={entry.href} {...entry} active={isActive(pathname, entry.href)} />;
        }

        const groupActive = entry.items.some((item) => isActive(pathname, item.href));
        return (
          <div key={entry.label} className="mt-1">
            <div
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                groupActive ? "text-brand-400" : "text-slate-500"
              )}
            >
              <entry.icon size={14} strokeWidth={2.5} />
              {entry.label}
            </div>
            <div className="flex flex-col gap-1 pl-2">
              {entry.items.map((item) => (
                <LinkItem key={item.href} {...item} active={isActive(pathname, item.href)} />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
