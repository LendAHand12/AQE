import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined) {
  if (!path) return ""
  if (path.startsWith("http")) return path
  
  // Use the API URL and strip the /api part to get the base domain
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  const baseUrl = apiUrl.replace(/\/api$/, "")
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`
}

export function formatTruncated(num: number | null | undefined, decimals: number = 5): string {
  if (num === undefined || num === null || isNaN(num)) return "0." + "0".repeat(decimals);
  const factor = Math.pow(10, decimals);
  // Add small epsilon to handle float precision issues
  const truncated = Math.floor((num + 1e-12) * factor) / factor;
  const parts = truncated.toString().split(".");
  const integerPart = Number(parts[0]).toLocaleString("en-US");
  const decimalPart = parts[1] || "";
  if (decimals > 0) {
    return integerPart + "." + decimalPart.padEnd(decimals, "0");
  }
  return integerPart;
}
