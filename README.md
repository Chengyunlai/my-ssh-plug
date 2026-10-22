<p align="center">
  <img src="docs/logo/myssh-icon-256.png" width="120" height="120" alt="MySSH" />
</p>

<h1 align="center">my-ssh-plug</h1>

MySSH 的插件市场仓库,与核心仓库([my-ssh](../my-ssh))独立维护、独立发版。

## 插件列表

| 插件 | id | 版本 | 分类 | 兼容 | 官方 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| MySQL 管理器 | `mysql-manager` | 1.3.0 | 效率工具 | MySSH ≥ 1.3.0；K8s 需新版宿主 | ✅ | MySQL 库表/SQL 与可选 Kubernetes 来源 |
| 命令手册 | `command-book` | 1.2.0 | 终端增强 | MySSH ≥ 0.1.0 | ✅ | 终端底部命令搜索条:100 条常用 Linux 命令,关键字匹配,点击复制 |
| WSL 终端 | `wsl-terminal` | 1.1.0 | 终端增强 | MySSH ≥ 0.1.0 | ✅ | 在 MySSH 中打开本地 WSL/Ubuntu 终端(仅 Windows) |
| 服务器监控 | `server-monitor` | 0.2.0 | 监控 | MySSH ≥ 1.3.2 | ✅ | 当前 SSH 会话的 CPU、内存、磁盘、网络与运行时间可视化监控 |

## 目录结构

```text
src/
  plugin-types.ts        # 插件清单接口(与核心 docs/PLUGIN.md 规范一致)
  <plugin-id>/
    index.ts             # definePlugin({...}) 入口
    CommandBar.tsx       # 组件(import react,由宿主 import map 提供)
    data.ts              # 静态数据
    manifest.json        # id / name / version / description / author / category / minAppVersion / maxAppVersion / defaultEnabled
official.json            # 官方白名单:构建时对白名单插件盖章 official: true
scripts/
  build.mjs              # esbuild 打包 + 生成 dist/registry.json(含 sha256 + 治理字段盖章)
  test.mjs               # 发布前自动检查(node --test)
```

## 构建与发布

```bash
npm install
npm run build      # 产出 dist/<id>/entry.js + dist/registry.json
npm run typecheck  # 类型检查
npm test           # 发布前自动检查(清单字段 / 白名单 / 命令库数据)
```

产物结构:

```text
dist/
  registry.json                  # 市场清单:插件元数据 + entry 相对路径 + sha256
  <id>/
    entry.js                     # 插件 ESM bundle(react 外部化)
    entry.js.map
```

把 `dist/` 部署到任意静态地址(如 GitHub Pages / release asset),把
`registry.json` 的 URL 填进 MySSH 设置 →「插件市场」即可安装 / 更新。

### GitHub Pages 自动部署

本仓库已配置 [`.github/workflows/pages.yml`](.github/workflows/pages.yml):
push 到 `main` 后自动 `npm run build` 并把 `dist/` 部署到
`https://chengyunlai.github.io/my-ssh-plug/`。

在 MySSH 设置 →「插件市场」填入:

```text
https://chengyunlai.github.io/my-ssh-plug/registry.json
```

发布新版本流程:修改插件 → 升 `version` → `npm run build` 确认产物 → push 到
`main`(自动部署)→ 客户端点「更新」。

## 插件开发约束(与核心 docs/PLUGIN.md 一致)

- `react` / `react/jsx-runtime` 必须外部化,由 MySSH 运行时通过 import map 提供,
  禁止把 React 打进包(否则 hooks / context 会分裂)
- bundle 是 ESM,入口 `index.ts` 默认导出 `definePlugin({...})` 的清单对象
- 面板可声明宿主布局级别:`standard`(普通表单/列表,缺省值)或 `workspace`(重型内部工作台)。
  `workspace` 仅允许在 MySSH 分配的插件内容区内组织内部侧栏/工具栏/标签页,不能覆盖核心
  顶栏、服务器侧栏或状态栏；当前重型 `mysql-manager` 使用 `scope: "app"` + `layout: "workspace"`
- 面板样式必须以插件根类为作用域,优先使用 MySSH 注入的 `--myssh-plugin-*` 语义 Token；禁止
  `position: fixed`、修改 `body/#root`、全局选择器和 `transition: all`
- 清单字段:`id`(kebab-case 唯一)、`name`、`version`(semver)、`description`、
  `author`、`category`(官方分类表:`terminal` / `files` / `tool` / `monitor` /
  `integration` / `other`)、`minAppVersion` / `maxAppVersion`(兼容 MySSH 版本区间,
  semver)、`defaultEnabled`
- **官方标记是盖章字段**:插件自身声明 `official` 无效;只有 `official.json`
  白名单内的插件,构建脚本才会在 `registry.json` 里盖 `official: true`。
  MySSH 核心安装时再把该标记写入 manifest,并在界面显示「官方」徽章
- **自动化测试**:PR / push 触发 CI(`.github/workflows/ci.yml`),必须通过
  `typecheck` + `test` + `build` 才允许合并;接入冒烟测试与兼容矩阵要求见核心
  仓库 `docs/PLUGIN.md` §5
- 需要落盘的缓存 / 数据,通过核心 IPC 写入 `userData/plugins/<id>/`(核心设置页
  自动统计占用并可清理 / 卸载)

## MySSH 1.5.0+ 终端入口

四个官方插件均提供 `tui-declarative-v1` JSON：命令手册（1.2.0）、MySQL 管理器（1.2.0）、
服务器监控（0.2.0）、WSL（1.1.0，仅 Windows）。现有 React ESM 入口与 Companion Runtime 继续供桌面使用。

`manifest.json.tui` 声明 source/entry/minAppVersion，构建生成 `dist/<id>/terminal.json`，
registry 单独写入 `tui.sha256`。命令手册从原 data.ts 生成，没有第二份命令清单。
终端描述只能声明 commands/monitor/mysql/wsl；由 MySSH 终端宿主提供交互，不包含可执行 JS。

TUI：插件 → 插件市场 → 安装 → 启用 → 打开。旧 MySSH 1.4.0 不识别这些入口。
MySQL 终端界面由 MySSH Node Core 直接连接数据库，不启动 WebSocket 代理；
连接与历史使用主密码加密 vault，独立于桌面存储。WSL 终端读取系统实际列表；桌面旧 WSL 页面仍是模拟界面。

关联主仓库 [Issue #32](https://github.com/Chengyunlai/my-ssh/issues/32)。终端 JSON 的 sha256 与 React entry/runtime hash 分别校验，
不修改旧桌面兼容区间。发布仍需本仓库 CI、生成的资源合同与 Pages 部署完成。
