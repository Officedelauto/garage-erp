import { verifySession } from "@/lib/dal";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { VocalAssistantButton } from "@/components/layout/vocal-assistant-button";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white">
      <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto bg-ink-950 p-4 flex flex-col print:hidden">
        <div className="mb-5 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo statique, dimensions fixes connues */}
          <img src="/brand/octane-connect-logo.png" alt="Octane Connect" className="h-11 w-auto" />
        </div>
        <div className="mb-4">
          <VocalAssistantButton />
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
      <main className="flex-1 p-6 print:p-0">{children}</main>
    </div>
  );
}
