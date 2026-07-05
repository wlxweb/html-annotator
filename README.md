# HTML Annotation Overlay

[简体中文](./README.md) | [English](./README.en.md)


一个适用于纯 HTML 页面和轻量 Web 应用的标注层工具。

它为页面增加一个可拖拽的悬浮入口，并提供元素级标注、Markdown 说明、顺序编号标记点以及本地持久化能力，让团队可以直接在页面上完成评审、批注和走查，而不是把反馈分散在截图、聊天记录和文档里。

## 在线演示

- GitHub Pages 预览：[https://wlxweb.github.io/html-annotator/](https://wlxweb.github.io/html-annotator/)
- 本地 Demo：`test-html-annotation/`

> 公开演示版本使用 `localStorage` + JSON 导入/导出。
> 本地 Demo 使用一个小型 HTTP 服务，并将数据持久化到 `data/annotations.json`。

---

## 为什么要做这个项目？

很多团队在评审 HTML 原型、内部系统页面、静态导出页或落地页时，反馈流程并不顺畅。

常见情况是：

- 用截图画箭头提意见
- 在群聊里零散讨论
- 把问题记到文档或表格里
- 开会口头说明
- 最后再手动整理成 issue

这会带来几个典型问题：

### 反馈没有绑定到具体元素
像“这个按钮改一下”“这一块信息太挤了”这样的反馈，如果没有明确锚点，后续很容易产生歧义。

### 反馈分散、难以收敛
一部分在聊天记录里，一部分在截图里，一部分在文档里。最后整理成可执行任务会比较低效。

### 静态 HTML 场景缺少轻量方案
很多评审工具默认面向 SaaS 协作、设计稿或浏览器插件。但有时你只是想给一个 HTML 页面加一层标注能力。

### AI 辅助评审缺少可操作界面
如果希望 AI 帮忙审页面、生成说明、补充评审意见，就需要一个结构简单、可被代理操作的页面交互层。

---

## 它可以做什么？

### 标注能力

- 增加悬浮标注入口
- 支持拖拽调整位置
- 进入标注模式后选择页面元素
- 为元素添加 Markdown 说明
- 自动生成顺序编号标注点
- 点击标注点查看说明弹窗
- 支持编辑、删除、全屏编辑
- 编辑时支持实时 Markdown 预览

### 评审能力

- 在侧边面板中查看全部标注
- 一键显示 / 隐藏标注点
- 在页面不同标注之间快速定位

### 数据能力

- 本地持久化标注数据
- 导出 JSON
- 导入 JSON
- 支持文件存储或 `localStorage`

### 自定义能力

- 主题颜色预设
- 快捷键自定义
- 恢复默认设置

---

## 功能特性

- 可拖拽悬浮按钮
- 元素选择式标注
- Markdown 说明内容
- 顺序编号标记点
- 点击弹出说明
- 全屏编辑模式
- 编辑区实时预览
- 全部标注面板
- 删除确认
- 快捷键支持
- 主题设置
- JSON 导入 / 导出
- 本地 JSON 持久化

---

## 仓库结构

```text
.agents/skills/html-annotation-overlay/
docs/
test-html-annotation/
```

### 可复用的 Codex Skill

```text
.agents/skills/html-annotation-overlay/
```

这里包含可复用的 Codex Skill，用于在其他项目中生成或改造这套 HTML 标注能力。

### Demo 实现

```text
test-html-annotation/
```

核心文件：

- `index.html`：演示页面
- `annotation-overlay.js`：标注逻辑
- `annotation-overlay.css`：标注样式
- `server.mjs`：本地 HTTP 服务
- `data/annotations.json`：标注数据文件

---

## 快速开始

### 运行本地 Demo

```bash
cd test-html-annotation
npm install
node server.mjs
```

打开：

```text
http://127.0.0.1:3217/
```

### 为什么需要 HTTP 服务？

如果直接通过 `file://` 打开 HTML，浏览器不能安全、静默地写回本地 JSON 文件。

如果你需要真实的本地持久化，推荐使用：

- 前端负责交互
- 本地 HTTP API 负责读写 `annotations.json`

如果只是静态托管或公开演示，则可以使用：

- `localStorage`
- JSON 导入 / 导出

---

## 使用方式

### 创建标注

1. 点击悬浮按钮
2. 进入标注模式
3. 点击页面上的任意元素
4. 输入 Markdown 内容
5. 保存

### 查看标注

1. 点击编号标注点
2. 在弹窗中查看说明

### 编辑标注

1. 点击标注点
2. 选择 **编辑**
3. 修改 Markdown 内容
4. 保存

### 查看全部标注

1. 打开悬浮菜单
2. 打开全部标注面板
3. 按顺序查看所有说明

---

## 快捷键

默认快捷键：

- `j`：进入 / 退出标注模式
- `/`：显示 / 隐藏标注点
- `l`：打开 / 关闭全部标注列表

这些快捷键可以在设置面板中自定义。

---

## 持久化方案

### 1. 本地 JSON 文件

适合本地评审流程。

接口：

- `GET /api/annotations`
- `PUT /api/annotations`

存储文件：

- `data/annotations.json`

### 2. localStorage

适合 GitHub Pages 这类静态部署场景。

### 3. JSON 导入 / 导出

适合不运行本地服务、但又希望数据可迁移的场景。

---

## 适用场景

这个项目适合用于：

- HTML 原型评审
- 内部系统页面批注
- PM / 设计反馈收集
- 向开发解释 UI 修改意见
- 异步产品走查
- 在创建 issue 前先整理结构化反馈
- 构建 AI 辅助页面评审流程

---

## 如何通过自然语言让 AI 操作它？

这个项目有一个很实用的点：它不仅是一个前端标注工具，也很适合作为 AI 代理的操作界面。

你可以直接用自然语言让 Codex 或其他 coding agent 来搭建、修改或使用这套标注流程。

### 让 AI 帮你搭建这套能力

例如：

- “给这个 HTML 页面加一个标注层。”
- “做一个可拖拽的悬浮标注按钮。”
- “我想点击页面元素并添加 Markdown 标注。”
- “把标注数据持久化到本地 JSON 文件。”
- “如果是静态部署，就改成 localStorage。”

### 让 AI 帮你优化交互

例如：

- “把按钮默认放在右下角偏内一点。”
- “给悬浮按钮增加出现动画。”
- “编辑标注时增加实时 Markdown 预览。”
- “把导入导出放到设置页里。”
- “所有图标改用 Lucide 图标库。”

### 让 AI 帮你适配风格

例如：

- “把整体风格改得更像 Notion。”
- “主题改成橙色。”
- “支持自定义快捷键。”
- “做一个 GitHub Pages 的在线预览。”
- “把演示页换成一个适合公开展示的自制 demo。”

### 让 AI 直接生成评审内容

例如：

- “给 hero、CTA 和设置区域加几条演示标注。”
- “生成几条像 PM 评审意见的标注。”
- “从 UI、文案、交互三个角度给这个页面加批注。”

这意味着它不仅是一个组件，也可以作为 AI 驱动的页面评审工作流基础设施。

---

## 数据格式

示例：

```json
{
  "version": 1,
  "page": {
    "path": "/example/page",
    "title": "Example Page"
  },
  "ui": {
    "launcher": { "x": 24, "y": 24 },
    "showMarkers": true
  },
  "annotations": [
    {
      "id": "ann_001",
      "order": 1,
      "selector": "#hero .cta-button",
      "tagName": "button",
      "textSnippet": "Start free trial",
      "markdown": "**Primary CTA**: clarify this label.",
      "createdAt": "2026-07-05T00:00:00.000Z",
      "updatedAt": "2026-07-05T00:00:00.000Z",
      "resolved": true
    }
  ]
}
```

---

## License

MIT