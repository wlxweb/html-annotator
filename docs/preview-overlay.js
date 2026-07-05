const API = {
  async load() {
    try {
      const raw = localStorage.getItem('hao-pages-annotations');
      return raw ? JSON.parse(raw) : structuredClone(DEFAULT_DATA);
    } catch {
      return structuredClone(DEFAULT_DATA);
    }
  },
  async save(payload) {
    localStorage.setItem('hao-pages-annotations', JSON.stringify(payload));
    return payload;
  }
};

const DEFAULT_DATA = {
  version: 1,
  page: { path: location.pathname, title: document.title },
  ui: { launcher: getDefaultLauncherPosition(), showMarkers: true },
  annotations: []
};

const state = {
  data: structuredClone(DEFAULT_DATA),
  menuOpen: false,
  panelOpen: false,
  annotationMode: false,
  hoveredEl: null,
  drag: null,
  menuEl: null,
  panelEl: null,
  editorEl: null,
  previewEl: null,
  settingsEl: null,
  toastEl: null,
  confirmEl: null,
  backdropEl: null,
  popoverEl: null,
  popoverMarkerEl: null
};

let root, launcher, markerLayer;

init().catch(console.error);

async function init() {
  state.data = mergeData(DEFAULT_DATA, await API.load());
  applyTheme();
  mountRoot();
  bindLauncher();
  bindSelectionMode();
  bindDismiss();
  bindHotkeys();
  bindViewportEvents();
  renderAll();
}

function mergeData(base, next) {
  return {
    ...base,
    ...next,
    page: { ...base.page, ...(next?.page || {}) },
    ui: { ...base.ui, ...(next?.ui || {}) },
    annotations: Array.isArray(next?.annotations) ? next.annotations : []
  };
}

function mountRoot() {
  root = document.createElement('div');
  root.className = 'hao-root';
  root.innerHTML = `<div class="hao-marker-layer"></div>`;
  document.body.appendChild(root);
  markerLayer = root.querySelector('.hao-marker-layer');
  launcher = document.createElement('button');
  launcher.className = 'hao-launcher';
  launcher.innerHTML = '<span class="hao-launcher-inner"><span class="hao-launcher-icon"><i data-lucide="pen-tool"></i></span><span class="hao-launcher-text">标注</span></span><span class="hao-launcher-count">0</span>';
  root.appendChild(launcher);
}

function bindLauncher() {
  launcher.addEventListener('pointerdown', (e) => {
    state.drag = {
      x: e.clientX,
      y: e.clientY,
      left: state.data.ui.launcher.x,
      top: state.data.ui.launcher.y,
      moved: false,
      pointerId: e.pointerId
    };
    launcher.setPointerCapture(e.pointerId);
  });

  launcher.addEventListener('pointermove', (e) => {
    if (!state.drag) return;
    const dx = e.clientX - state.drag.x;
    const dy = e.clientY - state.drag.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.drag.moved = true;
    state.data.ui.launcher.x = clamp(state.drag.left + dx, 8, window.innerWidth - 56);
    state.data.ui.launcher.y = clamp(state.drag.top + dy, 8, window.innerHeight - 56);
    syncLauncherPosition();
  });

  launcher.addEventListener('pointerup', async () => {
    if (!state.drag) return;
    const moved = state.drag.moved;
    state.drag = null;
    if (moved) {
      await persist();
    } else {
      state.menuOpen = !state.menuOpen;
      renderAll();
    }
  });
}

function bindSelectionMode() {
  document.addEventListener('mousemove', (e) => {
    if (!state.annotationMode) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || root.contains(el)) return;
    if (state.hoveredEl === el) return;
    clearHover();
    state.hoveredEl = el;
    el.classList.add('hao-highlight');
  }, true);

  document.addEventListener('click', (e) => {
    if (!state.annotationMode) return;
    if (root.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.target;
    clearHover();
    state.annotationMode = false;
    openEditor({ mode: 'create', target });
  }, true);
}

