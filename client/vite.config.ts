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
      "src": path.resolve(__dirname, "./src"),
      "@sounds": path.resolve(__dirname, "./src/pages/plinko/components/Game/sounds"),
      "store": path.resolve(__dirname, "./src/store"),
      "utils": path.resolve(__dirname, "./src/utils"),
      "styles": path.resolve(__dirname, "./src/styles")
    },
  },
  server: {
    host: true, // Cho phép truy cập từ địa chỉ IP trong mạng nội bộ
    allowedHosts: ['4438-2001-ee0-52b7-67c0-c882-862-aeb6-fe0.ngrok-free.app', '8488-2001-ee0-52b7-67c0-d2b9-380f-ffa0-b0cd.ngrok-free.app'], // Cho phép tất cả các host (ngrok, local IP, v.v.)
  }
})
