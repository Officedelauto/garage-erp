import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { PasswordForm } from "./password-form";

export default async function AccountPage() {
  const session = await verifySession();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink-900 mb-1">Mon compte</h1>
        <p className="text-sm text-slate-500">
          {user?.name} — {user?.email} ({user?.role === "ADMIN" ? "Administrateur" : "Collaborateur"})
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Changer le mot de passe</h2>
        <PasswordForm />
      </div>
    </div>
  );
}
