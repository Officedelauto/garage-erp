import { Wrench } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-7 shadow-xl">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Wrench size={20} strokeWidth={2.5} />
        </span>
        <h1 className="font-heading text-xl font-semibold text-white mb-1">Garage ERP</h1>
        <p className="text-sm text-slate-400 mb-6">Connectez-vous pour accéder à l&apos;espace atelier.</p>
        <LoginForm />
      </div>
    </div>
  );
}
