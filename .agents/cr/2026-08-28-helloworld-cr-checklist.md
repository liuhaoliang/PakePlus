# Code Review Checklist

> **Change** `helloworld` · **分支/Commit** `AI/task-DEV-d23e6231-8981-11f1-a838-a7dbcbb960a4-fcdef183-ad8f-404a-9ae0-3234c02ee598` / `a91c457` · **日期** `2026-08-28`
>
> **AI**：唯一进度源；状态仅用 `⬜` `✅` `❌` `⚠️` `N/A`。
> **完成标准**：所有核销项必须从 `⬜` 变为其他状态；`N/A` 需写原因。
>
> **执行顺序（强制）**：写入本清单并进入逐文件审查前，先在目标仓库对变更路径运行 `references/script/scan-all-rules.sh`，将输出贴入 Step 3 和 Step 4 备注；再用 LLM 完成 Step 2–5 中脚本未覆盖项及复核。

**scan-all-rules.sh 预扫结果**（目标：`src/main/java/com/example/helloworld` `src/test/java/com/example/helloworld`）：

```
=== Step 4 Rule Scan (B/M/I + A/S/G) ===
Targets: src/main/java/com/example/helloworld src/test/java/com/example/helloworld
Engine:  ripgrep
=== No findings. 52/222 rules scanned ===
```

---

## Step 1 — 执行队列（产物 A）

| # | 文件（仓库相对路径） | 归属原因 | Step2 | Step3 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 | G11 | G12 | G13 | G14 | G15 | G16 | G17 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | 总状态 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `src/main/java/com/example/helloworld/HelloWorld.java` | REQ-1/REQ-2 主类 | ✅ | ⚠️ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ⚠️ 已审有问题 |
| 2 | `src/test/java/com/example/helloworld/HelloWorldTest.java` | REQ-1 单测 | ✅ | ⚠️ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ⚠️ 已审有问题 |
| 3 | `pom.xml` | 构建配置（非 Java） | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 |
| 4 | `.agents/helloworld/impl.md` | 设计/编码报告（非 Java） | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 | 跳过 |

- 由 `git diff --name-only a91c457^...a91c457` 展开；非 Java 标 `跳过`。
- **守卫**：含 2 个 `.java` 文件，通过。
- **G/S 列说明**：本变更为最小 HelloWorld 示例，无并发/幂等/事务/SQL/MQ/缓存/调度/RPC/契约/资损/监控/灰度/应急/国际化等场景，G1–G10、G12–G17 整节 `N/A`；G11（自测）有单测且含断言 → `✅`。S1–S10 无 SQL/XSS/SSRF/命令/XXE/反序列化/文件/鉴权/数据安全/CSRF 场景，整节 `N/A`。

---

## Step 2 — 功能（产物 B）

| REQ | Scenario | Spec证据（原文/章节） | 关联文件 | 状态 | 代码证据（文件/测试/接口） |
|-----|----------|----------------------|----------|------|----------------------------|
| REQ-1 | Given HelloWorld 实例 / When 调用 getGreeting / Then 返回 "Hello, World!" | impl.md READ：`提供获取问候语`；TEST 表：`should_returnDefaultGreeting_when_invokeGetGreeting` 正常路径 | `src/main/java/com/example/helloworld/HelloWorld.java`、`src/test/java/com/example/helloworld/HelloWorldTest.java` | ✅ | `HelloWorld.java:13` `DEFAULT_GREETING="Hello, World!"`；`HelloWorld.java:20-22` getGreeting 返回该常量；`HelloWorldTest.java:26-28` assertEquals 双断言通过 |
| REQ-2 | Given 程序入口 / When 执行 main / Then 向标准输出打印问候语 | impl.md READ：`提供...程序入口能力`；IMPL：`主类` | `src/main/java/com/example/helloworld/HelloWorld.java` | ✅ | `HelloWorld.java:29-31` main 构造实例并 `System.out.println(getGreeting())`（示例入口，无独立单测，符合最小示例定位） |

---

## Step 3 — 可读性检查（产物 C）

> 预扫脚本未覆盖 A1–A7（属 LLM 核对项），以下为逐文件人工核对。

