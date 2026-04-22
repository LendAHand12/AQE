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
