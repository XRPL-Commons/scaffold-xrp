import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function stringToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
