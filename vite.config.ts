import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** GitHub Pages 项目站点地址：https://keeflow.github.io/liwang-book/ */
const PAGES_BASE = '/liwang-book/'

/**
 * 生成 404.html（内容与 index.html 一致）。
 * GitHub Pages 是纯静态托管、没有服务端路由回退，history 模式下
 * 直接访问 / 刷新子路由会被 Pages 交给 404.html，由它把 SPA 拉起来。
 */
function spa404Fallback() {
  return {
    name: 'spa-404-fallback',
    apply: 'build' as const,
    closeBundle() {
      const distDir = fileURLToPath(new URL('./dist', import.meta.url))
      const index = resolve(distDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(distDir, '404.html'))
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [vue(), spa404Fallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 生产构建走子路径部署；本地 dev 用根路径，两者路由 base 都由 import.meta.env.BASE_URL 决定
  base: mode === 'production' ? PAGES_BASE : '/',
  server: {
    port: 5173,
    host: true,
  },
}))
