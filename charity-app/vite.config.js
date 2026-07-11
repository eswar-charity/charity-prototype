import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // host: true binds to the LAN so a phone on the same WiFi can open the dev
  // server directly — needed to scan a QR code and land on this app for a demo.
  server: {
    host: true,
  },
})
