import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  /* Relative base works for any deployment path (e.g. github.io/repo-name/ or custom domain) */
  base: './',
})
