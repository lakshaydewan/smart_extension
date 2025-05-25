import { clsx } from "clsx" 
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names conditionally and merges Tailwind utility classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