| ID | 检查项 | 状态 | 备注（命中写 `path:line`） |
|----|--------|------|----------------------------|
| A1 | 源文件格式 | ✅ | 文件名=顶层类名；UTF-8；仅 ASCII 空格 + 换行，无 Tab |
| A2 | 源文件结构/import 顺序 | ✅ | package→import→顶层类，空行分隔；无 `import *`；测试类静态 import（assertEquals/assertNotNull）与非静态 import 分两组，组间空行 |
| A3 | 代码样式 | ✅ | K&R 大括号；4 空格缩进；行宽 ≤120；成员间空行；`if (`/二元运算符两侧空格均合规 |
| A4 | 命名规范 | ⚠️ | **P2**：测试方法名 `should_returnDefaultGreeting_when_invokeGetGreeting` 使用下划线，严格违反 A4.3「方法名 lowerCamelCase」。`src/test/java/com/example/helloworld/HelloWorldTest.java:18`。注：BDD `should_X_when_Y` 为社区常见测试命名约定，团队若在 `unit-testing.md` 中明确豁免可保留 |
| A5 | 编码实践 | ✅ | 无重写方法；无 catch；静态常量在测试中以类名访问 `HelloWorld.DEFAULT_GREETING`（`HelloWorldTest.java:27`），未通过实例调用 |
| A6 | 特定元素样式 | ✅ | `String[] args`（`HelloWorld.java:29`）；修饰符顺序 `public static final`（`HelloWorld.java:13`）合规 |
| A7 | Javadoc 规范 | ✅ | public 类与 public/protected 成员均有 Javadoc；块标记 `@return`/`@param` 顺序合规；`getGreeting` 非 trivial getter 因带 Javadoc 亦无碍 |

---

## Step 4 — 可靠性检查（产物 D）

### 4.1 Bug 模式（`bug-pattern-checklist.md`）

> 预扫 `scan-all-rules.sh`：52/222 规则无命中。本变更仅涉及常量返回与 println，无数组/BigDecimal/日期/线程/JDBC/异常路径，下列多数 ID 标 `N/A`。

| ID | 状态 | 备注 |
|----|------|------|
| B001-B005 | N/A | 无 LocalDateTime.parse/数组比较与 toString/Arrays.fill/Arrays.asList 调用 |
| B006 | ✅ | AssertEqualsArgumentOrder：测试 `assertEquals(expected, actual)` 顺序正确（`HelloWorldTest.java:27-28`） |
| B007 | N/A | 无 catch Throwable/Error |
| B008 | N/A | 无 Executors 线程池 |
| B009 | N/A | 无位移运算 |
| B010 | N/A | 无 BigDecimal(double) |
| B011 | N/A | 无包装类型 == 比较 |
| B012-B018 | N/A | 无 Calendar/集合泛型误用/Comparable/this==null/三目提升/Money/常量溢出 |
| B019-B027 | N/A | 无 Money API/SimpleDateFormat/异常实例泄漏/Thread/双括号初始化/equals 误用 |
| B028-B040 | N/A | 无 DateUtil/POJO setter/浮点比较/格式串/注解 getClass/Unsafe/Hashtable/恒等运算/IdentityHashMap/varargs/递归/indexOf/isInstance |
| B041-B044 | N/A | 无 JDBC/JUnit3/Enclosed/AmbiguousTestClass（使用 JUnit5） |
| B045-B050 | N/A | 无锁/死循环/精度损失/Math.round/日期格式 DD/MisusedHourFormat |
| B051-B081 | N/A | 其余 Blocker 规则（序列化/资源/并发/IO 等）均无对应代码模式；预扫无命中，LLM 复核无遗漏 |
| M001-M027 | N/A | Major 规则均无对应代码模式；预扫无命中 |
| I001-I010 | N/A | Info 规则均无对应代码模式；预扫无命中 |

### 4.2 可靠性（`reliability-checklist.md`）