function bindDismiss() {
  document.addEventListener('click', (e) => {
    if (state.annotationMode) return;
    if (!root.contains(e.target)) {
      state.menuOpen = false;
      closePopover();
      renderMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      state.annotationMode = false;
      clearHover();
      closeEditor();
      closeFullscreen();
      closeSettings();
      closeConfirm();
      closePopover();
      state.menuOpen = false;
      renderAll();
    }
  });
}

function bindHotkeys() {
  document.addEventListener('keydown', async (e) => {
    if (shouldIgnoreHotkeys(e)) return;

    const hk = state.data.ui?.hotkeys || { annotate: 'j', toggleMarkers: '/', list: 'l' };

    if (e.key.toLowerCase() === String(hk.annotate || 'j').toLowerCase()) {
      e.preventDefault();
      state.annotationMode = !state.annotationMode;
      if (!state.annotationMode) clearHover();
      state.menuOpen = false;
      closePopover();
      closeConfirm();
      renderAll();
      return;
    }

    if (e.key === String(hk.toggleMarkers || '/')) {
      e.preventDefault();
      state.data.ui.showMarkers = !state.data.ui.showMarkers;
      await persist();
      return;
    }

    if (e.key.toLowerCase() === String(hk.list || 'l').toLowerCase()) {
      e.preventDefault();
      state.panelOpen = !state.panelOpen;
      state.menuOpen = false;
      closePopover();
      renderAll();
    }
  });
}

