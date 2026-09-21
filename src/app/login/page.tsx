import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Garage ERP</h1>
        <p className="text-sm text-slate-500 mb-6">Connectez-vous pour accéder à l&apos;espace atelier.</p>
        <LoginForm />
      </div>
    </div>
  );
}