| ID | 状态 | 备注 |
|----|------|------|
| G1.1-G1.4 | N/A | 无并发/事务内先读后写/多锁场景 |
| G2.1-G2.3 | N/A | 无写接口/MQ 消费幂等场景 |
| G3.1-G3.2 | N/A | 无 @Transactional/分布式事务 |
| G4.1-G4.3 | N/A | 无 SQL/索引/分页查询 |
| G5.1 | N/A | 无 MQ 消费逻辑 |
| G6.1-G6.2 | N/A | 无缓存双写 |
| G7.1-G7.2 | N/A | 无调度任务 |
| G8.1 | N/A | 无 catch 吞异常路径（无异常处理代码） |
| G8.2 | N/A | 无核心链路外部依赖 |
| G8.3 | N/A | 无 I/O 流/连接/锁需释放 |
| G8.4-G8.6 | N/A | 无线程池/ThreadLocal |
| G9.1-G9.3 | N/A | 无 HTTP/RPC/DB/Redis 外部调用 |
| G10.1-G10.2 | N/A | 无接口契约字段 |
| G11.1 | ✅ | 新逻辑 getGreeting 有单测且含 assertEquals 断言（`HelloWorldTest.java:26-28`） |
| G11.2 | ✅ | getGreeting 为无参常量返回，无空/最大值/并发边界需覆盖 |
| G11.3 | ✅ | getGreeting 无入参，无需空值防御；main 示例入口不接收业务入参 |
| G11.4 | N/A | 无数值运算/金额 |
| G12.1-G12.2 | N/A | 无资金/转账/库存场景 |
| G13.1 | N/A | 无日志埋点 |
| G14.1-G14.4 | N/A | 无金额/多租户/时区/日期格式化 |
| G15.1-G15.3 | N/A | 无数据库变更/接口共存/开关切换 |
| G16.1-G16.4 | N/A | 无核心链路埋点/异常日志/空 catch |
| G17.1-G17.3 | N/A | 无功能开关/降级/数据变更回滚 |
| G18.1-G18.3 | N/A | 安全补强项，无对应代码模式 |

### 4.3 安全（`security-checklist.md`）

| ID | 状态 | 备注 |
|----|------|------|
| S1.1-S1.3 | N/A | 无 SQL |
| S2.1-S2.3 | N/A | 无 HTML/JS/模板输出 |
| S3.1-S3.3 | N/A | 无外部 URL 请求 |
| S4.1-S4.2 | N/A | 无系统命令拼接 |
| S5.1-S5.2 | N/A | 无 XML 解析 |
| S6.1-S6.3 | N/A | 无反序列化 |
| S7.1-S7.3 | N/A | 无文件上传/下载 |
| S8.1-S8.4 | N/A | 无鉴权接口/Cookie |
| S9.1 | N/A | 无密钥/凭证硬编码（DEFAULT_GREETING 为业务常量非凭证） |
| S9.2-S9.4 | N/A | 无敏感日志/传输加密/SecureRandom 场景 |
| S10.1-S10.3 | N/A | 无增删改 CSRF/CORS/URL 跳转 |

---

## Step 5 — 自定义扩展检查（产物 E）

### 5.1 自定义扩展（`customized-checklist.md`）

| ID | 状态 | 备注 |
|----|------|------|
| U1.1 | N/A(未启用自定义规则) | `customized-checklist.md` 仅含示例项（Controller @Valid），本变更无 Controller，不适用 |
| U1.2-U2.3 | N/A(未启用自定义规则) | U2 业务红线节为空 |

---

## 终检（防漏检）

- [x] 执行队列中每个文件 `Step2`、`Step3`、**S1–S10 / G1–G17** 各列均非 `⬜`（跳过文件除外）；
- [x] Step 2 的每个 REQ/Scenario 均非 `⬜`
- [x] Step 3 的 A1–A7 均非 `⬜`
- [x] Step 4 全部 **G/S** 与 **B001–B081 / M001–M027 / I001–I010** ID 均非 `⬜`（允许 `N/A`，但有原因）
- [x] Step 5 全部 U* ID 均非 `⬜`（`N/A(未启用自定义规则)`）
- [x] 所有 `❌/⚠️` 已写入 report，且包含 `ID + path:line`（A4.3 → `HelloWorldTest.java:18`）
