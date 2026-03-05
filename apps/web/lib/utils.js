import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function stringToHex(str) {
  return Buffer.from(str, "utf8").toString("hex").toUpperCase();
}
