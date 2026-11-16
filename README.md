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

源码按用途归档，构建后仍保留原来的网页地址和资源路径。游戏中心保留经典游戏及新版 212 款游戏中心的独立入口。`cookies` 和游戏实现不因归档而改动。

推送到 `main` 后，GitHub Actions 构建并检查网站，只部署 `dist/` 中的公开内容，文档和构建工具不会一起上传到网站。

详细说明：[目录与维护](docs/structure.md) · [安全说明](SECURITY.md)
