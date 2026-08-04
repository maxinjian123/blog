import {config} from 'md-editor-v3'
import markdownItAttrs from 'markdown-it-attrs'

// 为 Markdown 图片语法提供 {width=100} 等尺寸属性支持
config({
  markdownItPlugins: (plugins) => [
    ...plugins,
    {type: 'emoji-image-attrs', plugin: markdownItAttrs, options: {}}
  ]
})
