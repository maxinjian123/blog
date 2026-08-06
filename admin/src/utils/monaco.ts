// Monaco Editor 环境配置与懒加载
// - 通过 ?worker 导入各语言 worker，避免打包时全局加载 Monaco
// - initMonaco() 仅在首次使用编辑器时执行，动态加载 monaco-editor
// 注意：monaco-editor 0.56 起 exports 映射变更，worker 导入路径不带 esm/vs/ 前缀
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker'

let inited = false

// 自定义页面内置全局对象的类型声明：为 JS/TS 提供 BlogAPI / BLOG_CONFIG 代码提示
const BLOG_LIB_DTS = `
declare var BlogAPI: {
  /** 发起 GET 请求，自动解包 { code, message, data }，返回 data */
  get(path: string, params?: Record<string, string | number | boolean>): Promise<any>;
  /** 发起 POST 请求（JSON body） */
  post(path: string, body?: Record<string, any>): Promise<any>;
  /** 发起 PUT 请求（JSON body） */
  put(path: string, body?: Record<string, any>): Promise<any>;
  /** 发起 DELETE 请求 */
  del(path: string, body?: Record<string, any>): Promise<any>;
};
declare var BLOG_CONFIG: {
  /** API 基地址（相对路径，如 /api/v1） */
  apiBase: string;
  /** API 基地址（绝对地址） */
  apiBaseAbsolute: string;
  /** 站点名称 */
  siteName: string;
  /** 站点地址 */
  siteUrl: string;
  /** 页面标识 */
  slug: string;
  /** 页面名称 */
  pageName: string;
};
`

export async function initMonaco(): Promise<any> {
  const win = self as any
  // 配置 worker 环境（必须在使用编辑器前设置）
  if (!win.MonacoEnvironment) {
    win.MonacoEnvironment = {
      getWorker(_workerId: string, label: string) {
        if (label === 'json') return new jsonWorker()
        if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
        if (label === 'typescript' || label === 'javascript') return new tsWorker()
        return new editorWorker()
      }
    }
  }

  if (!inited) {
    const monaco = await import('monaco-editor')
    // 注入 BlogAPI / BLOG_CONFIG 类型，提供智能提示
    // 新版 monaco 使用顶层 typescript 命名空间，旧版位于 languages.typescript（0.56 起类型标记废弃，运行时均可用）
    const tsNs: any = (monaco as any).typescript || (monaco.languages as any)?.typescript
    tsNs?.javascriptDefaults?.addExtraLib?.(BLOG_LIB_DTS, 'ts:blog-client.d.ts')
    tsNs?.typescriptDefaults?.addExtraLib?.(BLOG_LIB_DTS, 'ts:blog-client.d.ts')
    inited = true
    return monaco
  }
  return import('monaco-editor')
}
