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

  // 多源 favicon（谷歌失败自动切换微软/DuckDuckGo）
  function faviconSources(domain) {
    return [
      "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64",
      "https://api.faviconkit.com/" + domain + "/64",
      "https://icons.duckduckgo.com/ip3/" + domain + ".ico",
      "https://favicon.im/" + domain,
    ];
  }

  // 从域名推断名称（内置常见中文名映射）
  const DOMAIN_NAMES = {
    "baidu.com": "百度", "google.com": "Google", "bing.com": "必应",
    "bilibili.com": "B站", "zhihu.com": "知乎", "github.com": "GitHub",
    "weibo.com": "微博", "taobao.com": "淘宝", "jd.com": "京东",
    "qq.com": "腾讯", "mail.qq.com": "QQ邮箱", "pan.baidu.com": "百度网盘",
    "fanyi.baidu.com": "百度翻译", "map.baidu.com": "百度地图",
    "douyin.com": "抖音", "xiaohongshu.com": "小红书", "bilibili.com": "哔哩哔哩",
    "youku.com": "优酷", "iqiyi.com": "爱奇艺", "tieba.baidu.com": "百度贴吧",
    "csdn.net": "CSDN", "juejin.cn": "掘金", "zhihu.com": "知乎",
    "stackoverflow.com": "Stack Overflow", "youtube.com": "YouTube",
    "twitter.com": "Twitter", "facebook.com": "Facebook",
    "instagram.com": "Instagram", "reddit.com": "Reddit",
    "amazon.com": "Amazon", "alibaba.com": "阿里巴巴", "1688.com": "阿里巴巴",
    "v2ex.com": "V2EX", "sspai.com": "少数派", "36kr.com": "36氪",
    "gitee.com": "Gitee", "gitlab.com": "GitLab", "openai.com": "OpenAI",
    "notion.so": "Notion", "figma.com": "Figma", "dribbble.com": "Dribbble",
    "wikipedia.org": "维基百科", "sina.com.cn": "新浪", "sohu.com": "搜狐",
    "163.com": "网易", "netease.com": "网易", "mi.com": "小米",
    "huawei.com": "华为", "apple.com": "Apple", "microsoft.com": "微软",
    "tencent.com": "腾讯", "bytedance.com": "字节跳动", "meituan.com": "美团",
    "dianping.com": "大众点评", "ctrip.com": "携程", "qunar.com": "去哪儿",
  };
  function nameFromDomain(hostname) {
    // 先去掉 www. 前缀
    let h = hostname.replace(/^www\./, "");
    // 精确匹配
    if (DOMAIN_NAMES[h]) return DOMAIN_NAMES[h];
    // 去掉子域名再试（如 mail.qq.com -> qq.com）
    const parts = h.split(".");
    for (let i = 1; i < parts.length - 1; i++) {
      const sub = parts.slice(i).join(".");
      if (DOMAIN_NAMES[sub]) return DOMAIN_NAMES[sub];
    }
    // 取主域名首字母大写作为兜底
    return parts.length >= 2 ? parts[parts.length - 2] : hostname;
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
          // 图标加载失败时，尝试多源 fallback
          let failIdx = 0;
          img.onerror = () => {
            try {
              const domain = new URL(it.url).hostname;
              const srcs = faviconSources(domain);
              if (failIdx < srcs.length) {
                img.src = srcs[failIdx++];
              } else {
                img.replaceWith(letterIcon(it.name));
              }
            } catch (e) {
              img.replaceWith(letterIcon(it.name));
            }
          };
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

  // ===== 网页抓取（借助公共 CORS 代理，依次尝试） =====
  const PROXY_MAKERS = [
    (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
    (u) => "https://corsproxy.io/?url=" + encodeURIComponent(u),
    (u) => "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(u),
  ];

  function parsePageInfo(html, pageUrl) {
    let doc;
    try {
      doc = new DOMParser().parseFromString(html, "text/html");
    } catch (e) { return null; }
    // 标题：<title>，其次 og:title
    let title = "";
    const tEl = doc.querySelector("title");
    if (tEl && tEl.textContent) title = tEl.textContent.trim();
    if (!title) {
      const og = doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
      if (og) title = (og.getAttribute("content") || "").trim();
    }
    if (title.length > 30) title = title.slice(0, 30);
    // 图标候选：apple-touch-icon 优先（分辨率高），其次 icon/shortcut，最后 /favicon.ico
    const icons = [];
    const push = (href) => {
      if (!href) return;
      try {
        const abs = new URL(href, pageUrl).href;
        if (!/^https?:/i.test(abs)) return;
        if (icons.indexOf(abs) === -1) icons.push(abs);
      } catch (e) { /* ignore */ }
    };
    doc.querySelectorAll("link[href]").forEach((l) => {
      const rel = (l.getAttribute("rel") || "").toLowerCase();
      if (rel.indexOf("apple-touch-icon") !== -1) push(l.getAttribute("href"));
    });
    doc.querySelectorAll("link[href]").forEach((l) => {
      const rel = (l.getAttribute("rel") || "").toLowerCase();
      if (rel.indexOf("icon") !== -1 && rel.indexOf("apple") === -1) push(l.getAttribute("href"));
    });
    push("/favicon.ico");
    return { title: title, icons: icons.slice(0, 4) };
  }

  async function fetchPageInfoViaProxies(pageUrl) {
    for (let i = 0; i < PROXY_MAKERS.length; i++) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 9000);
        const res = await fetch(PROXY_MAKERS[i](pageUrl), { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const html = await res.text();
        if (!html) continue;
        const info = parsePageInfo(html, pageUrl);
        if (info && (info.title || info.icons.length)) return info;
      } catch (e) { /* 换下一个代理 */ }
    }
    return null;
  }

  function openIconModal(groupId, itemId) {
    const g = data.groups.find((x) => x.id === groupId);
    if (!g) return;
    const it = itemId ? g.items.find((x) => x.id === itemId) : null;
    const isEdit = !!it;

    // 弹窗状态
    const state = {
      source: "text",           // text=文字图标 | fetched=抓取图标 | upload=上传
      url: isEdit ? it.url : "",
      name: isEdit ? it.name : "",
      nameAuto: !isEdit,        // 名称是否为自动填充（用户手输后置 false，不再覆盖）
      iconText: "",
      color: ICON_COLORS[0],
      uploadData: "",
      fetchedIcons: [],         // 抓取到的图标候选 URL
      fetchedIdx: 0,
      fetching: false,
    };
    if (isEdit) {
      state.iconText = (it.name || "A").trim().charAt(0);
      if (it.icon && it.icon.startsWith("data:")) {
        state.source = "upload";
        state.uploadData = it.icon;
      } else if (it.icon) {
        state.source = "fetched";
        state.fetchedIcons = [it.icon];
        state.fetchedIdx = 0;
      }
    }

    // ---- 渲染 ----
    function colorDotStyle(color) {
      return color === "gradient"
        ? 'background:conic-gradient(from 0deg,#ff5f6d,#ffc371,#4caf50,#47c2ff,#b06ab3,#ff5f6d)'
        : 'background:' + color;
    }

    function buildBody() {
      const textPreview = state.iconText || "A";
      const textBg = state.color === "gradient"
        ? 'background:conic-gradient(from 0deg,#ff5f6d,#ffc371,#4caf50,#47c2ff,#b06ab3,#ff5f6d)'
        : 'background:' + state.color;

      // 卡片行：文字图标 + 抓取到的图标1..N + 上传
      let cards =
        '<div class="pick-card' + (state.source === "text" ? " active" : "") + '" data-source="text">' +
          '<div class="pc-box pc-text" id="textCard" style="' + textBg + '">' + escapeHtml(textPreview) + '</div>' +
          '<div class="pc-name">文字图标</div>' +
        '</div>';
      state.fetchedIcons.forEach((u, i) => {
        cards +=
          '<div class="pick-card' + (state.source === "fetched" && state.fetchedIdx === i ? " active" : "") + '" data-source="fetched" data-idx="' + i + '">' +
            '<div class="pc-box"><img src="' + escapeHtml(u) + '" alt="" onerror="this.style.opacity=0.25" /></div>' +
            '<div class="pc-name">图标' + (i + 1) + '</div>' +
          '</div>';
      });
      cards +=
        '<div class="pick-card' + (state.source === "upload" ? " active" : "") + '" data-source="upload">' +
          '<div class="pc-box" id="uploadBox">' + (state.uploadData ? '<img src="' + state.uploadData + '" alt="" />' : '<span style="font-size:30px;color:#999;">＋</span>') + '</div>' +
          '<div class="pc-name">上传</div>' +
        '</div>';

      const body =
        '<div class="dlg-main">' +
          '<div class="dlg-title"><h3>自定义图标</h3><p>自定义导航图标的内容与样式</p></div>' +
          '<div class="panel">' +
            '<label class="f-label">网址</label>' +
            '<div class="ipt-row">' +
              '<input class="ipt" id="f-url" type="text" placeholder="https://" value="' + escapeHtml(state.url) + '" />' +
              '<button class="btn-fetch" id="f-fetch"' + (state.fetching ? " disabled" : "") + '>' + (state.fetching ? "获取中…" : "获取图标") + '</button>' +
            '</div>' +
            '<label class="f-label mt">名称</label>' +
            '<input class="ipt" id="f-name" type="text" placeholder="可留空，自动识别网页标题" value="' + escapeHtml(state.name) + '" />' +
          '</div>' +
          '<div class="panel">' +
            '<div class="pick-cards">' + cards + '</div>' +
            '<label class="f-label mt">图标文字</label>' +
            '<input class="ipt" id="f-icontext" type="text" maxlength="2" placeholder="A" value="' + escapeHtml(state.iconText) + '" style="width:180px;" />' +
            '<label class="f-label mt">图标颜色</label>' +
            '<div class="color-dots" id="colorDots">' +
              ICON_COLORS.map((c) =>
                '<div class="color-dot' + (state.color === c ? " active" : "") + '" data-color="' + c + '" style="' + colorDotStyle(c) + '"></div>'
              ).join("") +
            '</div>' +
            '<input type="file" id="f-upload" accept="image/*" style="display:none" />' +
          '</div>' +
          '<div class="dlg-actions">' +
            '<button class="btn-save" id="f-save">保存</button>' +
            (!isEdit ? '<button class="btn-save-continue" id="f-save-cont">保存并继续</button>' : "") +
          '</div>' +
        '</div>';
      return body;
    }

    // ---- 事件 ----
    function bind() {
      // 获取图标（真正抓取网页：标题 + 图标候选）
      const fetchBtn = $("#f-fetch");
      if (fetchBtn) {
        fetchBtn.addEventListener("click", () => {
          syncInputs();
          fetchPageInfo();
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
          if (src === "fetched") state.fetchedIdx = parseInt(el.dataset.idx, 10) || 0;
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

      // 名称（用户手输后不再自动覆盖）
      const nameInput = $("#f-name");
      if (nameInput) {
        nameInput.addEventListener("input", () => { state.nameAuto = false; });
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

    // 真正抓取网页：标题自动填名称 + 图标候选
    async function fetchPageInfo() {
      if (!state.url) { alert("请先填写网址"); return; }
      if (state.fetching) return;
      state.fetching = true;
      rebuild();

      const u = normalizeUrl(state.url);
      const info = await fetchPageInfoViaProxies(u);
      let host = "";
      try { host = new URL(u).hostname; } catch (e) {}

      if (info && (info.icons.length || info.title)) {
        // 标题 → 名称（仅当名称为空或此前是自动填充时覆盖）
        if (info.title && (!state.name || state.nameAuto)) {
          state.name = info.title;
          state.nameAuto = true;
        }
        // 图标候选：网页解析结果 + favicon 服务兜底
        let cands = info.icons.slice();
        if (host) faviconSources(host).forEach((s) => { if (cands.indexOf(s) === -1) cands.push(s); });
        state.fetchedIcons = cands.slice(0, 5);
        state.source = "fetched";
        state.fetchedIdx = 0;
        showToast("已抓取 " + state.fetchedIcons.length + " 个候选图标");
      } else {
        // 代理全部失败：退回 favicon 服务
        if (host) {
          state.fetchedIcons = faviconSources(host).slice(0, 3);
          state.source = "fetched";
          state.fetchedIdx = 0;
          if (!state.name || state.nameAuto) { state.name = nameFromDomain(host); state.nameAuto = true; }
        }
        showToast("网页读取失败，已使用备用图标源");
      }
      state.fetching = false;
      rebuild();
    }

    function resolveIcon() {
      if (state.source === "fetched") {
        return state.fetchedIcons[state.fetchedIdx] || "";
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
      let name = state.name;
      if (!state.url) { alert("请填写网址"); return; }
      const url = normalizeUrl(state.url);
      // 名称未填时，自动从域名推断
      if (!name) {
        try {
          name = nameFromDomain(new URL(url).hostname);
        } catch (e) {
          name = url;
        }
      }
      const icon = resolveIcon();
      if (state.source === "upload" && !icon) {
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
        state.iconText = ""; state.fetchedIcons = []; state.fetchedIdx = 0;
        state.source = "text"; state.nameAuto = true;
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
