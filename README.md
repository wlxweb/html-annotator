# HTML Annotation Overlay

一个用于 **HTML 页面标注 / 评审 / 批注** 的轻量工具原型，包含两部分：

1. **Codex Skill**：`html-annotation-overlay`
2. **可运行 Demo**：`test-html-annotation/`

支持：
- 悬浮入口按钮
- 拖拽按钮位置
- 标注模式选择页面元素
- Markdown 标注内容
- 编号标注点
- 点击标注查看说明
- 全屏编辑 / 预览
- 显示全部标注
- 删除确认
- 快捷键
- 主题颜色设置
- JSON 导入 / 导出
- 本地 JSON 持久化

---

## 在线预览

- GitHub Pages 预览：[https://wlxweb.github.io/html-annotator/](https://wlxweb.github.io/html-annotator/)
- 说明：Pages 预览版使用自制公开 demo 页面，基于 `localStorage` 与导入 / 导出 JSON，不依赖本地 Node 服务。



## Demo 页面说明

- 仓库中的 demo 页面为**自制公开演示页**，不包含真实业务系统内容。
- GitHub Pages 与本地 `test-html-annotation/` 使用同一套演示结构。
- 在线预览适合测试标注、设置、导入导出、快捷键与弹窗交互。

## 目录结构

```text
.agents/skills/html-annotation-overlay/
test-html-annotation/
```

### Skill

`./.agents/skills/html-annotation-overlay`

包含：
- `SKILL.md`
- `references/`
- `assets/browser/`
- `assets/node/`

用于让 Codex 在其他项目里复用这套“HTML 页面标注”能力。

### Demo

`./test-html-annotation`

包含：
- `index.html`：测试页面
- `annotation-overlay.js`：标注逻辑
- `annotation-overlay.css`：样式
- `server.mjs`：本地 HTTP 服务 + JSON 持久化
- `data/annotations.json`：标注数据

---

## 功能特性

### 标注能力
- 进入标注模式后选择页面元素
- 为元素添加 Markdown 说明
- 自动生成顺序编号标注点
- 点击标注点打开说明弹窗
- 支持编辑、删除、全屏模式

### 数据能力
- 本地文件持久化到 `data/annotations.json`
- 导出 JSON
- 导入 JSON

### 设置能力
- 主题颜色切换
- 快捷键自定义
- 恢复默认设置

### 快捷键
默认：
- `j`：开始/退出标注模式
- `/`：显示/隐藏标注点
- `l`：显示/隐藏全部标注

---

## 本地运行

进入 demo 目录：

```bash
cd test-html-annotation
```

安装依赖：

```bash
npm install
```

启动服务：

```bash
node server.mjs
```

打开：

```text
http://127.0.0.1:3217/
```

---

## 为什么需要 HTTP 服务

这个项目默认使用本地 JSON 文件持久化。普通浏览器直接双击 `html` 以 `file://` 打开时，不能安全地静默写回本地文件。

因此这里采用：
- 前端负责交互
- 本地 HTTP 服务负责写入 `annotations.json`

如果你只需要纯静态模式，可以改成：
- `localStorage`
- 导入 / 导出 JSON

---

## 开源建议

如果准备发布到 GitHub，建议补充：
- 仓库截图 / GIF
- 使用说明
- License
- Roadmap
- Issues / PR 模板

---

## 后续可扩展方向

- 更稳定的元素 selector 策略
- 标注排序
- 标注拖拽重新定位
- 多页面标注集合
- 评论线程
- 截图证据附件
- Electron / Tauri 桌面版

