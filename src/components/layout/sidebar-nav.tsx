"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/vehicules", label: "Véhicules" },
  { href: "/stock", label: "Stock" },
  { href: "/documents/devis", label: "Devis" },
  { href: "/documents/factures", label: "Factures" },
  { href: "/sav", label: "SAV intelligent" },
  { href: "/parametres", label: "Réglages" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
