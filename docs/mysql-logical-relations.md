# MySQL 逻辑关系：设计与验证

## Brief

数据库使用者希望在不创建物理外键的情况下，从列注释中的 `@ref` 理解关联，并安全地进入查询。范围是读取、校验、关系图、注释详情和生成 JOIN；非目标是自动修改注释、推断基数、数据完整性检查、SQL 历史挖掘和数据库写入。

## 设计

复用 MySQL 工作台的字体、深色 surface 与蓝色选中态；使用已有 SVG 图标体系，不使用 Unicode 充当图标。数据库树增加「逻辑关系」，打开独立工作区 tab。关系视图聚焦图与详情，隐藏内部连接侧栏；切回数据恢复。无装饰动画，鼠标/键盘即时选择。

信息层次：只读来源与标题 → 声明/表/校验数、筛选和缩放 → 按引用依赖分列的表卡片与曲线 → 可滚动声明列表和原始注释详情。图上显示关联字段与主键，避免几十个普通字段挤压主任务。选中连线与两端字段同时高亮。无声明、查询中、失败可重试、无匹配、无效注释、目标缺失分别表达。

## 实现与边界

`relations.ts` 拥有元数据归一化、解析、结构校验、布局与 SQL 生成，保持可独立测试。`RelationsView.tsx` 只使用既有 `mysqlClient.query`；没有新 IPC 或依赖。通过当前账号可见的字段判定目标存在，不能区分权限不足与对象不存在；不宣称校验业务一致性。单字段引用没有复合键语义。跨库引用列入未校验，不自动申请更多权限。

基线：插件分支 main，17f872caa131041022e7f7d8540664ea0e959bf1；主仓库 master，d241be4425d4dc04c93d655faaa0dab40f24f08d。工作区有其他未提交改动，本功能未提交、未推送、未发布。

## QA

- TypeScript 检查通过；插件 27 项测试通过，其中新增 4 项关系解析/转义/布局/类型差异测试。
- 本地已有数据库的 5 条声明全部解析并找到目标，涉及 6 张表；5 条生成 JOIN 均通过 EXPLAIN。仅查询元数据与执行计划，未执行迁移或修改数据。
- Electron 本地预览：发现 5 条/6 表，选择声明生成正确 JOIN，打开查询仅填入 SQL、不自动执行。图与列表选中联动、字段筛选、无匹配状态、缩放/适应画布均已实测。最终预览会隐藏插件内部侧栏，生成查询时恢复；已有 SSH 会话保持连接。
- 窄视口调整未取得有效尺寸变化证据，暂不记为通过；尚未在其他操作系统、触控和读屏环境验证。语法错误/缺失目标/跨库状态有逻辑测试，未在真实数据库创建故障对象。

## UI 自查

| Before | After | Why |
| --- | --- | --- |
| 表结构不能表达注释关联 | 数据库级关系图与原始注释详情 | 让声明、校验和查询连成一条任务路径 |
| 关系图挤在数据侧栏旁 | 聚焦模式隐藏插件内部侧栏 | 保留 MySSH 宿主布局，给字段和连线足够空间 |
| 未确认的连线容易被理解为外键 | 明示注释来源、引用方向与结构校验边界 | 不把逻辑声明当作数据库约束或基数证据 |
| 新界面容易散落配色和间距 | 复用宿主语义色、spacing/radius token；无装饰动画 | 保持主题一致与即时反馈 |

- 主仓库 `make check` 通过；插件 `npm run typecheck`、`npm test`（27 项）与 `npm run build` 通过；`git diff --check` 无问题。
- 本地预览通过插件市场热更新加载；原线上市场地址已恢复。仅安装本地预览，未发布远端版本。

## 表与字段 COMMENT 显示

读取元数据时按库名/表名 LEFT JOIN `information_schema.TABLES`，保留原注释和纯业务说明两个层次。表名仍为可打开数据的技术标识，表注释显示为卡片次级文字；字段名/类型保留原位置，业务说明置于下一行。长注释单行省略并提供全文 title；详情区按引用端/目标端展示完整注释，原始字段注释含 @ref 单独折叠。未填写注释不生成多余空行，不把注释当 HTML 执行。

