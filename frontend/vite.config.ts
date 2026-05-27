import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {resolve} from 'path'
import {defineConfig} from 'vite'
import {visualizer} from 'rollup-plugin-visualizer'

import viteCompression from 'vite-plugin-compression'

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        // 1. Gzip 压缩（服务器开启后体积暴降 60%+）
        viteCompression({
            algorithm: 'gzip',
            verbose: true,
            disable: false,
            threshold: 10240, // 大于 10KB 才压缩
            ext: '.gz',
            deleteOriginFile: false,
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path
            },
        },
    },
    // ==============打包优化===============
    // 依赖预构建 提速
    optimizeDeps: {
        include: [
            'vue',
            'vue-router',
            'pinia',
            'axios',
            'echarts',
            'echarts-wordcloud',
            'marked',
            '@ant-design/icons-vue'
        ],
        exclude: ['@tailwindcss/vite']
    },
})