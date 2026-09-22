import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedPrefixes = [
  "/dashboard",
  "/clients",
  "/vehicules",
  "/stock",
  "/documents",
  "/atelier",
  "/sav",
  "/siv",
  "/parametres",
  "/vocal",
  "/compte",
];
const publicRoutes = ["/login"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedPrefixes.some((prefix) => path.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