显示注释默认开启，可一键切回紧凑模式。纯布局函数为每个字段计算实际行高与连线锚点，防止注释撑高后引用线错位。筛选包含两端表/字段业务注释。

新增 2 项测试覆盖注释归一化、保留原文、中文搜索和显示切换后的锚点。插件共 29 项测试通过；类型检查、构建与主仓库 make check 通过。本地元数据验证：6 张关联表均取得 COMMENT，11 个图中字段取得业务说明，5 条关联仍校验通过。

本次 Electron 验收：6 张表/11 个字段的注释在卡片出现；隐藏/显示注释能切换紧凑布局；按中文表注释「资源登记」筛出一条对应关系；清除筛选恢复 5 条。详情两端展示完整说明，展开原始注释后仍能看到 @ref。原市场地址恢复，SSH 会话仍连接。

## 画布平移与手势缩放

将滚动容器改为统一的 camera（位移与比例）：空白处、卡片非按钮区域左键拖动，中键拖动；双指滚动平移，触控板捏合通过 Chromium 的 ctrl+wheel 缩放，另支持 Ctrl/Cmd+滚轮。缩放以手势位置为中心，限制在 20%–300%；工具栏保留缩放和适应全图。画布聚焦后方向键平移、Home 适应全图，按住空格可从控件区域开始拖动。原生 wheel listener 使用 passive:false，阻止页面整体缩放；pointer capture 保证拖出视口后仍能完成拖动。

新增 `relation-camera.ts` 纯逻辑与 `useRelationCamera.ts` 交互适配。3 项回归测试覆盖缩放锚点、上下限、双指滚动与捏合的事件区别及适应画布，总计 32 项测试通过；插件类型检查、构建和主仓库 `make check` 通过。Electron 本地预览 1.3.4 已热更新，实测缩放按钮由 47% 到 68%、拖动后节点平移且比例保持；SSH 会话未中断，线上市场地址已恢复。自动化工具不能发送真实触控板捏合，实际双指捏合尚待用户设备验证；不宣称已验证触摸屏操作。

## SQL 注释协议 v1：表级组合声明

本节更新前文「单字段引用没有复合键语义」的实现边界。以 Mozi 的 `docs/architecture/logical-data-relations.md` 为协议来源，继续兼容字段 `@ref`，从表 COMMENT 读取 `@relation((a,b)->target(x,y))`。有序字段组保存在同一关系的 pairs 中，至少两列、数量相同、两端各自无重复，ASCII 普通标识符且限当前库。平衡括号提取后整段校验，不支持的表达式、库名前缀、引号、残缺语法均报告诊断；任一两端字段缺失使整条关系无法生成查询。多条声明按两端有序字段组去重。

图中每对字段有连线，选中任一连线同时选中整条组合声明及全部配对字段；列表仍是一项，详情标注「组合声明 · 全部条件 AND」。中文表与字段说明使用原有布局，完整合法机器声明从摘要移除，原始表/字段 COMMENT 保留在折叠详情。普通跨模块中文映射仅展示，不生成 Mozi 与 Harness JOIN，不按同名 scope_hash 推断关系。本轮不展示组合唯一性或关系基数，不用 COLUMN_KEY 推测唯一索引。

修改范围为 `relations.ts`、`RelationsView.tsx`、`scripts/relations.test.mjs` 与本说明/插件 README；保留 camera 与其他既有工作区改动。新增 5 项回归测试（总计 37 项）覆盖有序 AND、原子关系/布局、重复与空白、多声明、非法语法、缺失任一字段、类型差异和纯中文映射不生成关系；`npm run typecheck`、`npm test`、`npm run build` 与主仓库 `make check` 均通过，`git diff --check` 通过。

