# my-ssh-plug

MySSH 的插件市场仓库,与核心仓库([my-ssh](../my-ssh))独立维护、独立发版。

## 插件列表

| 插件 | id | 版本 | 说明 |
| --- | --- | --- | --- |
| 命令手册 | `command-book` | 1.1.0 | 终端底部命令搜索条:100 条常用 Linux 命令,关键字匹配,点击复制 |

## 目录结构

```text
src/
  plugin-types.ts        # 插件清单接口(与核心 docs/PLUGIN.md 规范一致)
  <plugin-id>/
    index.ts             # definePlugin({...}) 入口
    CommandBar.tsx       # 组件(import react,由宿主 import map 提供)
    data.ts              # 静态数据
    manifest.json        # id / name / version / description / author / defaultEnabled
scripts/build.mjs        # esbuild 打包 + 生成 dist/registry.json(含 sha256)
```

## 构建与发布

```bash
npm install
npm run build      # 产出 dist/<id>/entry.js + dist/registry.json
npm run typecheck  # 类型检查
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

## 插件开发约束(与核心 docs/PLUGIN.md 一致)

- `react` / `react/jsx-runtime` 必须外部化,由 MySSH 运行时通过 import map 提供,
  禁止把 React 打进包(否则 hooks / context 会分裂)
- bundle 是 ESM,入口 `index.ts` 默认导出 `definePlugin({...})` 的清单对象
- 清单字段:`id`(kebab-case 唯一)、`name`、`version`(semver)、`description`、
  `author`、`defaultEnabled`
- 需要落盘的缓存 / 数据,通过核心 IPC 写入 `userData/plugins/<id>/`(核心设置页
  自动统计占用并可清理 / 卸载)
