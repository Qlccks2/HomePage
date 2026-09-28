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

  // 图标背景色板（最后一项为渐变）
  const ICON_COLORS = [
    "#3b82f6", "#f59e0b", "#ef4444", "#795548", "#4caf50", "#1e3a8a",
    "#c8a415", "#8b1a1a", "#d32f2f", "#1565c0", "#a5d6a7", "#9e9e9e",
    "gradient",
  ];

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
  function openModal(title, bodyHtml, opts) {
    opts = opts || {};
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.classList.toggle("large", !!opts.large);
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

  // ===== iTab 风格添加/编辑图标弹窗 =====
  // canvas 生成文字图标（纯色/渐变背景 + 白色文字）
  function makeTextIcon(text, color) {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d");
    if (color === "gradient") {
      const gd = ctx.createLinearGradient(0, 0, 128, 128);
      gd.addColorStop(0, "#ff5f6d");
      gd.addColorStop(0.5, "#ffc371");
      gd.addColorStop(1, "#47c2ff");
      ctx.fillStyle = gd;
    } else {
      ctx.fillStyle = color;
    }
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#fff";
    const t = (text || "A").slice(0, 2);
    ctx.font = '700 ' + (t.length > 1 ? 46 : 56) + 'px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t, 64, 66);
    return c.toDataURL("image/png");
  }

  // 上传图片压缩为 128x128 dataURL（cover 裁剪）
  function compressImageFile(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 128; c.height = 128;
        const ctx = c.getContext("2d");
        const size = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 128, 128);
        cb(c.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function openIconModal(groupId, itemId) {
    const g = data.groups.find((x) => x.id === groupId);
    if (!g) return;
    const it = itemId ? g.items.find((x) => x.id === itemId) : null;
    const isEdit = !!it;

    // 弹窗状态
    const state = {
      tab: "custom",        // custom=自定义图标 | auto=网址导航
      source: "text",       // auto | text | upload
      url: isEdit ? it.url : "",
      name: isEdit ? it.name : "",
      iconText: "",
      color: ICON_COLORS[0],
      uploadData: "",
      autoIcon: isEdit && it.icon && !it.icon.startsWith("data:") ? it.icon : "",
    };
    if (isEdit) {
      state.iconText = (it.name || "A").trim().charAt(0);
      if (it.icon && it.icon.startsWith("data:")) {
        state.source = "upload";
        state.uploadData = it.icon;
        state.tab = "custom";
      } else {
        state.source = "auto";
        state.tab = "auto";
      }
    }

    // ---- 渲染 ----
    function colorDotStyle(color) {
      return color === "gradient"
        ? 'background:conic-gradient(from 0deg,#ff5f6d,#ffc371,#4caf50,#47c2ff,#b06ab3,#ff5f6d)'
        : 'background:' + color;
    }

    function buildBody() {
      const sideHtml =
        '<aside class="dlg-side">' +
          '<div class="side-item' + (state.tab === "auto" ? " active" : "") + '" data-tab="auto">🌐 网址导航</div>' +
          '<div class="side-item' + (state.tab === "custom" ? " active" : "") + '" data-tab="custom">🔧 自定义图标</div>' +
        '</aside>';

      const commonFields =
        '<div class="panel">' +
          '<label class="f-label">网址</label>' +
          '<div class="ipt-row">' +
            '<input class="ipt" id="f-url" type="text" placeholder="https://" value="' + escapeHtml(state.url) + '" />' +
            (state.tab === "auto" ? '<button class="btn-fetch" id="f-fetch">获取图标</button>' : '') +
          '</div>' +
          '<label class="f-label mt">名称</label>' +
          '<input class="ipt" id="f-name" type="text" placeholder="网站名称" value="' + escapeHtml(state.name) + '" />' +
        '</div>';

      let iconPanel = "";
      if (state.tab === "auto") {
        // 网址导航 tab：favicon 预览
        let previewHtml;
        if (state.autoIcon) {
          previewHtml = '<img id="autoImg" src="' + escapeHtml(state.autoIcon) + '" alt="" />';
        } else {
          previewHtml = '<span>🌐</span>';
        }
        iconPanel =
          '<div class="panel">' +
            '<label class="f-label">图标预览（自动获取网站图标）</label>' +
            '<div class="pick-cards">' +
              '<div class="pick-card active"><div class="pc-box" id="autoBox">' + previewHtml + '</div><div class="pc-name">自动图标</div></div>' +
            '</div>' +
          '</div>';
      } else {
        // 自定义图标 tab：文字图标 / 上传 卡片 + 文字 + 颜色
        const textPreview = state.iconText || "A";
        const textBg = state.color === "gradient"
          ? 'background:conic-gradient(from 0deg,#ff5f6d,#ffc371,#4caf50,#47c2ff,#b06ab3,#ff5f6d)'
          : 'background:' + state.color;
        let uploadInner;
        if (state.uploadData) {
          uploadInner = '<img src="' + state.uploadData + '" alt="" />';
        } else {
          uploadInner = '<span style="font-size:30px;color:#999;">＋</span>';
        }
        iconPanel =
          '<div class="panel">' +
            '<div class="pick-cards">' +
              '<div class="pick-card' + (state.source === "text" ? " active" : "") + '" data-source="text">' +
                '<div class="pc-box pc-text" id="textCard" style="' + textBg + '">' + escapeHtml(textPreview) + '</div>' +
                '<div class="pc-name">文字图标</div>' +
              '</div>' +
              '<div class="pick-card' + (state.source === "upload" ? " active" : "") + '" data-source="upload">' +
                '<div class="pc-box" id="uploadBox">' + uploadInner + '</div>' +
                '<div class="pc-name">上传</div>' +
              '</div>' +
              '<div class="pick-card' + (state.source === "auto" ? " active" : "") + '" data-source="auto">' +
                '<div class="pc-box" id="autoCard">' + (state.autoIcon ? '<img src="' + escapeHtml(state.autoIcon) + '" alt="" />' : '<span>🌐</span>') + '</div>' +
                '<div class="pc-name">自动获取</div>' +
              '</div>' +
            '</div>' +
            '<label class="f-label mt">图标文字</label>' +
            '<input class="ipt" id="f-icontext" type="text" maxlength="2" placeholder="A" value="' + escapeHtml(state.iconText) + '" style="width:180px;" />' +
            '<label class="f-label mt">图标颜色</label>' +
            '<div class="color-dots" id="colorDots">' +
              ICON_COLORS.map((c) =>
                '<div class="color-dot' + (state.color === c ? " active" : "") + '" data-color="' + c + '" style="' + colorDotStyle(c) + '"></div>'
              ).join("") +
            '</div>' +
            '<input type="file" id="f-upload" accept="image/*" style="display:none" />' +
          '</div>';
      }

      const actions =
        '<div class="dlg-actions">' +
          '<button class="btn-save" id="f-save">保存</button>' +
          (!isEdit ? '<button class="btn-save-continue" id="f-save-cont">保存并继续</button>' : "") +
        '</div>';

      return (
        '<div class="dlg-layout">' + sideHtml +
        '<div class="dlg-main">' +
          '<div class="dlg-title"><h3>自定义图标</h3><p>自定义导航图标的内容与样式</p></div>' +
          commonFields + iconPanel + actions +
        '</div></div>'
      );
    }

    // ---- 事件 ----
    function bind() {
      // 左侧 tab 切换（先同步输入值到 state）
      modalBody.querySelectorAll(".side-item").forEach((el) => {
        el.addEventListener("click", () => {
          syncInputs();
          state.tab = el.dataset.tab;
          if (state.tab === "auto" && !state.autoIcon && state.url) fetchAutoIcon();
          rebuild();
        });
      });

      // 获取图标
      const fetchBtn = $("#f-fetch");
      if (fetchBtn) {
        fetchBtn.addEventListener("click", () => {
          syncInputs();
          fetchAutoIcon();
          rebuild();
        });
      }

      // 图标方式卡片
      modalBody.querySelectorAll(".pick-card[data-source]").forEach((el) => {
        el.addEventListener("click", () => {
          syncInputs();
          const src = el.dataset.source;
          if (src === "upload") {
            state.source = "upload";
            rebuild();
            const inp = $("#f-upload");
            if (inp) inp.click();
            return;
          }
          state.source = src;
          rebuild();
        });
      });

      // 上传文件
      const uploadInput = $("#f-upload");
      if (uploadInput) {
        uploadInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          compressImageFile(file, (dataUrl) => {
            state.uploadData = dataUrl;
            state.source = "upload";
            rebuild();
            showToast("图片已添加");
          });
        });
      }

      // 图标文字
      const textInput = $("#f-icontext");
      if (textInput) {
        textInput.addEventListener("input", () => {
          state.iconText = textInput.value.trim();
          const card = $("#textCard");
          if (card) card.textContent = state.iconText || "A";
        });
      }

      // 颜色
      const dots = $("#colorDots");
      if (dots) {
        dots.querySelectorAll(".color-dot").forEach((el) => {
          el.addEventListener("click", () => {
            syncInputs();
            state.color = el.dataset.color;
            rebuild();
          });
        });
      }

      // 保存
      $("#f-save").addEventListener("click", () => doSave(false));
      const contBtn = $("#f-save-cont");
      if (contBtn) contBtn.addEventListener("click", () => doSave(true));
    }

    function syncInputs() {
      const urlEl = $("#f-url");
      const nameEl = $("#f-name");
      if (urlEl) state.url = urlEl.value.trim();
      if (nameEl) state.name = nameEl.value.trim();
    }

    function fetchAutoIcon() {
      if (!state.url) { alert("请先填写网址"); return; }
      let u = state.url;
      if (!/^https?:\/\//i.test(u)) u = "https://" + u;
      try {
        state.autoIcon = favicon(new URL(u).hostname);
      } catch (e) { /* ignore */ }
    }

    function resolveIcon() {
      if (state.tab === "auto") {
        if (state.autoIcon) return state.autoIcon;
        try { return favicon(new URL(normalizeUrl(state.url)).hostname); } catch (e) { return ""; }
      }
      if (state.source === "upload") return state.uploadData;
      return makeTextIcon(state.iconText || state.name.charAt(0), state.color);
    }

    function normalizeUrl(u) {
      if (!/^https?:\/\//i.test(u)) return "https://" + u;
      return u;
    }

    function doSave(keepAdding) {
      syncInputs();
      const name = state.name;
      if (!name) { alert("请填写名称"); return; }
      if (!state.url) { alert("请填写网址"); return; }
      const url = normalizeUrl(state.url);
      const icon = resolveIcon();
      if (state.tab === "custom" && state.source === "upload" && !icon) {
        alert("请先上传一张图片，或选择其他图标方式");
        return;
      }
      if (isEdit) {
        it.name = name; it.url = url; it.icon = icon;
      } else {
        g.items.push({ id: uid(), name: name, url: url, icon: icon });
      }
      save();
      renderNav();
      if (keepAdding) {
        // 重置表单继续添加
        state.url = ""; state.name = ""; state.uploadData = "";
        state.iconText = ""; state.autoIcon = "";
        state.source = "text";
        modalTitle.textContent = "添加图标";
        rebuild();
        showToast("已保存，可继续添加");
      } else {
        closeModal();
      }
    }

    function rebuild() {
      modalBody.innerHTML = buildBody();
      bind();
      const urlEl = $("#f-url");
      if (urlEl && !state.name) urlEl.focus();
    }

    // 打开（大弹窗）
    openModal(isEdit ? "编辑图标" : "添加图标", buildBody(), { large: true });
    bind();
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
