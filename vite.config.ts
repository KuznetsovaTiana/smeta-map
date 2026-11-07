import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Object Storage serves the default build at the domain root.
  base: mode === 'github-pages' ? '/smeta-map/' : '/',
  plugins: [react()],
}))
