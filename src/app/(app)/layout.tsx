import { verifySession } from "@/lib/dal";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4 flex flex-col">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-slate-900">Garage ERP</p>
        </div>
        <div className="flex-1">
          <SidebarNav />
        </div>
        <div className="border-t border-slate-100 pt-3 px-2">
          <p className="text-xs text-slate-500 mb-2">{session.name}</p>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
