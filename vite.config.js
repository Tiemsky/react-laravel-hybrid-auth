import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8085, // ✅ Force le port 8080
    host: true, // ✅ Accessible depuis le réseau local
  },
});
