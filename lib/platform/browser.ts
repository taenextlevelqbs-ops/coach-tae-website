"use client";
import { createClient } from "@supabase/supabase-js";
let client: ReturnType<typeof createClient> | undefined;
export function browser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return (client ||= createClient(url, key));
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const session = await browser()?.auth.getSession();
  const token = session?.data.session?.access_token;
  const response = await fetch(`/api/platform/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
export const privateCalendly =
  "https://calendly.com/taenextlevelqbs/individual-training-clone";
export const groupCalendly =
  "https://calendly.com/taenextlevelqbs/group-training";
