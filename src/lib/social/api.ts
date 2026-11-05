"use client";

import { supabase } from "@/lib/supabase/client";
import type { GiftKind } from "@/data/gifts";

/**
 * Social API (friends & gifts). Row Level Security on the server decides what
 * anyone can read or write; these helpers just call it. No wellness data here.
 */
export interface Profile {
  id: string;
  nickname: string;
  invite_code: string;
  greenhouse: { code?: string };
}

export interface Friend {
  id: string;
  nickname: string;
  greenhouse: { code?: string };
}

export interface Gift {
  id: number;
  kind: GiftKind;
  message: number;
  created_at: string;
  sender: { nickname: string } | null;
}

export async function myProfile(uid: string): Promise<Profile | null> {
  const { data } = await supabase().from("profiles").select("id, nickname, invite_code, greenhouse").eq("id", uid).maybeSingle();
  return (data as Profile) ?? null;
}

export async function updateProfile(uid: string, patch: Partial<Pick<Profile, "nickname" | "greenhouse">>) {
  const { error } = await supabase()
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", uid);
  return !error;
}

export async function listFriends(uid: string): Promise<Friend[]> {
  const sb = supabase();
  const { data: pairs } = await sb.from("friendships").select("user_a, user_b");
  const ids = (pairs ?? []).map((p) => (p.user_a === uid ? p.user_b : p.user_a));
  if (!ids.length) return [];
  const { data } = await sb.from("profiles").select("id, nickname, greenhouse").in("id", ids);
  return ((data ?? []) as Friend[]).sort((a, b) => a.nickname.localeCompare(b.nickname, "ko"));
}

/** Returns the friend's nickname, or null if the code is unknown / not allowed. */
export async function addFriend(code: string): Promise<string | null> {
  const { data, error } = await supabase().rpc("add_friend", { code });
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function blockFriend(id: string) {
  const { error } = await supabase().rpc("block_user", { target: id });
  return !error;
}

/** "sent" | "already" (one of each kind per friend per day) | "error" */
export async function sendGift(to: string, kind: GiftKind, message: number): Promise<"sent" | "already" | "error"> {
  const { error } = await supabase().from("gifts").insert({ to_id: to, kind, message });
  if (!error) return "sent";
  return error.code === "23505" ? "already" : "error";
}

export async function unseenGifts(uid: string): Promise<Gift[]> {
  const { data } = await supabase()
    .from("gifts")
    .select("id, kind, message, created_at, sender:profiles!gifts_from_id_fkey(nickname)")
    .eq("to_id", uid)
    .eq("seen", false)
    .order("created_at", { ascending: true })
    .limit(20);
  return (data ?? []) as unknown as Gift[];
}

export async function markSeen(ids: number[]) {
  if (!ids.length) return;
  await supabase().from("gifts").update({ seen: true }).in("id", ids);
}

/** Deletes the account and everything stored for it on the server (friends, gifts, profile). */
export async function deleteMyAccount() {
  const { error } = await supabase().rpc("delete_my_account");
  if (!error) await supabase().auth.signOut();
  return !error;
}
