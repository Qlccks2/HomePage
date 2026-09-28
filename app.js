/* ============ MyNav 核心逻辑 ============ */
(function () {
  "use strict";

  // ---- 常量 & 默认数据 ----
  const STORAGE_KEY = "mynav_config_v1";

  const ENGINES = [
    { name: "百度", icon: "🔍", url: "https://www.baidu.com/s?wd=" },
    { name: "Google", icon: "🌐", url: "https://www.google.com/search?q=" },
    { name: "Bing", icon: "🧭", url: "https://www.bing.com/search?q=" },
    { name: "必应", icon: "🧭", url: "https://cn.bing.com/search?q=" },
    { name: "知乎", icon: "💡", url: "https://www.zhihu.com/search?type=content&q=" },
    { name: "B站", icon: "📺", url: "https://search.bilibili.com/all?keyword=" },
    { name: "GitHub", icon: "🐙", url: "https://github.com/search?q=" },
  ];

  // 内置壁纸（免费高清图源，直接外链）
  const WALLPAPERS = [
    { name: "山峦", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80" },
    { name: "星空", url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1600&q=80" },
    { name: "海洋", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80" },
    { name: "森林", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80" },
    { name: "城市", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80" },
    { name: "极光", url: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1600&q=80" },
  ];

  // 默认图标库（用于快速填充示例）
  function favicon(domain) {
    return "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64";
  }

  const DEFAULT_DATA = {
    engine: 0,
    wallpaper: 0,
    customWallpapers: [],
    groups: [
      {
        id: "g1",
        name: "常用",
        items: [
          { id: "i1", name: "百度", url: "https://www.baidu.com", icon: favicon("baidu.com") },
          { id: "i2", name: "B站", url: "https://www.bilibili.com", icon: favicon("bilibili.com") },
          { id: "i3", name: "知乎", url: "https://www.zhihu.com", icon: favicon("zhihu.com") },
          { id: "i4", name: "GitHub", url: "https://github.com", icon: favicon("github.com") },
          { id: "i5", name: "微博", url: "https://weibo.com", icon: favicon("weibo.com") },
          { id: "i6", name: "淘宝", url: "https://www.taobao.com", icon: favicon("taobao.com") },
        ],
      },
      {
        id: "g2",
        name: "工具",
        items: [
          { id: "i7", name: "翻译", url: "https://fanyi.baidu.com", icon: favicon("fanyi.baidu.com") },
          { id: "i8", name: "地图", url: "https://map.baidu.com", icon: favicon("map.baidu.com") },
          { id: "i9", name: "邮箱", url: "https://mail.qq.com", icon: favicon("mail.qq.com") },
          { id: "i10", name: "网盘", url: "https://pan.baidu.com", icon: favicon("pan.baidu.com") },
        ],
      },
    ],
    todos: [],
  };

  // ---- 状态 ----
  let data = load();

  // ---- DOM ----
  const $ = (s) => document.querySelector(s);
  const bgEl = $("#bg");
  const timeEl = $("#time");
  const dateEl = $("#date");
  const engineSelect = $("#engineSelect");
  const engineIcon = $("#engineIcon");
  const engineName = $("#engineName");
  const engineMenu = $("#engineMenu");
  const searchInput = $("#searchInput");
  const navContainer = $("#navContainer");
  const todoList = $("#todoList");
  const todoInput = $("#todoInput");
  const todoCount = $("#todoCount");
  const modalMask = $("#modalMask");
  const modal = $("#modal");
  const modalTitle = $("#modalTitle");
  const modalBody = $("#modalBody");
  const modalClose = $("#modalClose");

  // ---- 工具函数 ----
  function uid() {
    return "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 合并默认字段，防止老数据缺字段
        return Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_DATA)), parsed);
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  // ---- 时钟 ----
  const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    timeEl.textContent = h + ":" + m;
    dateEl.textContent =
      now.getFullYear() + "年" +
      (now.getMonth() + 1) + "月" +
      now.getDate() + "日 星期" + WEEK[now.getDay()];
  }

  // ---- 壁纸 ----
  // 合并内置壁纸 + 用户自定义壁纸
  function allWallpapers() {
    return WALLPAPERS.concat(data.customWallpapers || []);
  }
  function applyWallpaper() {
    const list = allWallpapers();
    const w = list[data.wallpaper] || list[0];
    bgEl.style.backgroundImage = 'url("' + w.url + '")';
  }

  // ---- 搜索引擎 ----
  function renderEngine() {
    const e = ENGINES[data.engine] || ENGINES[0];
    engineIcon.textContent = e.icon;
    engineName.textContent = e.name;
  }
  function renderEngineMenu() {
    engineMenu.innerHTML = "";
    ENGINES.forEach((e, i) => {
      const d = document.createElement("div");
      d.className = "em-item" + (i === data.engine ? " active" : "");
      d.innerHTML = '<span>' + e.icon + '</span><span>' + e.name + '</span>';
      d.addEventListener("click", () => {
        data.engine = i;
        save();
        renderEngine();
        renderEngineMenu();
        engineMenu.classList.add("hidden");
      });
      engineMenu.appendChild(d);
    });
  }
  function doSearch() {
    const kw = searchInput.value.trim();
    if (!kw) return;
    const e = ENGINES[data.engine] || ENGINES[0];
    window.open(e.url + encodeURIComponent(kw), "_blank");
  }

  // ---- 导航渲染 ----
  function renderNav() {
    navContainer.innerHTML = "";
    data.groups.forEach((g) => {
      const groupEl = document.createElement("div");
      groupEl.className = "nav-group";
      groupEl.dataset.id = g.id;

      const head = document.createElement("div");
      head.className = "group-head";
      head.innerHTML =
        '<span class="group-title">' + escapeHtml(g.name) + '</span>' +
        '<div class="group-actions">' +
          '<button class="gh-btn" data-act="add">＋</button>' +
          '<button class="gh-btn" data-act="rename">✎</button>' +
          '<button class="gh-btn del" data-act="del">🗑</button>' +
        '</div>';
      groupEl.appendChild(head);

      const items = document.createElement("div");
      items.className = "group-items";
      g.items.forEach((it) => {
        const a = document.createElement("a");
        a.className = "nav-item";
        a.href = it.url || "#";
        a.target = "_blank";
        a.rel = "noopener";
        a.dataset.id = it.id;

        const iconWrap = document.createElement("div");
        iconWrap.className = "icon-wrap";
        if (it.icon) {
          const img = document.createElement("img");
          img.src = it.icon;
          img.alt = "";
          img.loading = "lazy";
          img.onerror = () => { img.replaceWith(letterIcon(it.name)); };
          iconWrap.appendChild(img);
        } else {
          iconWrap.appendChild(letterIcon(it.name));
        }

        const name = document.createElement("span");
        name.className = "ni-name";
        name.textContent = it.name;

        const editBtn = document.createElement("button");
        editBtn.className = "item-edit";
        editBtn.textContent = "✎";
        editBtn.title = "编辑";
        editBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openIconModal(g.id, it.id);
        });

        a.appendChild(iconWrap);
        a.appendChild(name);
        a.appendChild(editBtn);
        items.appendChild(a);
      });

      groupEl.appendChild(items);

      // 分组操作
      head.querySelector('[data-act="add"]').addEventListener("click", () => openIconModal(g.id));
      head.querySelector('[data-act="rename"]').addEventListener("click", () => openGroupModal(g.id));
      head.querySelector('[data-act="del"]').addEventListener("click", () => deleteGroup(g.id));

      navContainer.appendChild(groupEl);
    });
  }

  function letterIcon(name) {
    const span = document.createElement("span");
    span.textContent = (name || "?").trim().charAt(0).toUpperCase();
    return span;
  }

  // ---- 待办渲染 ----
  function renderTodo() {
    todoList.innerHTML = "";
    data.todos.forEach((t, idx) => {
      const li = document.createElement("li");
      if (t.done) li.className = "done";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!t.done;
      cb.addEventListener("change", () => {
        data.todos[idx].done = cb.checked;
        save();
        renderTodo();
      });
      const text = document.createElement("span");
      text.className = "t-text";
      text.textContent = t.text;
      const del = document.createElement("button");
      del.className = "todo-del";
      del.textContent = "✕";
      del.title = "删除";
      del.addEventListener("click", () => {
        data.todos.splice(idx, 1);
        save();
        renderTodo();
      });
      li.appendChild(cb);
      li.appendChild(text);
      li.appendChild(del);
      todoList.appendChild(li);
    });
    const undone = data.todos.filter((t) => !t.done).length;
    todoCount.textContent = data.todos.length ? undone + "/" + data.todos.length : "0";
  }
  function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    data.todos.push({ text: text, done: false });
    todoInput.value = "";
    save();
    renderTodo();
  }

  // ---- 弹窗 ----
  function openModal(title, bodyHtml) {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalMask.classList.remove("hidden");
  }
  function closeModal() {
    modalMask.classList.add("hidden");
  }

  function openGroupModal(groupId) {
    const g = data.groups.find((x) => x.id === groupId);
    if (!g) return;
    openModal(
      "重命名分组",
      '<div class="form-field"><label>分组名称</label><input id="f-name" type="text" value="' + escapeHtml(g.name) + '" /></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="f-cancel">取消</button><button class="btn btn-primary" id="f-ok">保存</button></div>'
    );
    $("#f-cancel").onclick = closeModal;
    $("#f-ok").onclick = () => {
      const v = $("#f-name").value.trim();
      if (v) { g.name = v; save(); renderNav(); }
      closeModal();
    };
    $("#f-name").focus();
  }

  function openIconModal(groupId, itemId) {
    const g = data.groups.find((x) => x.id === groupId);
    if (!g) return;
    const it = itemId ? g.items.find((x) => x.id === itemId) : null;
    const isEdit = !!it;
    openModal(
      isEdit ? "编辑图标" : "新增图标",
      '<div class="form-field"><label>名称</label><input id="f-name" type="text" value="' + (isEdit ? escapeHtml(it.name) : "") + '" placeholder="例如：百度" /></div>' +
      '<div class="form-field"><label>网址（需含 https://）</label><input id="f-url" type="text" value="' + (isEdit ? escapeHtml(it.url) : "") + '" placeholder="https://example.com" /></div>' +
      '<div class="form-field"><label>图标地址（可留空，自动识别网站图标）</label><input id="f-icon" type="text" value="' + (isEdit && it.icon ? escapeHtml(it.icon) : "") + '" placeholder="https://.../icon.png" /></div>' +
      '<div class="modal-actions">' +
        (isEdit ? '<button class="btn btn-danger" id="f-del">删除</button>' : "") +
        '<button class="btn btn-ghost" id="f-cancel">取消</button>' +
        '<button class="btn btn-primary" id="f-ok">保存</button>' +
      '</div>'
    );
    $("#f-cancel").onclick = closeModal;
    $("#f-ok").onclick = () => {
      const name = $("#f-name").value.trim();
      let url = $("#f-url").value.trim();
      const icon = $("#f-icon").value.trim();
      if (!name || !url) { alert("请填写名称和网址"); return; }
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      let resolvedIcon = icon;
      if (!resolvedIcon) {
        try { resolvedIcon = favicon(new URL(url).hostname); } catch (e) { resolvedIcon = ""; }
      }
      if (isEdit) {
        it.name = name; it.url = url; it.icon = resolvedIcon;
      } else {
        g.items.push({ id: uid(), name: name, url: url, icon: resolvedIcon });
      }
      save();
      renderNav();
      closeModal();
    };
    if ($("#f-del")) {
      $("#f-del").onclick = () => {
        g.items = g.items.filter((x) => x.id !== itemId);
        save();
        renderNav();
        closeModal();
      };
    }
    $("#f-name").focus();
  }

  function deleteGroup(groupId) {
    const g = data.groups.find((x) => x.id === groupId);
    if (!g) return;
    if (!confirm('确定删除分组「' + g.name + '」及其所有图标？')) return;
    data.groups = data.groups.filter((x) => x.id !== groupId);
    save();
    renderNav();
  }

  function addGroup() {
    openModal(
      "新增分组",
      '<div class="form-field"><label>分组名称</label><input id="f-name" type="text" placeholder="例如：学习" /></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="f-cancel">取消</button><button class="btn btn-primary" id="f-ok">创建</button></div>'
    );
    $("#f-cancel").onclick = closeModal;
    $("#f-ok").onclick = () => {
      const v = $("#f-name").value.trim();
      if (!v) { alert("请输入分组名称"); return; }
      data.groups.push({ id: uid(), name: v, items: [] });
      save();
      renderNav();
      closeModal();
    };
    $("#f-name").focus();
  }

  // ---- 导出 / 导入 / 重置 ----
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mynav-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.groups)) throw new Error("bad");
        data = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_DATA)), parsed);
        save();
        refreshAll();
        alert("导入成功！");
      } catch (e) {
        alert("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
  }
  function resetData() {
    if (!confirm("确定恢复默认配置？当前配置将被覆盖。")) return;
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    save();
    refreshAll();
  }

  // ---- 壁纸切换 ----
  function nextWallpaper() {
    const list = allWallpapers();
    data.wallpaper = (data.wallpaper + 1) % list.length;
    save();
    applyWallpaper();
    showToast("壁纸：" + list[data.wallpaper].name);
  }

  // ---- 添加在线壁纸 ----
  function addCustomWallpaper() {
    openModal(
      "添加在线壁纸",
      '<div class="form-field"><label>名称（可选）</label><input id="f-wp-name" type="text" placeholder="例如：我的壁纸" /></div>' +
      '<div class="form-field"><label>图片地址（直链 URL）</label><input id="f-wp-url" type="text" placeholder="https://example.com/image.jpg" /></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="f-cancel">取消</button><button class="btn btn-primary" id="f-ok">添加并设为壁纸</button></div>'
    );
    $("#f-cancel").onclick = closeModal;
    $("#f-ok").onclick = () => {
      let url = $("#f-wp-url").value.trim();
      const name = $("#f-wp-name").value.trim();
      if (!url) { alert("请填写图片地址"); return; }
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      data.customWallpapers = data.customWallpapers || [];
      data.customWallpapers.push({ name: name || "自定义壁纸", url: url });
      // 直接切换到新添加的这张
      const list = allWallpapers();
      data.wallpaper = list.length - 1;
      save();
      applyWallpaper();
      closeModal();
      showToast("已添加壁纸");
    };
    $("#f-wp-url").focus();
  }

  // ---- 轻提示 ----
  let toastTimer;
  function showToast(msg) {
    let t = $("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:10px 18px;border-radius:30px;font-size:14px;z-index:200;transition:opacity .3s;";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.opacity = "0"; }, 1800);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // ---- 刷新全部 ----
  function refreshAll() {
    renderEngine();
    renderEngineMenu();
    renderNav();
    renderTodo();
    applyWallpaper();
    updateClock();
  }

  // ---- 事件绑定 ----
  function bindEvents() {
    // 搜索
    searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
    engineSelect.addEventListener("click", () => engineMenu.classList.toggle("hidden"));
    document.addEventListener("click", (e) => {
      if (!engineSelect.contains(e.target) && !engineMenu.contains(e.target)) {
        engineMenu.classList.add("hidden");
      }
    });

    // 待办
    todoInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTodo(); });

    // 弹窗
    modalClose.addEventListener("click", closeModal);
    modalMask.addEventListener("click", (e) => { if (e.target === modalMask) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    // 工具栏
    $("#btnAddGroup").addEventListener("click", addGroup);
    $("#btnAddIcon").addEventListener("click", () => {
      if (!data.groups.length) { alert("请先创建一个分组"); return; }
      openIconModal(data.groups[0].id);
    });
    $("#btnWallpaper").addEventListener("click", nextWallpaper);
    $("#btnAddWallpaper").addEventListener("click", addCustomWallpaper);
    $("#btnExport").addEventListener("click", exportData);
    $("#btnImport").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });
    $("#btnReset").addEventListener("click", resetData);

    // 底部工具栏：悬停显示
    const toolbar = $("#toolbar");
    const hoverZone = $("#hoverZone");
    let hideTimer;
    function showToolbar() {
      clearTimeout(hideTimer);
      toolbar.classList.add("visible");
    }
    function hideToolbar() {
      hideTimer = setTimeout(() => {
        if (!toolbar.matches(":hover") && !hoverZone.matches(":hover")) {
          toolbar.classList.remove("visible");
        }
      }, 200);
    }
    hoverZone.addEventListener("mouseenter", showToolbar);
    hoverZone.addEventListener("mouseleave", hideToolbar);
    toolbar.addEventListener("mouseenter", showToolbar);
    toolbar.addEventListener("mouseleave", hideToolbar);
  }

  // ---- 启动 ----
  function init() {
    bindEvents();
    refreshAll();
    setInterval(updateClock, 1000);
  }

  init();
})();
