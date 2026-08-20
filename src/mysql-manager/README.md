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

### 1. 启动代理服务

```bash
cd src/mysql-manager/proxy
npm install
npm start
```

代理服务默认运行在 `ws://localhost:3000`

### 2. 安装插件

在MySSH设置中添加插件市场地址：
```
https://chengyunlai.github.io/my-ssh-plug/registry.json
```

然后在插件市场中安装 "MySQL 管理器" 插件。

### 3. 配置代理地址（可选）

如果代理服务运行在其他地址，需要设置环境变量：

```bash
export MYSQL_PROXY_URL=ws://your-proxy-host:3000
```

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
| `PORT` | 3000 | WebSocket服务端口 |
| `ALLOWED_ORIGINS` | `*` | 允许的来源（逗号分隔） |

### 安全建议

1. **限制来源**: 生产环境建议设置 `ALLOWED_ORIGINS` 为具体域名
2. **使用HTTPS**: 建议通过HTTPS/WSS协议传输
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

- 检查代理服务是否运行: `curl http://localhost:3000`
- 检查MySQL服务器是否可达
- 检查防火墙设置

### 查询无响应

- 检查代理服务日志
- 确认MySQL用户有执行权限
- 检查查询语法是否正确

## License

MIT