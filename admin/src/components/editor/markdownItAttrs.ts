import {config} from 'md-editor-v3'
import markdownItAttrs from 'markdown-it-attrs'

// 为 Markdown 图片语法提供 {width=100} 等尺寸属性支持
// 表情面板插入的 ![名称](地址){width=100} 依赖该插件渲染尺寸
config({
  markdownItPlugins: (plugins) => [
    ...plugins,
    {type: 'emoji-image-attrs', plugin: markdownItAttrs, options: {}}
  ]
})
