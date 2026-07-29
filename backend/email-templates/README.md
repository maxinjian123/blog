# 邮件模板目录

所有邮件模板按用途分目录存放，目录结构：

```
email-templates/
├── _layouts/                      # 共用布局（不要直接编辑每个邮件都引用的部分）
│   ├── comment-layout.html        # 评论通知布局（蓝色科技风）
│   └── subscribe-layout.html      # 订阅系列布局（暖橙绿渐变）
├── comment-reply/                 # 评论回复通知
│   ├── subject.txt                # 邮件主题
│   └── body.html                  # 邮件正文
├── subscribe-confirm/             # 订阅确认
│   ├── subject.txt
│   └── body.html
├── subscribe-success/             # 订阅成功欢迎
│   ├── subject.txt
│   └── body.html
└── new-article/                   # 新文章发布通知
    ├── subject.txt
    └── body.html
```

## 变量语法

模板使用 `{{varName}}` 占位符，调用方在 `mail.js` 中传入变量替换。

支持简单的条件块：
```
{{#if variableName}}...content...{{/if}}
```

## 布局选择

- `comment-layout.html` —— 评论回复通知专用（蓝色系）
- `subscribe-layout.html` —— 订阅系列专用（暖橙绿系，**与评论回复视觉明显区分**）

## 添加新模板

1. 在 `email-templates/` 下创建新目录，例如 `password-reset/`
2. 新建 `subject.txt` 与 `body.html`
3. 在 `services/emailTemplates.js` 的 `TEMPLATES` 中注册一条
4. 在 `services/mail.js` 中调用 `renderEmail(...)`

## 修改现有模板

直接编辑对应的 `subject.txt` / `body.html` 即可，无需重启服务以外的代码改动。
