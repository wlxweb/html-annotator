# Interaction spec

## Core user flow

1. User sees a floating launcher.
2. User drags it anywhere on the page.
3. User clicks it to open a menu.
4. User chooses one of:
   - Show all annotations
   - Hide all annotations
   - Enter annotation mode
5. In annotation mode, user hovers elements and sees the current target highlight.
6. User clicks an element.
7. A note editor opens.
8. User writes Markdown and confirms.
9. The system saves the annotation and renders a numbered marker.
10. User clicks a marker to read the note in a nearby popover.

## Required states

- `idle`
- `menu-open`
- `annotation-mode`
- `editing-note`
- `popover-open`

## Launcher behavior

- Launcher must be draggable.
- A drag must not trigger menu open.
- Use a movement threshold such as 4–8 px.
- Store launcher position separately from annotations if persistence is desired.

## Annotation mode behavior

- Add a visible highlight ring to the hovered element.
- Ignore overlay-owned elements to avoid self-selection.
- Prevent navigation or form submission while selecting.
- Exit annotation mode after saving unless the user explicitly wants continuous capture.

## Marker behavior

- Marker color: red.
- Marker content: 1-based sequence number.
- Marker click opens note popover.
- Only one popover needs to be open at a time.
- Marker positions should be recomputed on resize, scroll, and content mutation if practical.

## Popover behavior

- Position near the marker.
- Clamp into viewport when close to an edge.
- Close on outside click or escape.
- Render sanitized Markdown.

## Editing behavior

Support at least:

- Create
- Edit
- Delete

Optional but useful:

- Reorder annotations
- Copy Markdown
- Jump to target element

## Failure handling

If a selector no longer resolves:

- Keep the annotation data.
- Surface it in a list as unresolved.
- Allow retargeting to a new element.
