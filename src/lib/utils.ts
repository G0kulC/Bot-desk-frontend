import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes (used by our components and the vendored Magic UI ones). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