Electron 本地预览实测：读取当前库 7 条声明（5 条字段引用、2 条组合引用），6 张关联表；两条组合声明均显示两端有序字段组与中文说明。分别打开 content_turns 和 cleanup_jobs JOIN 草稿，编辑器均包含完整 ON 与 AND，未自动执行，未修改数据库。原插件市场地址已恢复，宿主 SSH 会话保持连接；本地热更新最终预览 1.3.6，未发布、未提交。协议中的 Harness 表级组合声明尚未写入当前库，不把当前未显示视为解析失败；缺失/错误状态通过纯逻辑测试，未为验证而修改真实库注释。实际业务关系、数据完整性、生命周期和唯一性未作认证。

## 自动布局整理

新增纯逻辑 `relation-layout.ts`：对表依赖图先做 Tarjan 强连通分量归并，按缩点后的 DAG 从来源到目标分层；用六轮重心排序降低交叉，再用八轮关联卡片中心对齐与碰撞投影保持同层至少 56px 间隔。直接叶子表靠近其来源，不再将所有无后继表挤到最右层；层间距固定 380px，组合引用在布局中按表对去重，字段锚点仍由原有行高计算。该算法是启发式，不保证交叉数全局最少，同层循环连线仍沿用原有曲线路由。

新增两项测试覆盖依赖层级、直接叶子位置、无重叠与完整画布边界，以及循环归层和输入关系顺序变化后的确定性。插件共 39 项测试通过；类型检查与构建通过。此次不改变关系协议、查询草稿、注释或 camera 交互，未引入依赖。

图面验收发现跨层连线可能穿过中间卡片，因此进一步为跨两层以上的连线预留上方通道，以折线经过层间空隙绕行；相邻层继续使用字段锚点曲线。当前 6 表布局中 resources 已移到 links 相邻层，卡片按层对齐且无重叠。最终本地热更新预览 1.3.8，原市场地址已恢复，主仓库 make check 通过，未提交或发布。

### 连线重叠修复

将固定 gutter 坐标与循环复用的上方 lane 替换为 `relation-routing.ts` 的独立分配：每条跨层字段连线有唯一水平 lane，两端竖线在所在层间隙内分别占用来源侧/目标侧半区，不共用竖向通道；同一字段的多个连接点在行中心上下 6px 内扇形展开，相邻曲线也使用错开的端点。预留通道高度随字段配对数增加，避免大量 lane 进入卡片区域。按关系 id 稳定排序，反转输入顺序不改变路径。仍允许点状交叉，不宣称对任意稠密图全局无交叉。

新增两项测试覆盖 12 条并行长线的独立端口、竖线与水平通道、固定 gutter 范围与确定性，以及相邻字段扇出；共 41 项测试通过，类型检查、构建与主仓库 make check 通过。本地预览 1.3.9 已热更新，原市场地址恢复。修改 `relation-routing.ts`、`RelationsView.tsx`、`relations.ts`、测试入口和回归测试；保留已有布局与其他改动，未提交或发布。

## SDK v8 注释 SQL 离线兼容核对（迁移前）

2026-10-22，只读 `/Users/cyrus/work/ys/mozi-harness-sdk-main/mozi_harness_mysql/schema_v8_comments.sql`（SHA-256 `47d66d26777968d70bb29ec0072e2ea40fac2817044772009c02a883eaf97238`），以同仓库 `schema.py` 的 `_TABLE_SHAPES` 构造临时离线元数据夹具，再运行当前插件的真实 `buildRelations`、`relationJoinSql`、`commentDescription` 与 `layoutRelations`。未连接/修改运行数据库，未读取凭据，未重启或热更新宿主。

离线结果：5 条 Harness 组合声明全部解析，无诊断和类型差异，涉及 7 张关联表；每条保留两对有序字段，生成 JOIN 含完整 ON 与 AND，摘要移除机器声明。卡片坐标有限、无重叠且位于画布边界内；recovery_waits 只引用 recovery_runs，owner 域声明不因同名 scope_hash 自动连接 recovery 域。无关联的 recovery_schema、conversation_deletions 未进入关系图。现有解析无需兼容修复，无新功能或发布。

待 Mozi 显式完成 v8 运行库迁移后，再刷新用户现有连接，实测预期 12 条声明（5 字段 + 7 表级）与 13 张表，验收中文说明、完整 AND 查询草稿与实际图面。这里的 12/13 是迁移后预期，不能当作当前库实测结果；上次运行库实测仍为 7 条/6 表。本轮离线核对不能证明数据一致性、唯一性或业务关联成立。未来 13 表的实际视觉效果尚待运行库迁移后验收。

