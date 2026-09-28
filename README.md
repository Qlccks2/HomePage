# MyNav · 个人导航起始页

一个纯前端、零后端的个人导航起始页，复刻 iTab 的核心体验：图标导航分组、多引擎搜索、待办清单、可切换壁纸 + 时钟。数据全部存本地（localStorage），支持一键导出/导入 JSON 备份。

## ✨ 功能

- 🗂 **图标导航分组**：分组增删/重命名，图标增删改，支持自定义图标
- 🎨 **iTab 风格添加图标弹窗**：左侧「网址导航 / 自定义图标」双 tab；图标支持自动获取 favicon、文字图标（自定义文字 + 13 种背景色含渐变）、上传本地图片（自动裁剪压缩）；支持「保存并继续」批量添加
- 🔍 **多引擎搜索**：百度 / Google / Bing / 知乎 / B站 / GitHub，一键切换
- 📝 **待办清单**：本地待办，勾选完成、删除
- 🖼 **壁纸 + 时钟**：内置 6 张高清壁纸一键切换，支持添加自定义在线壁纸（粘贴图片直链），实时时间/日期
- 💾 **数据持久化**：localStorage 自动保存；支持导出 / 导入 JSON、恢复默认
- 🕶 **底部工具栏悬停显示**：平时隐藏，鼠标移到页面底部才浮出，界面更清爽

## 🚀 免费部署到 Cloudflare Pages

项目是**纯静态 HTML/JS/CSS**，无需任何构建步骤，零成本部署。

### 方式一：GitHub 上传 + Cloudflare Pages（推荐）

**第 1 步：上传到 GitHub**

1. 在 GitHub 新建一个仓库（如 `mynav`），选择 Public（免费）或 Private。
2. 把本目录的这三个文件推上去：

```bash
git init
git add index.html style.css app.js README.md
git commit -m "init mynav"
git branch -M main
git remote add origin https://github.com/你的用户名/mynav.git
git push -u origin main
```

（也可以直接在 GitHub 网页端「Add file → Upload files」手动上传这三个文件，无需命令行。）

**第 2 步：连接 Cloudflare Pages**

1. 打开 [Cloudflare 控制台](https://dash.cloudflare.com) → 左侧 **Workers & Pages** → **Create** → **Pages**。
2. 选择 **Connect to Git**，授权并选中你刚上传的 `mynav` 仓库。
3. 构建设置全部留空：
   - **Framework preset**：选 `None`
   - **Build command**：留空（不需要构建）
   - **Build output directory**：留空或填 `/`
4. 点击 **Save and Deploy**，约 1 分钟即可部署完成。
5. 你会得到一个 `https://你的项目.pages.dev` 免费域名，即可访问。

### 方式二：直接拖拽上传（更快，免 GitHub）

1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → 选择 **Upload assets**。
2. 把 `index.html`、`style.css`、`app.js` 三个文件一起拖进去。
3. 点击 **Deploy**，立即上线。

## 📁 文件结构

```
├── index.html   页面结构
├── style.css    样式
├── app.js       全部逻辑（数据、渲染、交互）
└── README.md    本说明
```

## 🛠 本地预览

直接用浏览器打开 `index.html` 即可，无需任何依赖或服务器。

## 📤 数据备份

- 鼠标移到页面底部，工具栏会浮出
- 点击 **⬇ 导出** 下载 `mynav-backup-日期.json`
- 换设备/浏览器后点 **⬆ 导入** 选择该文件即可恢复
- 点 **↺ 重置** 恢复默认示例配置
- 点 **🌐 加壁纸** 可粘贴在线图片直链，添加为自己的壁纸

## ⚠️ 说明

- 数据仅存于浏览器 localStorage，清除浏览器数据会丢失，请定期导出备份。
- 内置壁纸使用 Unsplash 外链，需联网加载。
- 图标 favicon 通过 Google 服务抓取，若所在网络无法访问，可手动填写自定义图标地址。

## 📄 License

MIT
