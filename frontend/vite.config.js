import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const target = process.env.STAGELIK_API_URL ?? 'http://127.0.0.1:8000'
const proxy = { '/api': target, '/sanctum': target, '/email/verify': target }
const deny = ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/backend/**', '**/.stagelik/**']

export default defineConfig({
  plugins: [tailwindcss()],
  server: { proxy, fs: { deny } },
  preview: { proxy },
})