## SDK v8 运行库联合验收（已完成）

2026-10-22，在当前 MySSH 已连接的 mozi-local / mozi_local_test 上点击「刷新结构」。插件实际显示 **12 条声明、13 张表、12 条字段结构可见**；通过保存的界面树重新统计 12 个声明列表项与 13 个唯一表卡片，与预期一致。本节替代前一节「迁移后待实测」状态；schema8 迁移、writer 恢复与数据哈希由 Mozi 任务负责，本轮只验收插件读到的元数据与界面行为，不将他处测试称为插件测试。

逐条通过界面「打开 JOIN 查询」生成 7 份组合草稿：conversation_turns → conversations、recovery_commits → submissions、recovery_waits → recovery_runs、submissions → conversations、summary_projections → conversations、cleanup_jobs → mozi_chat_conversations、content_turns → mozi_chat_conversations。每份都核对来源/目标表、两对字段和一条 AND；Harness 均包含 scope_hash 等值条件，Mozi 两份分别包含 user_id / owner_id 归属条件。编辑器保持未执行状态，未点击执行，无业务 SELECT、DDL 或数据写入。

中文卡片摘要未含 @ref/@relation；展开 recovery_waits 原始 COMMENT 后仍可见完整 `@relation((scope_hash,run_id)->harness_recovery_runs(scope_hash,run_id))`。实际声明列表无 Mozi ↔ Harness 连线；recovery_waits 仅连 recovery_runs，owner 域 commits 连 submissions，未按同名 scope_hash 推断跨域关联。recovery_schema、conversation_deletions 不在图内。字段可见不等于数据一致性、唯一性或业务关联成立。

图面能够通过缩放、平移和精确表名筛选查看；13 表总览适应画布约 20%，细读需要放大或筛选，不能将总览截图当作所有字段在同屏可读的证明。已保存 recovery_waits 两表范围的可读详情及原始注释证据。验收后筛选已清除、恢复全图。未热更新/重启宿主、未中断 SSH 会话、未读取凭据、未修改数据库；没有新代码、提交、推送或发布。本轮仅新增本节交接记录并运行 `git diff --check`，不重复执行未变代码的测试。

证据目录（本地，不纳入仓库）：
`/Users/cyrus/.codex/visualizations/2026/10/22/01a161a7-63f8-7381-840f-adf2fa5d925b/mysql-v8-acceptance/`

- `overview.png` / `overview-ax.txt`：首次刷新后的 12 条/13 表总览。
- `join-drafts.json`：7 条实际 UI 草稿与未执行状态。
- `recovery-detail.png` / `recovery-detail-ax.txt`：精确表名筛选的 recovery 域组合关系及中文说明。
- `recovery-raw-comment.png` / `recovery-raw-comment-ax.txt`：保留原始机器声明。
- `final-overview.png` / `final-overview-ax.txt`：清除筛选后的全图。
- `harness-recovery.png`、`mozi.png` 及同名 AX 文件：辅助截图；搜索包含注释，`harness` 也会匹配 Mozi 中文跨模块说明，因此不把该搜索当作严格域过滤。

保存的 UI 证据经只读断言核对：12 声明、13 唯一卡片、7 草稿完整 AND、无自动执行、无跨模块/跨域推断、摘要不含机器声明，全部通过。截图包含宿主服务器信息，仅存本地，未向外部上传。

## 画布整体重设计：分组、取景与检查器

Brief：数据库使用者需要先理解独立关系网络，再看某条引用的字段与说明。旧界面将 13 张不相连的表放入同一层级，所有长线绕向全局顶部；底部永久显示的列表/详情占用约 300px，默认全图缩小到约 20%。本轮使用 help-me-design 的需求设计、相机导航、主视图/核对窗及交互验收经验，沿用现有深色主题、字体、tokens 与 SVG 图标；不新增依赖、数据库写入、关系推断或发布。

