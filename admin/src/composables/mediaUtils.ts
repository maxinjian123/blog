import dayjs from 'dayjs'

// 是否为 Electron 桌面端环境
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI

/**
 * 媒体库共享工具函数（纯函数，无副作用）
 */

// 是否为图片
export function isImage(mime: string): boolean {
  return mime?.startsWith('image/') || false
}

// 是否为视频
export function isVideo(mime: string): boolean {
  return mime?.startsWith('video/') || false
}

// 是否为音频
export function isAudio(mime: string): boolean {
  return mime?.startsWith('audio/') || false
}

// 是否为 PDF
export function isPdf(mime: string): boolean {
  return mime === 'application/pdf'
}

// 是否可预览（图片/视频/PDF/音频）
export function isPreviewable(mime: string): boolean {
  return isImage(mime) || isVideo(mime) || isPdf(mime) || isAudio(mime)
}

// 文件大小格式化
export function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// 文件图标颜色
export function fileIconColor(mime: string): string {
  if (mime?.startsWith('image/')) return '#52c41a'
  if (mime?.startsWith('video/')) return '#722ed1'
  if (mime?.startsWith('audio/')) return '#fa8c16'
  if (mime?.startsWith('application/pdf')) return '#ff4d4f'
  if (mime?.startsWith('text/')) return '#1677ff'
  return '#8c8c8c'
}

// 提取文件扩展名（大写）
export function fileExt(name: string): string {
  return name?.split('.').pop()?.toUpperCase() || 'FILE'
}

// 从 mime_type 提取主类型
export function getMimeMain(mime: string): string {
  if (!mime) return ''
  return mime.split('/')[0] || ''
}

// 主类型到中文标签
const MIME_MAIN_LABELS: Record<string, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  application: '文档',
  text: '文本'
}

export function mimeMainLabel(mime: string): string {
  return MIME_MAIN_LABELS[getMimeMain(mime)] || getMimeMain(mime) || '文件'
}

// 主类型到标签颜色
const MIME_MAIN_COLORS: Record<string, string> = {
  image: 'green',
  video: 'purple',
  audio: 'orange',
  application: 'red',
  text: 'blue'
}

export function mimeMainColor(mime: string): string {
  return MIME_MAIN_COLORS[getMimeMain(mime)] || 'default'
}

// 时间格式化
export function formatDateTime(time: string, withSeconds = false): string {
  if (!time) return '-'
  return dayjs(time).format(withSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm')
}

// 格式化本地 URL（本地存储的相对 URL 拼上 origin）
export function resolveUrl(url: string, storage: 'local' | 'minio'): string {
  if (storage === 'local' && url.startsWith('/uploads/')) {
    // Electron 桌面端：file:// 协议下 window.location.origin 无意义，
    // 直接用用户配置的后端地址拼接
    if (isElectron) {
      const base = localStorage.getItem('admin_api_base_url') || ''
      return base ? `${base}${url}` : url
    }
    return `${window.location.origin}${url}`
  }
  return url
}
