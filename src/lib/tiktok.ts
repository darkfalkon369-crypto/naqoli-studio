import crypto from "crypto";
import QRCode from "qrcode";
import { getSettings } from "./pipeline";

const API = "https://open.tiktokapis.com";
export const TIKTOK_SCOPES = "user.info.basic,video.publish";

export interface Credentials {
  clientKey: string;
  clientSecret: string;
}

export async function getTikTokCredentials(): Promise<Credentials> {
  const s = await getSettings();
  return {
    clientKey: s.tiktokClientKey.trim() || process.env.TIKTOK_CLIENT_KEY || "",
    clientSecret:
      s.tiktokClientSecret.trim() || process.env.TIKTOK_CLIENT_SECRET || "",
  };
}

async function formPost(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export interface QrStartResult {
  qrDataUrl: string;
  token: string;
  ticket: string;
}

/** Step 1: ask TikTok for a QR deep link and render it as a PNG data URL. */
export async function startQrLogin(): Promise<QrStartResult> {
  const { clientKey } = await getTikTokCredentials();
  if (!clientKey) {
    throw new Error("ابتدا Client Key اپ تیک‌تاک را ذخیره کنید");
  }
  const { body } = await formPost(`${API}/v2/oauth/get_qrcode/`, {
    client_key: clientKey,
    scope: TIKTOK_SCOPES,
    state: crypto.randomBytes(6).toString("hex"),
  });
  if (body.error || !body.scan_qrcode_url || !body.token) {
    throw new Error(
      body.error_description || body.error || "سرویس تیک‌تاک کد کیوآر نداد"
    );
  }
  const ticket = crypto.randomBytes(8).toString("hex");
  const deepLink = String(body.scan_qrcode_url).replace(
    /client_ticket=[^&]*/,
    `client_ticket=${ticket}`
  );
  const qrDataUrl = await QRCode.toDataURL(deepLink, {
    width: 320,
    margin: 2,
    color: { dark: "#241d14", light: "#fffdf8" },
  });
  return { qrDataUrl, token: String(body.token), ticket };
}

export interface QrCheckResult {
  status: "new" | "scanned" | "confirmed" | "expired" | "utilised" | "error";
  error?: string;
  code?: string;
}

/** Step 2: poll the QR status. */
export async function checkQrLogin(token: string, ticket: string): Promise<QrCheckResult> {
  const creds = await getTikTokCredentials();
  const { body } = await formPost(`${API}/v2/oauth/check_qrcode/`, {
    client_key: creds.clientKey,
    client_secret: creds.clientSecret,
    token,
  });
  if (body.error) {
    return { status: "error", error: body.error_description || body.error };
  }
  const status = String(body.status ?? "new") as QrCheckResult["status"];
  if (status === "confirmed" && body.client_ticket && body.client_ticket !== ticket) {
    return { status: "error", error: "اعتبارسنجی یکپارچگی (client_ticket) ناموفق بود" };
  }
  if (status === "confirmed" && body.redirect_uri) {
    const url = new URL(String(body.redirect_uri));
    const code = url.searchParams.get("code") ?? undefined;
    return { status, code };
  }
  return { status };
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
  scope: string;
}

/** Step 3: exchange the authorization code for access/refresh tokens. */
export async function exchangeCode(code: string): Promise<TokenSet> {
  const creds = await getTikTokCredentials();
  const { body } = await formPost(`${API}/v2/oauth/token/`, {
    client_key: creds.clientKey,
    client_secret: creds.clientSecret,
    code,
    grant_type: "authorization_code",
  });
  if (body.error || !body.access_token) {
    throw new Error(body.error_description || body.error || "دریافت توکن ناموفق بود");
  }
  return {
    accessToken: String(body.access_token),
    refreshToken: String(body.refresh_token ?? ""),
    expiresIn: Number(body.expires_in ?? 86400),
    openId: String(body.open_id ?? ""),
    scope: String(body.scope ?? ""),
  };
}

export interface TikTokProfile {
  openId: string;
  username: string;
  displayName: string;
  avatar: string;
}

/**
 * Validate a web session cookie by asking TikTok for the user's profile.
 * Returns the profile when the session is valid; null when it is not
 * (or when TikTok blocks the check from this server — callers should
 * treat null as "not validated" rather than "definitely invalid").
 */
export async function validateSession(
  username: string,
  sessionCookie: string
): Promise<TikTokProfile | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://www.tiktok.com/api/user/detail/?uniqueId=${encodeURIComponent(username)}`,
      {
        signal: controller.signal,
        headers: {
          cookie: `sessionid=${sessionCookie}`,
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          referer: "https://www.tiktok.com/",
        },
      }
    );
    const body = await res.json().catch(() => ({}));
    const u = body?.userInfo?.user;
    if (!u || !u.id) return null;
    return {
      openId: String(u.id),
      username: String(u.uniqueId ?? username),
      displayName: String(u.nickname ?? username),
      avatar: String(u.avatarThumb ?? ""),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface AyrshareResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Publish a real video file through the Ayrshare relay service. */
export async function postViaAyrshare(
  apiKey: string,
  opts: { text: string; videoUrl: string }
): Promise<AyrshareResult> {
  try {
    const res = await fetch("https://app.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        post: opts.text,
        platforms: ["tiktok"],
        mediaUrls: [{ url: opts.videoUrl, type: "video" }],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body?.message ?? body?.error ?? `HTTP ${res.status}` };
    }
    const id = Array.isArray(body?.postIds) ? body.postIds[0]?.id : body?.id;
    return { ok: true, id: id ? String(id) : undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

/** Step 4: fetch the authorized user's profile. */
export async function fetchProfile(accessToken: string, openId: string): Promise<TikTokProfile> {
  const res = await fetch(`${API}/v2/user/info/?fields=open_id,username,display_name,avatar_url_100`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json().catch(() => ({}));
  const u = body?.data?.user ?? {};
  return {
    openId: openId || String(u.open_id ?? ""),
    username: String(u.username ?? `tiktok_${crypto.randomBytes(3).toString("hex")}`),
    displayName: String(u.display_name ?? u.username ?? "حساب تیک‌تاک"),
    avatar: String(u.avatar_url_100 ?? ""),
  };
}