| 之前 | 现在 | 目的 |
| --- | --- | --- |
| 不相连的表共享层级与顶部通道 | 按声明的无向连通分量划分关联组，各自分层、排序和局部走线，再按高度分配到两列 | 不制造跨域关系，缩小图面包围盒，杜绝通道穿过其他组 |
| 所有表只能一起看，靠搜索临时裁切 | 总览与关联组导航共享同一份关系模型；组内可继续搜索 | 从全局结构进入某个可读网络，显示当前范围的声明数 |
| 详情永久挤占画布底部 | 紧凑标题和工具栏，画布占满余下高度；点线或按钮打开右侧检查器，Escape/收起退出 | 主任务得到空间，核对信息按需出现 |
| 选线后仍需手工找两端字段 | 整条组合声明高亮，其他线淡出；「定位所选」对两端表包围盒取景；另提供 100% 与适应画布 | 明确选中范围，支持读原尺寸与回到上下文 |
| 全图顶部为所有字段对预留大段空间 | 只按每组实际跨层配对数预留局部通道，无长线的组不预留顶部大空白 | 减少不必要的留白，同时保留独立 lane/端点 |

实现边界：`relations.ts` 新增 `relationGroups` 和组包围盒/排布，保持单组 Tarjan/重心布局；`relation-routing.ts` 根据 group 与 laneTop 隔离端口、竖线和顶部通道。`relation-camera.ts` 增加平移包围盒的 frameCamera；`useRelationCamera.ts` 支持范围 key 与定位，详情展开通过 ResizeObserver 调整中心，保留比例。`RelationsView.tsx` 提供分组导航、可选检查器、定位/比例操作及空搜索状态，`inject-styles.ts` 使用桌面侧栏/小屏覆盖面板。关系协议、原始 COMMENT、JOIN 全条件且只填草稿的边界保持不变。

验收条件：所有 12 条声明和 13 表仍可见；图按实际连接形成三组（6、5、2 表），单组导航无其他组卡片；组内卡片无重叠、长线通道位于本组内；可以点线查看说明、定位、收起、搜索并恢复；拖动/缩放语义不变；未执行草稿或改库。

QA：新增 3 项纯逻辑测试覆盖连通分量隔离、分组无重叠与边界、聚焦一组移除其他几何、单跳去除空通道，独立组的 lane 不跨组复用，以及 frameCamera 对平移包围盒的居中。插件共 **44 项测试通过**，类型检查、构建、主仓库 `make check` 与 `git diff --check` 通过。

Electron 真实运行库验收：12 声明/13 表，自动形成 Mozi 6 表/7 声明、Harness 会话侧 5 表/4 声明、恢复等待侧 2 表/1 声明。当前约 1920×1050 的应用画面中，初始全图 58%，Mozi 单组 89%，恢复组 100%；这些比例是当前窗口实测，不保证其他窗口相同。物理点选长连线路径成功打开检查器；列表选择组合引用、定位所选和 Escape 收起均成功，字段与整条组合线联动。关系搜索无匹配/清除恢复成功。Harness 组拖动截图的场景位移约 50×25px，比例未变；pixel 比较最符合该位移。重新适应画布可恢复。recovery_waits JOIN 草稿含 scope_hash 与 run_id 两个 AND 配对且未执行，验收生成的草稿已关闭。

总览、Mozi/Harness/恢复组、详情/定位与空搜索证据存于本地（仅截图，裁去截图服务附带的白色外围；原图保留）：
`/Users/cyrus/.codex/visualizations/2026/10/22/01a161a7-63f8-7381-840f-adf2fa5d925b/mysql-canvas-redesign/`

本地预览 **1.3.10** 已热更新，原市场地址已恢复，宿主 SSH 与原有转发通道保持连接。未重启宿主、未修改数据库、未提交/推送/发布。真实触控板捏合仍沿用已验证事件数学与非 passive wheel 实现，本轮没有物理手势设备证据；窄屏 CSS 已实现，尚未取得有效的原生窄窗口尺寸证据，不计为运行验收通过。布局为确定性启发式，循环同层曲线和极高密度网络仍可能点状交叉，不宣称全局最优或任意图无交叉。

