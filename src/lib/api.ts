"use client";

import { useCallback, useEffect, useState } from "react";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `خطا در درخواست (${res.status})`);
  }
  return (await res.json()) as T;
}

/** هر بار که پایپ‌لاین خودکار تیک می‌زند یا تغییری دستی ثبت می‌شود. */
export function bump() {
  window.dispatchEvent(new Event("pipeline:tick"));
}

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("toast", { detail: message }));
}

export function useFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(path, { cache: "no-store" });
      if (r.ok) setData((await r.json()) as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای شبکه");
    }
  }, [path]);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("pipeline:tick", h);
    return () => window.removeEventListener("pipeline:tick", h);
  }, [load]);

  return { data, error, refetch: load };
}
