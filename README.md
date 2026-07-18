# MathArts Open Source Website

MathArts 开源组织官网，内容基于 [github.com/matharts](https://github.com/matharts) 的公开组织资料与仓库信息。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173>。

## 设计系统

- Hallmark `Split Studio` 宏结构
- 定制“黑白东方学术系统”主题
- 近白纸、蓝墨黑与中性石墨 OKLCH 色板
- Noto Serif SC + IBM Plex Sans + Noto Sans SC 中西文排印
- N3 Side Rail 桌面导航；移动端粘性折叠菜单；当前章节同步指示
- Ft1 Mast-headed 品牌页脚
- 五档响应式验证：320 / 375 / 414 / 768 / 1280 px
- 原生 HTML / CSS / JavaScript，无构建依赖

## 信息结构

1. 首屏呈现 MathArts 官方定位与品牌主张
2. 组织定位与开放原则
3. 领域引擎、生态基础设施、工具与治理
4. 公开优先、证据优先、最小权限与职责明确的组织治理原则
5. 关注、浏览、讨论与贡献入口

## 文件

- `index.html` — 语义化页面内容
- `styles.css` — Hallmark 页面结构、组件与响应式样式
- `tokens.css` — 定制设计令牌
- `script.js` — 当前章节追踪与 ⌘K / Ctrl+K 无障碍项目检索
- `avatar.png` — MathArts GitHub 组织头像
- `preview.png` — 1280 × 800 桌面预览

## 键盘操作

- `⌘K` / `Ctrl+K`：打开或关闭检索
- `↑` / `↓`：移动当前结果
- `Enter`：打开结果
- `Esc`：关闭检索