## @mapping 业务映射接入（v1.1，本地两条）

2026-10-22，按 Mozi `docs/architecture/logical-data-relations.md` 第三节和 `20261022_05_business_mappings.sql` 接入。映射是新的表级判别类型 `MappingRelation`，source/target 只有 schema/table/tableComment，pairs 固定为空；不借用任意字段冒充映射端点。目标存在只表示表结构可见，缺失声明仍保留为 invalid。目标只允许当前库 ASCII 普通标识符，同源目标去重；格式残缺、字段/库名前缀、引号、表达式、重复闭括号等均报告诊断，不部分解释。

保留当前分组/相机设计：映射按显式源目标参与连通性与分层，长线预留一个局部 lane，连接表头中心；使用紫色点线、线上的「业务映射」文字和列表类型标记，与字段线区分，不只依赖颜色。工具栏新增全部/字段关联/业务映射筛选，分组提示「含业务映射，不代表可 JOIN」。目标说明读取表 COMMENT，摘要隐藏完整合法 @mapping，原始注释保留。详情说明无字段配对、基数或目标行保证；打开/复制 JOIN 均禁用，SQL 生成函数在检查状态前直接拒绝 mapping，即使将 status 强改 valid 也无法生成。

修改边界：`relations.ts`（判别联合、解析、搜索、描述、SQL 拒绝与布局 lane 数）、`RelationsView.tsx`（表头映射线、标签、筛选和禁用详情）、`inject-styles.ts`（映射样式）、`scripts/relations.test.mjs` 和说明文档。不改 IPC/权限，不新增依赖或关系 JSON，不修改数据库。

验证：新增 4 项测试覆盖去重/多映射、类型和无假字段、中文说明与原文、非法目标语法、大小写敏感、目标缺失保留、强制禁止 JOIN、映射与组合声明共存且 AND 完整、仅显式映射合并分组。总计 **48 项测试通过**；`npm run typecheck`、`npm run build`、主仓库 `make check` 和 `git diff --check` 通过。

真实 MySSH 既有连接验收：**14 条声明、13 张表、2 个关联组**。其中 12 条原字段关联 + 2 条 Mozi 业务映射：mozi_chat_conversations → harness_conversations、mozi_content_turns → harness_conversation_turns。全部类型视图为 11 表/13 声明（含映射）一组与 recovery 2 表/1 声明一组；业务映射筛选显示两条映射、两个两表组；字段关联筛选仍显示原 12 条/3 组。两条映射详情均显示中文定位规则，打开/复制按钮禁用；展开原始 COMMENT 确认 @mapping 仍在。字段模式再逐条打开原 12 条 JOIN 草稿，来源/目标与每个字段配对全部匹配，7 条组合的 AND 完整，均未自动执行；验收生成草稿逐条关闭。未按同名 scope_hash 增加等值线。

实际运行截图/界面树及十二份草稿记录：
`/Users/cyrus/.codex/visualizations/2026/10/22/01a161a7-63f8-7381-840f-adf2fa5d925b/mysql-business-mapping/`

重点文件为 `overview.png`、`mapping-filter.png`、`mapping-detail.png`、`raw-comment.png`、相应 AX 文本、`second-mapping-ax.txt`、`field-filter-ax.txt`、`twelve-field-join-drafts.json` 与 `final-overview-ax.txt`；截图裁去服务附带白边，raw 原图另存。仅本地留证，未上传。最后恢复全部类型/全图视野。本地预览 1.3.11 已热更新，原市场地址恢复，原 SSH 会话保持连接；未重启宿主、未改库、未提交/推送/发布。

边界：SDK 的 harness_submissions → harness_recovery_runs 第三条业务映射当前未从运行库读到，15 声明/13 表/1 组仅为后续迁移后的预期，不列作本轮实测。缺失目标/非法备注通过逻辑测试，未改真实注释造故障；未验证任意稠密图的最少交叉、物理触控板或窄屏设备。原有“没有 Mozi ↔ Harness 线”的历史验收由本节更新：仅绘制新显式业务映射，仍禁止跨模块等值 JOIN。

