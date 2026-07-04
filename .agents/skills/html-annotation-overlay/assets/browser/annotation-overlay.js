export function createAnnotationStore({ loadAll, saveAll }) {
  return {
    async load() {
      return await loadAll();
    },
    async save(payload) {
      return await saveAll(payload);
    }
  };
}

export function createLocalStorageStore(key = 'hao-annotations') {
  return createAnnotationStore({
    async loadAll() {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : { version: 1, ui: { launcher: { x: 24, y: 24 }, showMarkers: true }, annotations: [] };
    },
    async saveAll(payload) {
      localStorage.setItem(key, JSON.stringify(payload, null, 2));
      return payload;
    }
  });
}

export async function mountHtmlAnnotationOverlay({ store, renderMarkdown, selectorBuilder }) {
  const data = await store.load();
  const root = document.createElement('div');
  root.className = 'hao-root';
  document.body.appendChild(root);

  const launcher = document.createElement('button');
  launcher.className = 'hao-launcher';
  launcher.textContent = '注';
  root.appendChild(launcher);

  let launcherPos = data.ui?.launcher || { x: 24, y: 24 };
  launcher.style.left = launcherPos.x + 'px';
  launcher.style.top = launcherPos.y + 'px';

  let state = {
    menuOpen: false,
    annotationMode: false,
    hoveredEl: null,
    showMarkers: data.ui?.showMarkers ?? true,
    annotations: data.annotations || []
  };

  let menuEl = null;
  let popoverEl = null;
  const markerLayer = document.createElement('div');
  root.appendChild(markerLayer);

  const renderMenu = () => {
    menuEl?.remove();
    if (!state.menuOpen) return;
    menuEl = document.createElement('div');
    menuEl.className = 'hao-menu';
    menuEl.style.left = launcher.offsetLeft + 'px';
    menuEl.style.top = launcher.offsetTop + 52 + 'px';
    const actions = [
      ['显示所有标注', () => { state.showMarkers = true; persistAndRender(); }],
      ['隐藏所有标注', () => { state.showMarkers = false; persistAndRender(); }],
      ['进入标注模式', () => { state.annotationMode = true; state.menuOpen = false; renderAll(); }]
    ];
    actions.forEach(([label, handler]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.onclick = handler;
      menuEl.appendChild(btn);
    });
    root.appendChild(menuEl);
  };

  const cleanupHighlight = () => {
    state.hoveredEl?.classList?.remove('hao-highlight');
    state.hoveredEl = null;
  };

  const renderMarkers = () => {
    markerLayer.innerHTML = '';
    if (!state.showMarkers) return;
    state.annotations
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((ann, index) => {
        const target = document.querySelector(ann.selector);
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const marker = document.createElement('button');
        marker.className = 'hao-marker';
        marker.textContent = String(index + 1);
        marker.style.left = window.scrollX + rect.left - 10 + 'px';
        marker.style.top = window.scrollY + rect.top - 10 + 'px';
        marker.onclick = (e) => {
          e.stopPropagation();
          renderPopover(marker, ann);
        };
        markerLayer.appendChild(marker);
      });
  };

  const renderPopover = (marker, ann) => {
    popoverEl?.remove();
    popoverEl = document.createElement('div');
    popoverEl.className = 'hao-popover';
    popoverEl.style.left = marker.offsetLeft + 28 + 'px';
    popoverEl.style.top = marker.offsetTop + 'px';
    popoverEl.innerHTML = renderMarkdown(ann.markdown);
    root.appendChild(popoverEl);
  };

  const persistAndRender = async () => {
    const payload = {
      ...data,
      ui: {
        ...(data.ui || {}),
        launcher: launcherPos,
        showMarkers: state.showMarkers
      },
      annotations: state.annotations
    };
    await store.save(payload);
    renderAll();
  };

  const renderAll = () => {
    renderMenu();
    renderMarkers();
    launcher.style.left = launcherPos.x + 'px';
    launcher.style.top = launcherPos.y + 'px';
    cleanupHighlight();
  };

  let dragStart = null;
  launcher.addEventListener('pointerdown', (e) => {
    dragStart = { x: e.clientX, y: e.clientY, left: launcherPos.x, top: launcherPos.y, moved: false };
    launcher.setPointerCapture(e.pointerId);
  });
  launcher.addEventListener('pointermove', (e) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragStart.moved = true;
    launcherPos = { x: Math.max(8, dragStart.left + dx), y: Math.max(8, dragStart.top + dy) };
    launcher.style.left = launcherPos.x + 'px';
    launcher.style.top = launcherPos.y + 'px';
  });
  launcher.addEventListener('pointerup', async () => {
    if (!dragStart) return;
    const moved = dragStart.moved;
    dragStart = null;
    if (moved) {
      await persistAndRender();
    } else {
      state.menuOpen = !state.menuOpen;
      renderAll();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!state.annotationMode) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || root.contains(el)) return;
    if (state.hoveredEl !== el) {
      cleanupHighlight();
      state.hoveredEl = el;
      el.classList.add('hao-highlight');
    }
  });

  document.addEventListener('click', async (e) => {
    if (!state.annotationMode) return;
    if (root.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.target;
    const markdown = window.prompt('输入标注内容（支持 Markdown）');
    cleanupHighlight();
    state.annotationMode = false;
    if (!markdown) return renderAll();

    const selector = selectorBuilder ? selectorBuilder(target) : defaultSelectorBuilder(target);
    state.annotations.push({
      id: 'ann_' + Date.now(),
      order: state.annotations.length + 1,
      selector,
      tagName: target.tagName.toLowerCase(),
      textSnippet: (target.textContent || '').trim().slice(0, 120),
      markdown,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolved: true
    });
    await persistAndRender();
  }, true);

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      popoverEl?.remove();
      popoverEl = null;
      if (state.menuOpen) {
        state.menuOpen = false;
        renderAll();
      }
    }
  });

  window.addEventListener('scroll', renderMarkers, true);
  window.addEventListener('resize', renderMarkers);
  renderAll();
}

function defaultSelectorBuilder(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && parts.length < 4) {
    let part = node.tagName.toLowerCase();
    if (node.classList.length) {
      part += '.' + [...node.classList].slice(0, 2).map((c) => CSS.escape(c)).join('.');
    }
    const parent = node.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter((child) => child.tagName === node.tagName);
      if (siblings.length > 1) {
        part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(' > ');
}
