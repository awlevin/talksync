import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import stringHash from "string-hash";

export const getContentHash = (content: string): string => {
  return stringHash(content).toString();
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
