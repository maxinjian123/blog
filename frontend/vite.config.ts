import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {resolve} from 'path'
import {defineConfig} from 'vite'
import {visualizer} from 'rollup-plugin-visualizer'

import viteCompression from 'vite-plugin-compression'

export default defineConfig(({mode}) => ({
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
        // 打包分析 （使用 --analyze 参数时开启）
        mode === 'analyze' && visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
            filename: 'dist/stats.html'
        })
    ].filter(Boolean),
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        open: true,
        cors: true,
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '^/uploads': {
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
    // 预加载
    prefetch: {
        include: ['**/*.vue']
    },
    // CSS 优化
    css: {
        devSourcemap: mode === 'development',
        preprocessorOptions: {
            scss: {
                additionalData: `@import "@/styles/variables.scss";`
            }
        }
    },
    // 构建配置
    build: {
        target: 'es2020',
        outDir: 'dist',
        assetsDir: 'assets',
        assetsInlineLimit: 4096,
        cssCodeSplit: true,
        sourcemap: mode === 'development',
        minify: 'terser',
        chunkSizeWarningLimit: 600,

        terserOptions: {
            compress: {
                drop_console: mode === 'production',
                drop_debugger: mode === 'production',
                pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
            }
        },

        rollupOptions: {
            output: {
                // 智能分包策略
                manualChunks: (id) => {
                    // Vue 核心库
                    if (id.includes('node_modules/vue') ||
                        id.includes('node_modules/vue-router') ||
                        id.includes('node_modules/pinia')) {
                        return 'vendor-vue'
                    }

                    // UI 组件库（Ant Design）
                    if (id.includes('node_modules/@ant-design')) {
                        return 'vendor-ui'
                    }

                    // 图表库（ECharts + WordCloud）
                    if (id.includes('node_modules/echarts')) {
                        return 'vendor-echarts'
                    }

                    // 编辑器（md-editor-v3 + marked）
                    if (id.includes('node_modules/md-editor-v3') ||
                        id.includes('node_modules/marked')) {
                        return 'vendor-editor'
                    }

                    // 工具库
                    if (id.includes('node_modules/axios') ||
                        id.includes('node_modules/dayjs')) {
                        return 'vendor-utils'
                    }

                    // 其他依赖
                    if (id.includes('node_modules')) {
                        return 'vendor-other'
                    }
                },

                // 文件命名规则
                chunkFileNames: 'js/[name]-[hash:8].js',
                entryFileNames: 'js/[name]-[hash:8].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                        return 'css/[name]-[hash:8][extname]'
                    }
                    if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
                        return 'images/[name]-[hash:8][extname]'
                    }
                    if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
                        return 'fonts/[name]-[hash:8][extname]'
                    }
                    return 'assets/[name]-[hash:8][extname]'
                },

                // 优化 chunk 大小
                experimentalMinChunkSize: 20000
            }
        }
    },

    // 8. 持久化缓存：二次打包飞快
    cacheDir: '.vite_cache',
}))