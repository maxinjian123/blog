import { createApp, h, ref, type Ref } from 'vue'
import MessageComponent, { type MessageOptions } from '@/components/common/Message.vue'

let instance: any = null
let container: HTMLDivElement | null = null

function getInstance() {
  if (!instance) {
    container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp(MessageComponent, {
      maxCount: 5,
      top: 24,
    })
    instance = app.mount(container)
  }
  return instance
}

function show(options: MessageOptions | string): number {
  const inst = getInstance()
  if (typeof options === 'string') {
    return inst.add({ content: options })
  }
  return inst.add(options)
}

function info(content: string | MessageOptions): number {
  const opts = typeof content === 'string' ? { content } : content
  return show({ ...opts, type: 'info' })
}

function success(content: string | MessageOptions): number {
  const opts = typeof content === 'string' ? { content } : content
  return show({ ...opts, type: 'success' })
}

function warning(content: string | MessageOptions): number {
  const opts = typeof content === 'string' ? { content } : content
  return show({ ...opts, type: 'warning' })
}

function error(content: string | MessageOptions): number {
  const opts = typeof content === 'string' ? { content } : content
  return show({ ...opts, type: 'error' })
}

function remove(id: number) {
  const inst = getInstance()
  inst.remove(id)
}

export const useMessage = () => {
  return { show, info, success, warning, error, remove }
}

export default {
  show,
  info,
  success,
  warning,
  error,
  remove,
}