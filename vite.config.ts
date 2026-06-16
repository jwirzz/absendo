import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import type {} from 'vite-react-ssg'

const PRERENDER_ROUTES = new Set([
  '/',
  '/bbzw-absenzformular',
  '/bbzw-absenzen-entschuldigen',
  '/contact',
  '/datenschutz',
  '/support',
  '/demo',
])


const normalize = (path: string) => (path === '/' ? '/' : `/${path.replace(/^\//, '')}`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  ssgOptions: {
    script: 'async',
    formatting: 'none',
    includedRoutes(paths: string[]) {
      return paths.filter((path) => PRERENDER_ROUTES.has(normalize(path)))
    },
  },
})
