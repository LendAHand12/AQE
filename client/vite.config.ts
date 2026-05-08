import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // server: {
  //   host: true, // Cho phép truy cập từ địa chỉ IP trong mạng nội bộ
  //   allowedHosts: ['4438-2001-ee0-52b7-67c0-c882-862-aeb6-fe0.ngrok-free.app'], // Cho phép tất cả các host (ngrok, local IP, v.v.)
  // }
})
