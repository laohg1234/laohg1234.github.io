# FlavorStudio · 黄瓜 LaHG

个人主页、黄瓜味工作室、软件与游戏中心，以及赞助中心的静态网站。

访问：**https://flavor.5yu.fun/**

## 本地使用

需要 Node.js 22 或更新版本，无需安装第三方依赖。

```sh
npm run check  # 构建并检查必要页面、素材和部署范围
npm start      # 构建并在 http://127.0.0.1:8080 预览
```

只构建可运行 `npm run build`，生成的 `dist/` 不提交到仓库。

## 修改网站

- 页面：`site/pages/`；样式：`site/styles/`；脚本：`site/scripts/`。
- 图片：`site/images/`；地图介绍素材：`site/assets/about/`。
- 网站版本：只修改 `site/data/version.json`，首页的版本按钮会读取它。
- 独立应用：`site/apps/`；旧游戏素材：`site/legacy-assets/`。

源码按用途归档，构建后仍保留原来的网页地址和资源路径。游戏中心保留六款经典游戏，并通过 `/play/` 进入 FlavorWebGames 4.0 的 **30 款游戏**。独立游戏中心包括动作、解谜、物理与策略玩法；封面取自实际游戏画面。`cookies` 和原有经典游戏继续保留各自实现。

更新独立游戏中心时，同步 `site/apps/play/` 的运行脚本、`games.json` 与封面。`npm run check` 会核对当前 30 个唯一游戏编号、八个游戏源文件、目录与运行时元数据，以及与目录完全对应的 30 张 WebP 封面，避免旧版条目或封面混入发布内容。

推送到 `main` 后，GitHub Actions 构建并检查网站，只部署 `dist/` 中的公开内容，文档和构建工具不会一起上传到网站。

详细说明：[目录与维护](docs/structure.md) · [安全说明](SECURITY.md)
