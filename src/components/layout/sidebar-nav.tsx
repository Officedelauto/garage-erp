"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Boxes,
  ShoppingCart,
  FileText,
  ClipboardList,
  Receipt,
  Undo2,
  CalendarClock,
  Sparkles,
  IdCard,
  Settings,
  UserCircle,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; icon: LucideIcon; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

const nav: NavEntry[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/vehicules", label: "Véhicules", icon: Car },
  {
    label: "Vente",
    icon: ShoppingCart,
    items: [
      { href: "/documents/devis", label: "Devis", icon: FileText },
      { href: "/documents/commandes", label: "Bons de commande", icon: ClipboardList },
      { href: "/documents/factures", label: "Factures", icon: Receipt },
      { href: "/documents/avoirs", label: "Avoirs", icon: Undo2 },
    ],
  },
  {
    label: "Atelier",
    icon: CalendarClock,
    items: [
      { href: "/atelier", label: "Planning", icon: CalendarClock },
      { href: "/stock", label: "Stock garage", icon: Boxes },
      { href: "/sav", label: "SAV intelligent", icon: Sparkles },
    ],
  },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/siv", label: "SIV", icon: IdCard },
  {
    label: "Administratif",
    icon: Settings,
    items: [
      { href: "/parametres", label: "Paramètres", icon: Settings },
      { href: "/compte", label: "Compte", icon: UserCircle },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
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

function GroupItem({ entry, pathname }: { entry: NavGroup; pathname: string }) {
  const groupActive = entry.items.some((item) => isActive(pathname, item.href));
  const [open, setOpen] = useState(groupActive);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          groupActive ? "text-brand-400" : "text-slate-300 hover:bg-white/5 hover:text-white"
        )}
      >
        <entry.icon size={17} strokeWidth={2} className={groupActive ? "text-brand-400" : "text-slate-400"} />
        <span className="flex-1 text-left">{entry.label}</span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={cn("transition-transform", open ? "rotate-180" : "")}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-1 pl-5 pt-1">
          {entry.items.map((item) => (
            <LinkItem key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {nav.map((entry) =>
        isGroup(entry) ? (
          <GroupItem key={entry.label} entry={entry} pathname={pathname} />
        ) : (
          <LinkItem key={entry.href} {...entry} active={isActive(pathname, entry.href)} />
        )
      )}
    </nav>
  );
}
