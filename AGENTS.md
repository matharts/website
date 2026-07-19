# MathArts 网站开发约定

## 范围与指令优先级

- 本仓库是 `matharts.cn` 的 Astro 静态网站，使用 TypeScript、Astro 组件和原生 CSS。
- Codex 从仓库根目录到当前工作目录逐级读取指令。同一目录存在 `AGENTS.override.md` 时优先于 `AGENTS.md`；越靠近当前工作目录的指令在冲突时优先。
- 只修改当前任务涉及的文件。工作树可能包含未提交改动，不得覆盖、删除、回退或顺带格式化无关内容。

## 工具链

- 使用 `mise.toml` 锁定的 Node.js、pnpm 和 nub 版本；`mise.toml` 是工具版本的单一事实来源。
- 依赖管理仅使用 pnpm，并保留 `pnpm-lock.yaml`；不要改用 npm、Yarn 或 Bun，也不要全局安装项目依赖。
- 常用命令：
  - `pnpm dev`：启动本地开发服务器。
  - `pnpm build`：生成静态站点。
  - `pnpm check`：运行 Astro/TypeScript 检查。
  - `pnpm lint`：运行 oxlint。
  - `pnpm format:check`：检查 oxfmt 格式。
  - `pnpm test:e2e`：对生产构建和预览服务器运行 Playwright。
  - `pnpm verify`：运行完整质量门禁。

## 实现约定

- 保持静态输出，不引入运行时服务器依赖，除非任务明确要求改变部署模型。
- 从 `src/data/seo.ts`、`src/data/site.ts` 和 `src/data/site-discovery.ts` 读取 SEO、站点 URL 和发现协议数据，不要重复硬编码。
- 复用 `src/styles/tokens.css` 中的设计令牌，不要散落重复的颜色、间距和字体值。
- 字体字符集不匹配时，按 `docs/FONTS.md` 更新字体子集。不要手工编辑 `src/assets/fonts/` 中生成的字体、清单或来源记录。
- 使用 `tests/` 中的 Playwright 测试验证生产构建和预览服务器，不要用开发服务器结果替代生产验证。
- 保持语义化 HTML、键盘可访问性、可见焦点、合理的标题层级和准确的替代文本；交互必须在禁用 JavaScript 或减少动态效果时合理降级。
- 避免不必要的客户端 JavaScript、第三方网络请求和大型依赖。新增依赖前说明必要性、体积与维护影响，并获得授权。
- 遵循现有代码和 oxfmt 输出，不对无关文件做格式化重排。

## 验证要求

- 先按变更类型运行以下最小检查，再按风险扩大验证范围：
  - Astro、TypeScript、页面结构或共享数据：`pnpm check`。
  - 代码或样式：`pnpm lint` 和 `pnpm format:check`。
  - 页面内容、标题或其他可见文案：`pnpm fonts:check`。
  - 用户行为、导航、SEO、可访问性或响应式布局：`pnpm test:e2e`；必要时补充或更新 `tests/site.spec.ts`。
- 发布前运行 `pnpm verify`。如果环境、网络或浏览器依赖阻止某项验证，明确报告未执行项和原因，不得把部分通过描述为全部通过。

## 维护要求

- 当代码或配置变更导致本文件中的命令、路径或约定失效时，在同一任务中更新本文件。
- 将重复出现的错误假设或评审反馈写入适用范围最近的 `AGENTS.md`；仅在需要临时替换同目录规则时使用 `AGENTS.override.md`。
- 完成任务后报告修改文件、执行的命令、结果和剩余风险。
