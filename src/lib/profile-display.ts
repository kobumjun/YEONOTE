/** Only allow http(s) URLs for avatars to avoid javascript: or other schemes. */
export function safeHttpAvatarUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const t = url.trim();
  if (!t.startsWith("https://") && !t.startsWith("http://")) return null;
  return t;
}

export function resolveAuthEmail(email: unknown, meta: Record<string, unknown> | undefined): string {
  if (typeof email === "string" && email.trim()) return email.trim();
  const m = meta?.email;
  if (typeof m === "string" && m.trim()) return m.trim();
  return "";
}

export function resolveDisplayName(
  profileFullName: string | null | undefined,
  meta: Record<string, unknown> | undefined
): string {
  const p = typeof profileFullName === "string" ? profileFullName.trim() : "";
  if (p) return p;
  const fn = meta?.full_name;
  if (typeof fn === "string" && fn.trim()) return fn.trim();
  const name = meta?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return "";
}

export function resolveAvatarFromMeta(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  const a = meta.avatar_url;
  if (typeof a === "string") return safeHttpAvatarUrl(a);
  const pic = meta.picture;
  if (typeof pic === "string") return safeHttpAvatarUrl(pic);
  return null;
}