function shouldIgnoreHotkeys(e) {
  const target = e.target;
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

function bindViewportEvents() {
  window.addEventListener('scroll', renderMarkers, true);
  window.addEventListener('resize', () => {
    syncLauncherPosition();
    renderMenu();
    renderMarkers();
  });
}

function renderAll() {
  syncLauncherPosition();
  renderMenu();
  renderPanel();
  renderMarkers();
  refreshLucide();
}

function syncLauncherPosition() {
  const fallback = getDefaultLauncherPosition();
  const maxX = Math.max(8, window.innerWidth - 58 - 8);
  const maxY = Math.max(8, window.innerHeight - 58 - 8);
  const rawX = Number.isFinite(state.data?.ui?.launcher?.x) ? state.data.ui.launcher.x : fallback.x;
  const rawY = Number.isFinite(state.data?.ui?.launcher?.y) ? state.data.ui.launcher.y : fallback.y;
  const x = clamp(rawX, 8, maxX);
  const y = clamp(rawY, 8, maxY);
  state.data.ui.launcher = { x, y };
  launcher.style.left = x + 'px';
  launcher.style.top = y + 'px';
  const badge = launcher.querySelector('.hao-launcher-count');
  if (badge) badge.textContent = String((state.data.annotations || []).length);
}

function renderMenu() {
  state.menuEl?.remove();
  state.menuEl = null;
  if (!state.menuOpen) return;
  const menu = document.createElement('div');
  menu.className = 'hao-menu hao-anim-in';
  const menuLeft = clamp(state.data.ui.launcher.x, 8, Math.max(8, window.innerWidth - 236));
  const preferredTop = state.data.ui.launcher.y + 64;
  const menuHeight = 264;
  const menuTop = preferredTop + menuHeight > window.innerHeight - 8
    ? Math.max(8, state.data.ui.launcher.y - menuHeight - 12)
    : preferredTop;
  menu.style.left = menuLeft + 'px';
  menu.style.top = menuTop + 'px';
  const actions = [
    { label: '查看所有标注 (L)', icon: 'folder-open', action: () => { state.panelOpen = true; state.menuOpen = false; renderAll(); } },
    { label: '显示所有标注点 (/)', icon: 'eye', action: async () => { state.data.ui.showMarkers = true; await persist(); } },
    { label: '隐藏所有标注点 (/)', icon: 'eye-off', action: async () => { state.data.ui.showMarkers = false; await persist(); } },
    { label: '进入标注模式 (J)', icon: 'pencil', action: () => { state.annotationMode = true; state.menuOpen = false; renderAll(); } },
    { label: '设置', icon: 'settings-2', action: () => { state.menuOpen = false; openSettings(); } }
  ];
  for (const item of actions) {
    const btn = document.createElement('button');
    btn.innerHTML = `<span class="hao-menu-icon"><i data-lucide="${item.icon}"></i></span><span>${escapeHtml(item.label)}</span>`;
    btn.addEventListener('click', item.action);
    menu.appendChild(btn);
  }
  root.appendChild(menu);
  state.menuEl = menu;
}

function renderPanel() {
  state.panelEl?.remove();
  state.panelEl = null;
  if (!state.panelOpen) return;
  const panel = document.createElement('div');
  panel.className = 'hao-panel hao-anim-in hao-anim-slide-right';
  const listHtml = getOrderedAnnotations().map((ann, i) => `
    <div class="hao-panel-item" data-ann-id="${escapeHtml(ann.id)}">
      <div class="hao-panel-item-head">
        <div><span class="hao-badge">${i + 1}</span></div>
        <div class="hao-mini-actions">
          <button class="hao-icon-btn" data-act="jump" title="定位" aria-label="定位"><i data-lucide="locate-fixed"></i></button>
          <button class="hao-icon-btn" data-act="preview" title="全屏模式" aria-label="全屏模式"><i data-lucide="maximize-2"></i></button>
          <button class="hao-icon-btn" data-act="edit" title="编辑" aria-label="编辑"><i data-lucide="pencil"></i></button>
          <button class="hao-icon-btn hao-icon-btn-danger" data-act="delete" title="删除" aria-label="删除"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div>${renderMarkdown(ann.markdown)}</div>
    </div>
  `).join('') || '<div class="hao-panel-item">暂无标注</div>';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;">
      <h3>全部标注</h3>
      <button class="hao-icon-btn" data-act="close" title="关闭" aria-label="关闭"><i data-lucide="x"></i></button>
    </div>
    <div class="hao-panel-list">${listHtml}</div>
  `;
  panel.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'close') {
      state.panelOpen = false;
      renderPanel();
      return;
    }
    const item = btn.closest('[data-ann-id]');
    const ann = state.data.annotations.find(a => a.id === item?.dataset.annId);
    if (!ann) return;
    if (act === 'jump') {
      jumpToAnnotation(ann);
    } else if (act === 'preview') {
      openFullscreen(ann);
    } else if (act === 'edit') {
      openEditor({ mode: 'edit', annotation: ann });
    } else if (act === 'delete') {
      await confirmDeleteAnnotation(ann.id);
    }
  });
  root.appendChild(panel);
  state.panelEl = panel;
}

function renderMarkers() {
  markerLayer.innerHTML = '';
  if (!state.data.ui.showMarkers) return;
  for (const [idx, ann] of getOrderedAnnotations().entries()) {
    const el = document.querySelector(ann.selector);
    ann.resolved = !!el;
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const btn = document.createElement('button');
    btn.className = 'hao-marker';
    btn.textContent = String(idx + 1);
    btn.style.left = window.scrollX + rect.left - 10 + 'px';
    btn.style.top = window.scrollY + rect.top - 10 + 'px';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPopover(btn, ann, idx + 1);
    });
    markerLayer.appendChild(btn);
  }
}

function openPopover(markerEl, ann, index) {
  closePopover();
  const pop = document.createElement('div');
  pop.className = 'hao-popover hao-anim-in hao-anim-pop';
  pop.innerHTML = `
    <div class="hao-popover-head">
      <div style="display:flex;align-items:center;gap:8px;"><span class="hao-badge">${index}</span><strong>标注说明</strong></div>
      <div class="hao-mini-actions hao-mini-actions--tight">
        <button class="hao-icon-btn" data-act="preview" title="全屏模式" aria-label="全屏模式"><i data-lucide="maximize-2"></i></button>
        <button class="hao-icon-btn" data-act="edit" title="编辑" aria-label="编辑"><i data-lucide="pencil"></i></button>
        <button class="hao-icon-btn hao-icon-btn-danger" data-act="delete" title="删除" aria-label="删除"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
    <div class="hao-popover-body">${renderMarkdown(ann.markdown)}</div>
  `;
  pop.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'preview') {
      openFullscreen(ann);
    } else if (act === 'edit') {
      openEditor({ mode: 'edit', annotation: ann });
    } else if (act === 'delete') {
      closePopover();
      await confirmDeleteAnnotation(ann.id);
    }
  });
  root.appendChild(pop);
  refreshLucide();
  state.popoverEl = pop;
  state.popoverMarkerEl = markerEl;
  const x = Math.min(window.scrollX + window.innerWidth - pop.offsetWidth - 12, markerEl.offsetLeft + 30);
  const y = Math.min(window.scrollY + window.innerHeight - pop.offsetHeight - 12, markerEl.offsetTop);
  pop.style.left = Math.max(window.scrollX + 12, x) + 'px';
  pop.style.top = Math.max(window.scrollY + 12, y) + 'px';
}

function closePopover() {
  removeWithAnimation(state.popoverEl);
  state.popoverEl = null;
  state.popoverMarkerEl = null;
}

function openEditor({ mode, target = null, annotation = null }) {
  closeFullscreen();
  closeEditor();
  closePopover();
  const selector = target ? buildSelector(target) : annotation.selector;
  const snippet = target ? (target.textContent || '').trim().slice(0, 120) : (annotation.textSnippet || '');

  ensureBackdrop();

  const editor = document.createElement('div');
  editor.className = 'hao-editor hao-anim-in hao-anim-modal';
  editor.innerHTML = `
    <h3>${mode === 'create' ? '新建标注' : '编辑标注'}</h3>
    <div class="hao-editor-meta">支持 Markdown（Cmd/Ctrl + Enter 保存）</div>
    <div class="hao-editor-grid">
      <div class="hao-editor-pane">
        <div class="hao-editor-pane-title">编辑内容</div>
        <textarea placeholder="输入标注内容，支持 Markdown（Cmd/Ctrl + Enter 保存）">${escapeHtml(annotation?.markdown || '')}</textarea>
      </div>
      <div class="hao-editor-pane">
        <div class="hao-editor-pane-title">实时预览</div>
        <div class="hao-preview-body hao-editor-preview"></div>
      </div>
    </div>
    <div class="hao-editor-actions">
      ${mode === 'edit' ? '<button class="hao-btn-danger" data-act="delete"><i data-lucide="trash-2"></i><span>删除</span></button>' : ''}
      <button class="hao-btn-secondary" data-act="cancel"><i data-lucide="undo-2"></i><span>取消</span></button>
      <button class="hao-btn-primary" data-act="save"><i data-lucide="save"></i><span>保存</span></button>
    </div>
  `;
  const saveEditor = async () => {
    const markdown = editor.querySelector('textarea').value.trim();
    if (!markdown) return;
    if (mode === 'create') {
      state.data.annotations.push({
        id: 'ann_' + Date.now(),
        order: state.data.annotations.length + 1,
        selector,
        tagName: target.tagName.toLowerCase(),
        textSnippet: snippet,
        markdown,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolved: true
      });
    } else {
      annotation.selector = selector;
      annotation.textSnippet = snippet;
      annotation.markdown = markdown;
      annotation.updatedAt = new Date().toISOString();
    }
    closeEditor();
    await persist();
  };

  editor.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'cancel') return closeEditor();
    if (act === 'delete' && annotation) {
      closeEditor();
      await confirmDeleteAnnotation(annotation.id);
      return;
    }
    if (act === 'save') {
      await saveEditor();
    }
  });

  const editorTextarea = editor.querySelector('textarea');
  const editorPreview = editor.querySelector('.hao-editor-preview');
  const syncEditorPreview = () => {
    editorPreview.innerHTML = renderMarkdown(editorTextarea.value || '') || '<p class="hao-editor-preview-empty">输入 Markdown 后将在这里预览</p>';
  };
  editorTextarea.addEventListener('input', syncEditorPreview);
  editorTextarea.addEventListener('keydown', async (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      await saveEditor();
    }
  });
  syncEditorPreview();
  root.appendChild(editor);
  refreshLucide();
  state.editorEl = editor;
}

function closeEditor() {
  removeWithAnimation(state.editorEl);
  state.editorEl = null;
  cleanupBackdrop();
}

function openFullscreen(annotation) {
  closeEditor();
  closeFullscreen();
  closePopover();
  ensureBackdrop();
  const modal = document.createElement('div');
  modal.className = 'hao-preview hao-fullscreen hao-anim-in hao-anim-modal';
  modal.innerHTML = `
    <div class="hao-preview-head">
      <div>
        <h3>全屏模式</h3>
      </div>
      <div class="hao-mini-actions">
        <button class="hao-icon-btn hao-icon-btn-danger" data-act="delete" title="删除" aria-label="删除"><i data-lucide="trash-2"></i></button>
        <button class="hao-icon-btn" data-act="close" title="关闭" aria-label="关闭"><i data-lucide="x"></i></button>
      </div>
    </div>
    <div class="hao-fullscreen-grid">
      <div class="hao-fullscreen-pane">
        <div class="hao-fullscreen-pane-title">编辑 Markdown（Cmd/Ctrl + Enter 保存）</div>
        <textarea class="hao-fullscreen-textarea" placeholder="输入标注内容，支持 Markdown（Cmd/Ctrl + Enter 保存）">${escapeHtml(annotation.markdown || '')}</textarea>
        <div class="hao-editor-actions">
          <button class="hao-btn-secondary" data-act="cancel"><i data-lucide="undo-2"></i><span>取消</span></button>
          <button class="hao-btn-primary" data-act="save"><i data-lucide="save"></i><span>保存</span></button>
        </div>
      </div>
      <div class="hao-fullscreen-pane">
        <div class="hao-fullscreen-pane-title">实时预览</div>
        <div class="hao-preview-body hao-fullscreen-preview"></div>
      </div>
    </div>
  `;
  const textarea = modal.querySelector('.hao-fullscreen-textarea');
  const preview = modal.querySelector('.hao-fullscreen-preview');
  const syncPreview = () => {
    preview.innerHTML = renderMarkdown(textarea.value || '');
  };
  const saveFullscreen = async () => {
    const markdown = textarea.value.trim();
    if (!markdown) return;
    annotation.markdown = markdown;
    annotation.updatedAt = new Date().toISOString();
    closeFullscreen();
    await persist();
  };
  syncPreview();
  textarea.addEventListener('input', syncPreview);
  textarea.addEventListener('keydown', async (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      await saveFullscreen();
    }
  });
  modal.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'close' || act === 'cancel') {
      closeFullscreen();
    } else if (act === 'delete') {
      closeFullscreen();
      await confirmDeleteAnnotation(annotation.id);
    } else if (act === 'save') {
      await saveFullscreen();
    }
  });
  root.appendChild(modal);
  refreshLucide();
  state.previewEl = modal;
}

function closeFullscreen() {
  removeWithAnimation(state.previewEl);
  state.previewEl = null;
  cleanupBackdrop();
}

function ensureBackdrop() {
  if (state.backdropEl) return;
  state.backdropEl = document.createElement('div');
  state.backdropEl.className = 'hao-backdrop hao-backdrop-in';
  state.backdropEl.addEventListener('click', () => {
    closeEditor();
    closeFullscreen();
  });
  root.appendChild(state.backdropEl);
}

function cleanupBackdrop() {
  if (state.editorEl || state.previewEl || state.confirmEl || state.settingsEl) return;
  removeWithAnimation(state.backdropEl, 'hao-backdrop-out');
  state.backdropEl = null;
}

function refreshLucide() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

function removeWithAnimation(el, exitClass = 'hao-anim-out') {
  if (!el) return;
  el.classList.remove('hao-anim-in', 'hao-anim-pop', 'hao-anim-modal', 'hao-anim-slide-right');
  el.classList.add(exitClass);
  setTimeout(() => {
    try { el.remove(); } catch {}
  }, exitClass === 'hao-backdrop-out' ? 160 : 220);
}

function clearHover() {
  state.hoveredEl?.classList?.remove('hao-highlight');
  state.hoveredEl = null;
}

function jumpToAnnotation(ann) {
  const el = document.querySelector(ann.selector);
  if (!el) return alert('当前页面找不到这个标注目标');
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  el.classList.add('hao-highlight');
  setTimeout(() => el.classList.remove('hao-highlight'), 1600);
}

function openSettings() {
  closeSettings();
  ensureBackdrop();

  const currentTheme = state.data.ui?.theme?.preset || 'orange';
  const hotkeys = state.data.ui?.hotkeys || { annotate: 'j', toggleMarkers: '/', list: 'l' };

  const modal = document.createElement('div');
  modal.className = 'hao-settings hao-anim-in hao-anim-modal';
  modal.innerHTML = `
    <div class="hao-settings-head">
      <div>
        <h3>设置</h3>
        <div class="hao-editor-meta">颜色、快捷键与数据</div>
      </div>
      <button class="hao-icon-btn" data-act="close" title="关闭" aria-label="关闭"><i data-lucide="x"></i></button>
    </div>

    <div class="hao-settings-section">
      <div class="hao-settings-title">颜色</div>
      <div class="hao-theme-cards">
        ${renderThemeCard('orange', currentTheme, '#f97316', '#fb923c', '橙色', '暖色强调，适合评审')}
        ${renderThemeCard('blue', currentTheme, '#2563eb', '#60a5fa', '蓝色', '稳重清晰，适合文档')}
        ${renderThemeCard('green', currentTheme, '#16a34a', '#4ade80', '绿色', '自然克制，适合流程')}
        ${renderThemeCard('rose', currentTheme, '#e11d48', '#fb7185', '玫红', '视觉更强，适合重点')}
      </div>
    </div>

    <div class="hao-settings-section">
      <div class="hao-settings-title">快捷键</div>
      <div class="hao-settings-grid">
        <label>开始标注<input data-key="annotate" class="hao-hotkey-input" value="${escapeHtml(hotkeys.annotate || 'j')}" maxlength="1" /></label>
        <label>显示/隐藏标注<input data-key="toggleMarkers" class="hao-hotkey-input" value="${escapeHtml(hotkeys.toggleMarkers || '/')}" maxlength="1" /></label>
        <label>显示所有标注<input data-key="list" class="hao-hotkey-input" value="${escapeHtml(hotkeys.list || 'l')}" maxlength="1" /></label>
      </div>
    </div>

    <div class="hao-settings-section">
      <div class="hao-settings-title">数据</div>
      <div class="hao-settings-actions">
        <button class="hao-btn-secondary" data-act="export-json"><i data-lucide="download"></i><span>导出 JSON</span></button>
        <label class="hao-btn-secondary hao-import-btn">
          <i data-lucide="upload"></i><span>导入 JSON</span>
          <input type="file" class="hao-import-input" accept="application/json,.json" hidden />
        </label>
      </div>
    </div>

    <div class="hao-settings-note">保存后会立即尝试生效；如果浏览器未立即更新，请手动刷新页面。</div>

    <div class="hao-editor-actions">
      <button class="hao-btn-secondary" data-act="reset"><i data-lucide="rotate-ccw"></i><span>恢复默认设置</span></button>
      <button class="hao-btn-secondary" data-act="cancel"><i data-lucide="undo-2"></i><span>取消</span></button>
      <button class="hao-btn-primary" data-act="save"><i data-lucide="save"></i><span>保存设置</span></button>
    </div>
  `;

  modal.addEventListener('input', (e) => {
    const input = e.target;
    if (input.matches('.hao-hotkey-input')) input.value = (input.value || '').slice(-1).toLowerCase();
  });

  modal.addEventListener('change', async (e) => {
    const input = e.target;
    if (!input.matches('.hao-import-input')) return;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      state.data = mergeData(DEFAULT_DATA, parsed);
      applyTheme();
      await persist();
      closeSettings();
      renderAll();
      showToast('导入成功', 'success');
    } catch (err) {
      showToast('导入失败：JSON 无效', 'error');
    } finally {
      input.value = '';
    }
  });

  modal.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'close' || act === 'cancel') {
      closeSettings();
      return;
    }
    if (act === 'export-json') {
      exportJson();
      showToast('已开始导出 JSON', 'success');
      return;
    }
    if (act === 'reset') {
      state.data.ui = {
        ...(state.data.ui || {}),
        theme: { preset: 'orange' },
        hotkeys: { annotate: 'j', toggleMarkers: '/', list: 'l' },
        launcher: state.data.ui?.launcher || { x: 24, y: 24 },
        showMarkers: state.data.ui?.showMarkers ?? true
      };
      applyTheme();
      await persist();
      closeSettings();
      renderAll();
      showToast('已恢复默认设置；如未立即生效，请刷新页面', 'success');
      return;
    }
    if (act === 'save') {
      const selectedPreset = modal.querySelector('input[name="hao-theme-preset"]:checked')?.value || 'orange';
      const nextHotkeys = {
        annotate: modal.querySelector('[data-key="annotate"]')?.value?.trim()?.toLowerCase() || 'j',
        toggleMarkers: modal.querySelector('[data-key="toggleMarkers"]')?.value?.trim() || '/',
        list: modal.querySelector('[data-key="list"]')?.value?.trim()?.toLowerCase() || 'l'
      };
      state.data.ui = state.data.ui || {};
      state.data.ui.theme = { preset: selectedPreset };
      state.data.ui.hotkeys = nextHotkeys;
      applyTheme();
      await persist();
      closeSettings();
      renderAll();
      showToast('设置已保存；如未立即生效，请刷新页面', 'success');
    }
  });

  root.appendChild(modal);
  state.settingsEl = modal;
  refreshLucide();
}

function closeSettings() {
  removeWithAnimation(state.settingsEl);
  state.settingsEl = null;
  cleanupBackdrop();
}

function renderThemeCard(value, current, color, colorLight, label, desc) {
  return `<label class="hao-theme-card">
    <input type="radio" name="hao-theme-preset" value="${value}" ${value === current ? 'checked' : ''} />
    <span class="hao-theme-card-preview" style="--theme-a:${color};--theme-b:${colorLight}"></span>
    <span class="hao-theme-card-text">
      <strong>${label}</strong>
      <small>${desc}</small>
    </span>
  </label>`;
}

function applyTheme() {
  const rootEl = document.documentElement;
  const preset = state.data.ui?.theme?.preset || 'orange';
  const themeMap = {
    orange: { accent:'#f97316', accentLight:'#fb923c', accentDark:'#c2410c', glow:'rgba(249,115,22,.32)', glowStrong:'rgba(249,115,22,.38)' },
    blue: { accent:'#2563eb', accentLight:'#60a5fa', accentDark:'#1d4ed8', glow:'rgba(37,99,235,.32)', glowStrong:'rgba(37,99,235,.38)' },
    green: { accent:'#16a34a', accentLight:'#4ade80', accentDark:'#15803d', glow:'rgba(22,163,74,.32)', glowStrong:'rgba(22,163,74,.38)' },
    rose: { accent:'#e11d48', accentLight:'#fb7185', accentDark:'#be123c', glow:'rgba(225,29,72,.32)', glowStrong:'rgba(225,29,72,.38)' }
  };
  const theme = themeMap[preset] || themeMap.orange;
  rootEl.style.setProperty('--hao-accent', theme.accent);
  rootEl.style.setProperty('--hao-accent-light', theme.accentLight);
  rootEl.style.setProperty('--hao-accent-dark', theme.accentDark);
  rootEl.style.setProperty('--hao-accent-glow', theme.glow);
  rootEl.style.setProperty('--hao-accent-glow-strong', theme.glowStrong);
}

function showToast(message, type = 'success') {
  removeWithAnimation(state.toastEl);
  const toast = document.createElement('div');
  toast.className = `hao-toast hao-anim-in hao-toast-${type}`;
  toast.innerHTML = `${type === 'success' ? '✓' : '⚠'} <span>${escapeHtml(message)}</span>`;
  root.appendChild(toast);
  state.toastEl = toast;
  setTimeout(() => {
    if (state.toastEl === toast) {
      removeWithAnimation(toast);
      state.toastEl = null;
    }
  }, 2800);
}

async function confirmDeleteAnnotation(id) {
  return new Promise((resolve) => {
    closeConfirm();
    ensureBackdrop();

    const modal = document.createElement('div');
    modal.className = 'hao-confirm hao-anim-in hao-anim-modal';
    modal.innerHTML = `
      <div class="hao-confirm-title">确认删除</div>
      <div class="hao-confirm-desc">删除后不可恢复。按 <kbd>Enter</kbd> 可直接确认。</div>
      <div class="hao-editor-actions">
        <button class="hao-btn-secondary" data-act="cancel"><i data-lucide="x"></i><span>取消</span></button>
        <button class="hao-btn-danger" data-act="confirm"><i data-lucide="trash-2"></i><span>确认删除</span></button>
      </div>
    `;

    const cleanup = (result) => {
      document.removeEventListener('keydown', onKeydown, true);
      closeConfirm();
      resolve(result);
    };

    const onKeydown = async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await deleteAnnotation(id);
        cleanup(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(false);
      }
    };

    modal.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'cancel') {
        cleanup(false);
      } else if (act === 'confirm') {
        await deleteAnnotation(id);
        cleanup(true);
      }
    });

    root.appendChild(modal);
    state.confirmEl = modal;
    refreshLucide();
    document.addEventListener('keydown', onKeydown, true);
  });
}

function closeConfirm() {
  removeWithAnimation(state.confirmEl);
  state.confirmEl = null;
  cleanupBackdrop();
}

async function deleteAnnotation(id) {
  state.data.annotations = state.data.annotations
    .filter(a => a.id !== id)
    .map((a, idx) => ({ ...a, order: idx + 1 }));
  await persist();
}

async function persist() {
  state.data.page = { path: location.pathname, title: document.title };
  state.data.annotations = getOrderedAnnotations().map((a, idx) => ({ ...a, order: idx + 1 }));
  await API.save(state.data);
  renderAll();
}

function getOrderedAnnotations() {
  return [...state.data.annotations].sort((a, b) => a.order - b.order);
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'annotations.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildSelector(el) {
  if (el.dataset && Object.keys(el.dataset).length) {
    const key = Object.keys(el.dataset)[0];
    return `[data-${camelToKebab(key)}="${cssEscape(el.dataset[key])}"]`;
  }
  if (el.id) return `#${cssEscape(el.id)}`;
  const attrs = ['name', 'aria-label', 'role', 'href', 'title'];
  for (const attr of attrs) {
    const val = el.getAttribute?.(attr);
    if (val && document.querySelectorAll(`${el.tagName.toLowerCase()}[${cssEscape(attr)}="${cssEscape(val)}"]`).length === 1) {
      return `${el.tagName.toLowerCase()}[${attr}="${cssEscape(val)}"]`;
    }
  }
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && parts.length < 5) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      part = `#${cssEscape(node.id)}`;
      parts.unshift(part);
      break;
    }
    const parent = node.parentElement;
    if (parent) {
      const same = [...parent.children].filter(child => child.tagName === node.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(' > ');
}

function renderMarkdown(md) {
  const src = String(md || '').replace(/\r\n?/g, '\n').trim();
  if (!src) return '';

  const lines = src.split('\n');
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      i += 1;
      const code = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const block = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        block.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      html.push(`<blockquote>${block.map(v => renderInlineMarkdown(v)).join('<br>')}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i += 1;
      }
      html.push(`<ul>${items.map(item => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      html.push(`<ol>${items.map(item => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ol>`);
      continue;
    }

    const paragraph = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('```') &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    html.push(`<p>${renderInlineMarkdown(paragraph.join('<br>'))}</p>`);
  }

  return html.join('');
}

function renderInlineMarkdown(value) {
  let html = escapeHtml(String(value || ''));
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img alt="$1" src="$2" />');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return html;
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function getDefaultLauncherPosition() {
  const size = 58;
  const offsetX = Math.max(24, Math.round(window.innerWidth * 0.1));
  const offsetY = Math.max(24, Math.round(window.innerHeight * 0.1));
  return {
    x: Math.max(8, window.innerWidth - size - offsetX),
    y: Math.max(8, window.innerHeight - size - offsetY)
  };
}
function camelToKebab(s) { return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }
function cssEscape(s) { return String(s).replaceAll('\\', '\\\\').replaceAll('"', '\\"'); }
