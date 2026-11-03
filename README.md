# blog
个人博客，使用 Jekyll 构建为纯静态 HTML，发布到 GitHub Pages。

## 中英文版本

- 中文首页：`/`，文章继续放在 `_posts/`，原网址不变。
- 英文首页：`/en/`，英文正文放在 `_translations/`。
- 首页和文章页右上角的 `中 / EN` 可以切换语言，切换文章时仍留在同一篇。
- 首次进入中文首页时参考浏览器语言；手动选择后记住偏好。直接打开文章或英文网址不会强制跳走。
- 不需要在线翻译服务、API Key 或后端。两种语言在构建时生成。
- 原有中文文章和 Java/XML 示例代码保留原样；英文正文对应原文内容，不额外插入技术修订或历史说明。截图也保留原图。

## 写文章

中文写作方式不变，新建 `_posts/YYYY-MM-DD-文章名.md`：

```yaml
---
layout: post
title: "文章标题"
date: 2026-11-02 10:00:00 +0800
tags: [AI]
cover: /assets/images/example.png
excerpt: "首页卡片上的中文简介。"
---
```

在头部之后写 Markdown 正文。图片仍放在 `assets/images/`。

英文版新建 `_translations/example.md`：

```yaml
---
title: "English article title"
translation_of: "2026-11-02-文章名"
excerpt: "An English introduction for the article card."
---
```

头部之后写英文正文，生成网址为 `/en/example/`。`translation_of` 必须和中文文件名一致（去掉 `.md`）；日期、标签和封面自动继承，不会增加首页的文章计数。

英文正文中的站内图片请写 `/assets/images/example.png`，避免相对路径在 `/en/` 下失效。已有截图保留原图，截图内的文字不会自动翻译。

只写中文也能构建：英文首页会把尚无译文的文章标为 `中文`，文章页的 EN 暂不可用，不会伪装成英文正文。补上译文后自动启用。

修改界面文案使用 `_data/i18n.yml`；技能配置在 `_data/skills.yml`，`description` 是英文，`description_zh` 是中文。

### 旧图片外链

2015 年旧文使用的图床 `7te9zv.com1.z0.glb.clouddn.com` 有 5 个图片地址已失效：`images.png`、`mongo.png`、`mongorep2.png`、`45C491F2-E299-4DFA-A69E-9A7B480808F5.png` 和 `QQ20150307-1@2x-1024x333.png`。它们分别涉及旧文章封面和 MongoDB 正文配图，仓库中没有找到原文件；目前保留原引用，拿到原图后再迁入 `assets/images/`。

## 预览与检查

```bash
bundle exec jekyll serve --host 127.0.0.1 --port 4010
```

访问 `http://127.0.0.1:4010/` 或 `http://127.0.0.1:4010/en/`。另开一个终端运行检查：

```bash
bundle exec ruby tests/bilingual_test.rb
```

检查覆盖文章配对、代码示例和图片一致性、译文链接及未发布文章的处理。浏览器回归脚本在 `tests/bilingual-browser.cjs`，需本地安装 Playwright 和 Chrome 后运行。

## 构建与发布

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

构建结果仍在 `target/`，包含中英文首页和文章，完整同步到 `gh-pages` 即可。源码（包括 `_plugins/`、`_translations/`、`_data/`）提交到 `master`。

注意：仅推送 `master` 不会发布被忽略的 `target/`；`gh-pages` 应提交构建后的静态文件，并保留 `.nojekyll`，不要在 GitHub 上再次运行 Jekyll。
