import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-7 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo statique, dimensions fixes connues */}
        <img src="/brand/octane-connect-logo.png" alt="Octane Connect" className="h-14 w-auto mb-6" />
        <p className="text-sm text-slate-400 mb-6">Connectez-vous pour accéder à l&apos;espace atelier.</p>
        <LoginForm />
      </div>
    </div>
  );
}
