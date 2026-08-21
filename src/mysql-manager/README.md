# MySQL 管理器插件

MySSH的MySQL数据库管理工具，提供类似Navicat的功能。

## 功能特性

- 📊 **连接管理**: 支持保存多个MySQL连接配置
- 🗄️ **数据库浏览**: 查看所有数据库和表结构
- 📝 **SQL编辑器**: 支持语法高亮和自动补全
- 🔄 **查询执行**: 支持执行任意SQL查询
- 📋 **结果展示**: 表格形式展示查询结果，支持排序和分页
- 📤 **数据导出**: 支持导出CSV格式

## 架构说明

由于浏览器安全限制，插件无法直接连接MySQL服务器。采用WebSocket代理架构：

```
MySSH插件 (浏览器) <--WebSocket--> 代理服务 <--TCP--> MySQL服务器
```

## 安装步骤

### 1. 安装并启用插件

MySQL Manager `1.1.0` 声明了 MySSH `1.3.0+` 的官方 Companion Runtime。正常使用时，
插件首次连接数据库会由 MySSH 自动校验并启动内置代理，自动分配本机端口和临时 token，
不需要用户手动运行 Node 服务。

### 2. 手动代理回退（开发 / 远程部署）

```bash
cd src/mysql-manager/proxy
npm install
npm start
```

代理服务默认只监听本机 `ws://127.0.0.1:3000`。在连接表单中填写「代理地址」后，插件会优先使用该地址；远程代理请使用
`wss://` 并在服务端启用访问 token。

### 3. 安装插件

在MySSH设置中添加插件市场地址：
```
https://chengyunlai.github.io/my-ssh-plug/registry.json
```

然后在插件市场中安装 "MySQL 管理器" 插件。

### 4. 配置代理地址（可选）

如果代理服务运行在其他地址，在连接表单中填写「代理地址」，例如
`wss://db-proxy.example.com:3000?token=change-me`。显式填写的地址始终优先；新建连接留空时使用
MySSH Companion Runtime，未接入宿主 runtime 的旧插件才回退到本机默认地址。

## 使用方法

1. **创建连接**: 点击"新建连接"，填写MySQL服务器信息
2. **连接服务器**: 点击"连接"按钮
3. **选择数据库**: 在左侧树形菜单中点击数据库名称
4. **执行查询**: 在SQL编辑器中输入查询语句，按Ctrl+Enter执行
5. **查看结果**: 查询结果显示在下方表格中

## 配置选项

### 代理服务环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `MYSSH_RUNTIME_HOST` | `127.0.0.1` | MySSH Companion Runtime 注入的监听地址，不建议手动覆盖 |
| `MYSSH_RUNTIME_PORT` | 0 | MySSH Companion Runtime 使用动态端口 |
| `HOST` | `127.0.0.1` | 手动代理监听地址；非回环地址需要同时配置 token 与明确来源 |
| `PORT` | 3000 | 手动代理 WebSocket 服务端口 |
| `ALLOWED_ORIGINS` | `null,myssh-plugin://mysql-manager` | 精确匹配的来源列表（逗号分隔），禁止 `*` |
| `ACCESS_TOKEN` | 无 | 非回环监听必填；客户端在代理 URL 的 `token` 查询参数中携带 |

### 安全建议

1. **限制来源**: 远程部署必须设置 `ALLOWED_ORIGINS` 为完整来源（例如 `https://app.example.com`），服务端会精确匹配
2. **使用HTTPS**: 远程部署建议通过HTTPS/WSS协议传输，并设置随机 `ACCESS_TOKEN`
3. **密码安全**: 连接密码仅存储在本地浏览器，不会上传到任何服务器

## 开发说明

### 目录结构

```
mysql-manager/
├── index.ts              # 插件入口
├── MySqlManager.tsx      # 主组件
├── ConnectionManager.tsx  # 连接管理组件
├── SchemaTree.tsx        # 数据库结构树
├── SqlEditor.tsx         # SQL编辑器
├── ResultTable.tsx       # 结果表格
├── mysql-client.ts       # WebSocket客户端
├── styles.css            # 样式文件
├── manifest.json         # 插件清单
└── proxy/                # 代理服务
    ├── server.js         # WebSocket服务器
    └── package.json      # 依赖配置
```

### 本地开发

1. 启动代理服务:
```bash
cd proxy
npm run dev
```

2. 构建插件:
```bash
cd ../../..
npm run build
```

3. 在MySSH中加载本地插件进行测试

## 故障排除

### 连接失败

- 检查代理服务是否运行: `curl http://127.0.0.1:3000`
- 检查MySQL服务器是否可达
- 检查防火墙设置

### 查询无响应

- 检查代理服务日志
- 确认MySQL用户有执行权限
- 检查查询语法是否正确

## License

MIT
