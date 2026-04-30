import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";

export const getContentHash = (content: string): string =>
  createHash("sha256").update(content).digest("hex").slice(0, 16);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
