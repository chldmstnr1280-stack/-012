"use client";

import { IS_TOSS } from "@/lib/platform";

/**
 * Walk-mission photos: taken with the camera, shrunk on the device and kept in
 * this device's IndexedDB only (never uploaded, not in the server backup).
 */
const DB = "dear-selly-photos";
const STORE = "photos";
const MAX_W = 720;
export const MAX_PHOTOS = 60;

export interface WalkPhoto {
  id: string;
  mission: string;
  date: string;
  dataUrl: string;
  at: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function listPhotos(): Promise<WalkPhoto[]> {
  try {
    const all = await tx<WalkPhoto[]>("readonly", (s) => s.getAll() as IDBRequest<WalkPhoto[]>);
    return all.sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export async function getPhoto(id: string): Promise<WalkPhoto | null> {
  try {
    return (await tx<WalkPhoto | undefined>("readonly", (s) => s.get(id) as IDBRequest<WalkPhoto | undefined>)) ?? null;
  } catch {
    return null;
  }
}

export async function savePhoto(p: WalkPhoto) {
  await tx("readwrite", (s) => s.put(p));
  const all = await listPhotos();
  for (const old of all.slice(MAX_PHOTOS)) await tx("readwrite", (s) => s.delete(old.id));
}

export async function deletePhoto(id: string) {
  await tx("readwrite", (s) => s.delete(id));
}

/** Shrink any image source to a JPEG data URL (max 720 px wide). */
async function shrink(src: string): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const k = Math.min(1, MAX_W / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

/** Opens the camera; resolves with a small JPEG data URL, or null if cancelled/unavailable. */
export async function takePhoto(): Promise<string | null> {
  if (IS_TOSS) {
    try {
      const { Device } = await import("@apps-in-toss/web-framework");
      const r = await Device.openCamera({ base64: true, maxWidth: MAX_W });
      const uri = r.dataUri.startsWith("data:") ? r.dataUri : `data:image/jpeg;base64,${r.dataUri}`;
      return await shrink(uri);
    } catch {
      // no bridge / no permission: fall back to the file picker
    }
  }
  const file = await new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
  if (!file) return null;
  const url = URL.createObjectURL(file);
  try {
    return await shrink(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
