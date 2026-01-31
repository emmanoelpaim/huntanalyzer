import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const getBasePath = () => {
  if (process.env.GITHUB_PAGES) {
    const repoName = process.env.GITHUB_REPOSITORY_NAME || 'loot_analyzer'
    const isUserPage = repoName.includes('.github.io')
    return isUserPage ? '/' : `/${repoName}/`
  }
  return './'
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  base: getBasePath(),
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
