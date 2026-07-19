# 议题跟踪器：GitHub

本仓库的议题和 PRD 记录在 GitHub Issues 中。所有操作均使用 `gh` CLI。

## 约定

- **创建议题**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取议题**：`gh issue view <number> --comments`；使用 `jq` 筛选评论时，同时获取标签。
- **列出议题**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，并按需添加 `--label` 和 `--state` 筛选条件。
- **评论议题**：`gh issue comment <number> --body "..."`
- **添加或移除标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭议题**：`gh issue close <number> --comment "..."`

通过 `git remote -v` 推断仓库；在克隆仓库内运行时，`gh` 会自动完成推断。

## 将拉取请求作为 triage 入口

**PRs as a request surface: no（不将 PR 作为请求入口）。** _（如果本仓库将外部 PR 视为功能请求，可改为 `yes`；`/triage` 会读取此标志。）_

设置为 `yes` 后，PR 使用与议题相同的标签和状态流转，并改用对应的 `gh pr` 命令：

- **读取 PR**：`gh pr view <number> --comments`，并使用 `gh pr diff <number>` 查看差异。
- **列出待 triage 的外部 PR**：运行 `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，只保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的 PR，排除 `OWNER`、`MEMBER` 和 `COLLABORATOR`。
- **评论、添加标签或关闭**：使用 `gh pr comment`、`gh pr edit --add-label` / `--remove-label` 和 `gh pr close`。

GitHub 的议题与 PR 共用同一编号空间，因此单独的 `#42` 可能指向其中任意一种对象；先运行 `gh pr view 42`，失败后再运行 `gh issue view 42`。

## 当 Skill 要求“publish to the issue tracker（发布到议题跟踪器）”时

创建一个 GitHub Issue。

## 当 Skill 要求“fetch the relevant ticket（获取相关任务单）”时

运行 `gh issue view <number> --comments`。

## Wayfinding 操作

供 `/wayfinder` 使用。**地图（map）**是一个单独的议题，**子议题（child）**是具体任务单。

- **地图**：一个带有 `wayfinder:map` 标签的议题，其正文维护 Notes / Decisions-so-far / Fog。使用 `gh issue create --label wayfinder:map` 创建。
- **子任务单**：通过 GitHub 子议题关联到地图（使用 `gh api` 调用 sub-issues 端点）。如果仓库未启用子议题，则将子任务添加到地图正文的任务列表，并在子任务正文顶部写入 `Part of #<map>`。标签使用 `wayfinder:<type>`，其中类型为 `research`、`prototype`、`grilling` 或 `task`。任务被领取后，将其分配给负责推进的开发者。
- **阻塞关系**：GitHub 原生 issue dependencies 是规范且在界面中可见的表达方式。使用 `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>` 添加依赖边，其中 `<blocker-db-id>` 是阻塞议题的数字数据库 ID，可通过 `gh api repos/<owner>/<repo>/issues/<n> --jq .id` 获取；它不是 `#number` 或 `node_id`。GitHub 通过 `issue_dependencies_summary.blocked_by` 报告尚未关闭的阻塞项，这是实时放行条件。如果依赖功能不可用，则在子任务正文顶部使用 `Blocked by: #<n>, #<n>`。所有阻塞议题关闭后，任务才算解除阻塞。
- **前沿查询**：列出地图中尚未关闭的子任务（运行 `gh issue list --state open`，并限定在地图的子议题或任务列表内），排除仍有未关闭阻塞项（`issue_dependencies_summary.blocked_by > 0`，或 `Blocked by` 行引用了未关闭议题）或已有受理人的任务；按地图中的顺序选择第一个候选项。
- **领取**：运行 `gh issue edit <n> --add-assignee @me`；这是会话中的第一次写操作。
- **解决**：运行 `gh issue comment <n> --body "<answer>"`，再运行 `gh issue close <n>`，最后在地图的 Decisions-so-far 中追加上下文指针（gist 及其链接）。
