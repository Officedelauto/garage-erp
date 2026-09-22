import { Wrench } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 shrink-0 bg-ink-950 p-4 flex flex-col">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Wrench size={16} strokeWidth={2.5} />
          </span>
          <p className="font-heading text-base font-semibold text-white">Garage ERP</p>
        </div>
        <div className="flex-1">
          <SidebarNav />
        </div>
        <div className="border-t border-white/10 pt-3 px-2">
          <p className="text-xs text-slate-400 mb-2 truncate">{session.name}</p>
          <form action={logout}>
            <Button
              type="submit"
              size="sm"
              className="w-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
