# 仓库结构与维护

网站源文件按用途放在 `site/`，部署时由 `site.config.json` 映射到原来的网址。源码位置和对外网址分别管理，因此整理目录后，原页面地址、游戏入口、图片链接与下载地址继续使用。

## 目录

| 位置 | 内容 | 部署位置 |
| --- | --- | --- |
| `site/pages/` | 首页、工作室、赞助、管理、404 及原有页面 | 网站根目录，保留原 HTML 文件名 |
| `site/styles/` | 页面与原有游戏的 CSS | 网站根目录，保留原 CSS 文件名 |
| `site/scripts/` | 页面交互、原有游戏脚本与第三方运行库 | 网站根目录，保留原 JS 文件名 |
| `site/images/` | 头像、品牌、二维码、游戏贴图与光标 | 网站根目录，保留原文件名 |
| `site/media/` | 视频等媒体 | 网站根目录，例如 `/cookies.mp4` |
| `site/downloads/` | 可供下载的项目文件 | 网站根目录，保留原下载文件名 |
| `site/data/` | 独立版本信息及网站数据 | 网站根目录，例如 `/version.json` |
| `site/assets/` | 按项目组织的素材 | `/assets/` |
| `site/game-covers/` | 原游戏中心的封面 | `/game/` |
| `site/apps/play/` | 212 款游戏的新游戏中心及完整运行资源 | `/play/` |
| `site/apps/flaudioviz/` | FLAudioViz 及完整运行资源 | `/flaudioviz/` |
| `site/legacy-assets/chromium/` | 原冲浪游戏的 Chromium 辅助资源 | `/resources/` |
| `site/legacy-assets/eatkun/` | 原游戏所需的图片、音频与脚本 | `/static/` |
| `scripts/` | 构建、检查与本地预览工具 | 不部署 |
| `docs/` | 仓库维护说明 | 不部署 |
| `dist/` | 构建后的静态网站 | 由部署流程上传，不提交到 Git |

原有游戏继续保留各自的实现。此次整理以文件归类和部署映射为主，不把不同游戏的样式、脚本或键盘事件合并。`114514` 页面及无内容的测试占位文件已移除，不再生成对应页面。

## 本地构建与预览

使用仓库要求的 Node.js 版本，在仓库根目录运行以下命令。工具仅使用 Node.js 内置模块，无需安装第三方依赖。

```sh
npm run build
npm run check
npm start
```

- `npm run build` 根据 `site.config.json` 生成 `dist/`。
- `npm run check` 检查源码、配置及生成结果。
- `npm start` 启动本地网站预览；访问地址以终端输出为准。

GitHub Pages 使用同一套构建结果进行部署，不再直接发布整个源码仓库。仓库说明、构建脚本及其他维护文件不会混入网站发布目录。

## 修改内容

修改页面时，在 `site/pages/` 找到对应文件；样式、脚本和素材分别在上表列出的目录中。源文件保留原来的运行资源地址，由构建映射确保部署后仍位于这些地址。

更新个人主页版本号时，只需修改：

```text
site/data/version.json
```

无需把版本号写进首页正文。页面查询按钮会读取部署后的 `/version.json`。

新增网页或资源，优先放入已有的挂载目录。自包含应用可以放在 `site/apps/`，并在 `site.config.json` 中明确配置对外路径。新增挂载后运行构建和检查，再验证页面实际访问与相对资源加载。

不要直接编辑 `dist/`：下一次构建会重新生成它。对外路径一旦使用，应保持稳定；确需修改路径时，应同时处理页面引用和旧链接兼容。
