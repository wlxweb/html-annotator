# HTML Annotation Overlay

[简体中文](./README.md) | [English](./README.en.md)

A lightweight annotation overlay for plain HTML pages and lightweight web apps.

It adds a draggable floating launcher, element-level annotations, Markdown notes, numbered markers, and local persistence so teams can review interfaces directly in the page instead of scattering feedback across screenshots, chats, and documents.

## Live Demo

- GitHub Pages: [https://wlxweb.github.io/html-annotator/](https://wlxweb.github.io/html-annotator/)
- Local demo app: `test-html-annotation/`

> The public demo uses `localStorage` and JSON import/export.
> The local demo uses a small HTTP server with file-backed persistence in `data/annotations.json`.

---

## Why this project exists

Reviewing HTML pages is often more painful than it should be.

Teams usually end up leaving feedback in disconnected places:

- screenshots with arrows
- chat threads
- docs or spreadsheets
- meeting notes
- issue trackers with no direct UI context

That creates a few common problems:

### Feedback is detached from the actual element
Comments like “change this button” or “this section feels too dense” are ambiguous without a precise on-page anchor.

### Feedback gets fragmented
Part of the review lives in chat, part in screenshots, and part in docs. Merging everything into actionable changes becomes slow and error-prone.

### Static HTML is underserved
Many review tools assume a full SaaS workflow, a design file, or a browser extension. Sometimes you only need a simple annotation layer on top of an HTML page.

### AI-assisted review needs an interaction surface
If you want AI to help review a page, generate comments, or modify the workflow, you need a simple, inspectable UI layer it can operate on.

---

## What it does

### Annotation workflow

- adds a floating launcher button
- supports drag-to-move positioning
- enters annotation mode
- lets you click any element to attach a note
- supports Markdown for note content
- renders ordered numbered markers
- opens a popover when a marker is clicked
- supports edit, delete, and fullscreen editing
- shows live Markdown preview while editing

### Review workflow

- shows all annotations in a single panel
- supports hide/show for markers
- supports quick navigation across annotated areas

### Persistence and portability

- persists annotations locally
- exports annotations as JSON
- imports annotations from JSON
- supports file-backed storage or `localStorage`

### Customization

- theme presets
- configurable shortcuts
- reset-to-default settings

---

## Features

- Draggable floating launcher
- Element selection mode
- Markdown-based notes
- Numbered annotation markers
- Popover-based note display
- Fullscreen edit mode
- Live preview while editing
- Annotation list panel
- Delete confirmation
- Keyboard shortcuts
- Theme settings
- JSON import/export
- File-backed local persistence

---

## Repository structure

```text
.agents/skills/html-annotation-overlay/
docs/
test-html-annotation/
```

### Reusable Codex skill

```text
.agents/skills/html-annotation-overlay/
```

This contains the reusable Codex skill for building or adapting this annotation workflow in other projects.

### Demo implementation

```text
test-html-annotation/
```

Key files:

- `index.html` — demo page
- `annotation-overlay.js` — overlay behavior
- `annotation-overlay.css` — overlay styles
- `server.mjs` — local HTTP server
- `data/annotations.json` — persisted annotation data

---

## Getting started

### Run the local demo

```bash
cd test-html-annotation
npm install
node server.mjs
```

Open:

```text
http://127.0.0.1:3217/
```

### Why an HTTP server is needed

If you open a page with `file://`, the browser cannot safely and silently write back to a local JSON file.

For true local persistence, this project uses:

- frontend UI for annotation interactions
- a local HTTP API for reading and writing `annotations.json`

For static hosting, use:

- `localStorage`
- JSON import/export

---

## Usage

### Create an annotation

1. Open the floating launcher
2. Enter annotation mode
3. Click an element on the page
4. Write a Markdown note
5. Save it

### Read an annotation

1. Click a numbered marker
2. Read the note in the popover

### Edit an annotation

1. Click a marker
2. Choose **Edit**
3. Update the Markdown content
4. Save

### Review all annotations

1. Open the launcher menu
2. Open the annotation list panel
3. Review notes in sequence

---

## Keyboard shortcuts

Default shortcuts:

- `j` — enter / exit annotation mode
- `/` — show / hide markers
- `l` — open / close the annotation list

Shortcuts can be customized from the settings panel.

---

## Persistence modes

### 1. File-backed JSON storage

Recommended for local review workflows.

Endpoints:

- `GET /api/annotations`
- `PUT /api/annotations`

Storage file:

- `data/annotations.json`

### 2. localStorage

Recommended for static deployments such as GitHub Pages.

### 3. JSON import/export

Useful when you want a portable workflow without running a local server.

---

## Use cases

This project is useful for:

- reviewing HTML prototypes
- annotating internal tools
- collecting PM or design feedback
- explaining UI revisions to developers
- running async product walkthroughs
- preparing structured feedback before creating issues
- building AI-assisted review flows

---

## Using AI with natural language

One of the strengths of this project is that it works well as a natural-language-driven workflow for coding agents.

You can ask AI tools such as Codex to build, modify, or operate this annotation layer with simple requests.

### Build the workflow

Examples:

- “Add an annotation overlay to this HTML page.”
- “Create a draggable floating annotation button.”
- “Let me click elements and attach Markdown notes.”
- “Persist annotations to a local JSON file.”
- “Use localStorage when the page is hosted statically.”

### Improve the interaction

Examples:

- “Move the launcher closer to the lower-right corner by default.”
- “Add an entrance animation to the launcher.”
- “Show live Markdown preview while editing.”
- “Put import/export into the settings panel.”
- “Use Lucide icons for all actions.”

### Adapt it to your style

Examples:

- “Make the UI feel more like Notion.”
- “Switch the theme to orange.”
- “Add custom keyboard shortcuts.”
- “Turn this into a GitHub Pages demo.”
- “Replace the demo page with a public-safe sample page.”

### Ask AI to create review content

Examples:

- “Add demo annotations to the hero, CTA, and settings sections.”
- “Create annotations that simulate PM feedback.”
- “Annotate this page with UI, copy, and interaction suggestions.”

In practice, this makes the project useful not only as a UI utility, but also as a strong base for AI-assisted product review workflows.

---

## Data format

Example annotation document:

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
