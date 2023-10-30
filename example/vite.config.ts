import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'babylonjs-trenchbroom-loader': path.resolve(__dirname, '../dist')
    },
  },
  server: {
    host: 'localhost',
    port: 8080
  }
})