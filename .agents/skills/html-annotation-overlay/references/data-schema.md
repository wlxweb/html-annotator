# Data schema

Use a simple JSON document.

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

## Required fields

- `version`
- `annotations[]`
- `annotations[].id`
- `annotations[].order`
- `annotations[].selector`
- `annotations[].markdown`
- `annotations[].createdAt`
- `annotations[].updatedAt`

## Recommended fields

- `page.path`
- `page.title`
- `ui.launcher`
- `ui.showMarkers`
- `annotations[].tagName`
- `annotations[].textSnippet`
- `annotations[].resolved`

## Rules

- Keep `order` explicit instead of deriving it only from array index.
- Preserve unknown fields during updates if a project extends the schema.
- Bump `updatedAt` on edit, reorder, retarget, or delete-tombstone operations.
- Prefer hard delete only for simple tools; use soft-delete only when the project needs history.
