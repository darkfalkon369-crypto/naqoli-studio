import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "naqoli_auth";
const TOKEN_MSG = "naqoli-admin:v1";

async function expectedToken(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(TOKEN_MSG));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isAuthenticated(req: NextRequest, secret: string): Promise<boolean> {
  const value = req.cookies.get(COOKIE)?.value;
  if (!value) return false;
  const expected = await expectedToken(secret);
  return value === expected;
}

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const { pathname } = req.nextUrl;

  if (!secret) {
    return new NextResponse(
      "AUTH_SECRET is not configured. Re-run setup.sh or add AUTH_SECRET to .env.",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  if (pathname === "/login") {
    if (await isAuthenticated(req, secret)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (await isAuthenticated(req, secret)) {
    return NextResponse.next();
  }

  // API requests get a clean 401 instead of an HTML redirect
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - next internals & static assets
     * - /thumbs (video covers) and /setup.sh (public installer download)
     * - /login page, auth endpoints, Telegram webhook and healthcheck
     */
    "/((?!_next/static|_next/image|favicon.ico|thumbs/|setup.sh|login|api/auth|api/webhook|api/health).*)",
  ],
};