## 2026-10-22 密集连线优化（本地预览 1.3.12）

用户指出画布局部由线造成阅读困难。实录显示跨列线全部走顶部通道，组合声明逐字段重复绘线，造成大片回形线与空白。沿用 help-me-design 的画布导航与真实运行验收流程，本次只调整画布表达，不改协议、SQL、连接凭据或数据库。

- `relation-routing.ts`：A* 搜索卡片外的正交通道，避开卡片及 8px 安全边界；以距离、转弯、重复占用为代价。独立组各自走线；回向和自引用也绕卡片。标签选择最长水平段。无障碍信息的旧调用保留原有顶部通道。
- `RelationsView.tsx`：组合声明合为一条主线，标注字段数；选中时展开两端字段分支并保持全部字段配对高亮。选中关系最后绘制，穿插处加背景描边。路由结果 memo 化，平移缩放不重算。
- `relations.ts`：顶部只预留局部通道空间，不再按组合字段数累加高度；单跳组继续紧凑布局。
- `inject-styles.ts`、`scripts/relation-routing.test.mjs`、插件 README 同步。

验证：插件 typecheck/build 通过，npm test 50/50；宿主 make check 退出 0；git diff --check 通过。新增回归覆盖就近通道、卡片避障、通道标签、自引用；原端口分流、组隔离及关系/SQL 测试仍通过。先用无数据库依赖的结构样例运行真实 React 界面检查视觉，再热更新实际 MySSH，未重启宿主和 SSH。市场地址已恢复原值，无新依赖，无提交或推送。

运行库恢复后，用现有连接读取到 15 条声明 / 13 表 / 1 个关联组；7 个组合声明各只有一条主线（含 2 字段标记）。新增 `harness_submissions` 到 `harness_recovery_runs` 的业务映射已在实际 UI 中选中：说明包含非空 run_id、跨 owner/recovery 域以及目标可能不存在，打开 JOIN 查询和复制 SQL 均禁用。切到字段模式实际显示 12 条 / 3 组。未执行 JOIN 或修改数据。

证据目录：`/Users/cyrus/.codex/visualizations/2026/10/22/01a161a7-63f8-7381-840f-adf2fa5d925b/mysql-line-routing/`。`overview.png` 为真实库选中组合关系的局部阅读视图；`submission-mapping.png` 为新增映射及禁用按钮；对应原图及 AX 保存。用户同时在操作 MySSH，最后恢复全部类型的操作被 UI 控制保护中止，因此不覆盖用户最终视图，保留已验证截图。当前预览已安装 1.3.12。未单独重测物理触控板捏合或窄屏；极密集图仍可能交叉，描边和点选用于追踪。

## 2026-10-22 结构页显示 COMMENT（本地预览 1.3.13）

用户要求直接看到中文注释。原结构页使用 DESCRIBE，只读取六个基础属性，界面也没有注释列。本次 `TableDetail.tsx` 改用独立 `table-structure.ts` 读取指定 schema/table 的字段与表 COMMENT，按 ordinal position 排序；具名对象和数组结果统一解析，保留默认值与主键信息。查询参数用 UTF-8 十六进制文本表达，避免依赖 SQL 引号模式。结构页顶部显示表说明，字段旁显示可换行的注释；机器声明在原始 COMMENT 中展开查看。异步请求计数防止切表后旧结果覆盖新内容，失败显示错误。样式在 inject-styles.ts，README 与 table-structure.test.mjs/test.mjs 同步。

验证：typecheck、build、52 项测试、宿主 make check、diff --check 通过。热更新 MySQL 插件为本地预览 1.3.13，恢复原市场地址，未重启宿主/SSH。实际打开 mozi_chat_users 的结构页，显示表说明及全部 9 个字段中文注释（含 user_id、issuer、subject、identity_hash、display_name、phone、role、created_at、updated_at），已留在该页。截图/AX：`/Users/cyrus/.codex/visualizations/2026/10/22/01a161a7-63f8-7381-840f-adf2fa5d925b/mysql-structure-comments/`。未修改数据库、未引入依赖、未提交或推送。未单独验证窄屏；长注释按列宽自动换行。
