import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function stringToHex(str) {
  return Array.from(new TextEncoder().encode(str), (byte) =>
    byte.toString(16).padStart(2, "0")
  )
    .join("")
    .toUpperCase();
}
