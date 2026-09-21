"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

const LoginSchema = z.object({
  email: z.string().trim().min(1, "Email requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Merci de renseigner un email et un mot de passe." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email ou mot de passe incorrect." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Email ou mot de passe incorrect." };
  }

  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
