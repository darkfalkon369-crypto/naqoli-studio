export function faNum(n: number | string | null | undefined): string {
  return new Intl.NumberFormat("fa-IR").format(Number(n ?? 0));
}

export function faCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${trim1(m)} میلیون`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `${trim1(k)} هزار`;
  }
  return faNum(n);
}

function trim1(x: number): string {
  const s = (Math.round(x * 10) / 10).toLocaleString("fa-IR");
  return s.replace(/[٫,]0$/, "");
}

export function faTime(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function faDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    month: "long",
    day: "numeric",
  });
}

export function faDateTime(iso: string | Date): string {
  return `${faDate(iso)} — ${faTime(iso)}`;
}

export function relTime(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const min = Math.round(abs / 60000);
  if (min < 1) return future ? "لحظاتی دیگر" : "همین حالا";
  if (min < 60) return future ? `${faNum(min)} دقیقه دیگر` : `${faNum(min)} دقیقه پیش`;
  const hr = Math.round(min / 60);
  if (hr < 24) return future ? `${faNum(hr)} ساعت دیگر` : `${faNum(hr)} ساعت پیش`;
  const d = Math.round(hr / 24);
  return future ? `${faNum(d)} روز دیگر` : `${faNum(d)} روز پیش`;
}

export function faDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${faNum(m)}:${faNum(s).padStart(2, "۰")}`;
}
