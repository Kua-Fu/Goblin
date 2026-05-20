# goblin

[English](./README.md) | [中文](./README.zh-CN.md)

<p align="center">
  <img src="./public/assets/goblin-logo.png" alt="goblin logo" width="180" />
</p>

<p>
  <img src="./docs/assets/badge-node.svg" alt="Node.js >= 20" height="28" />
  <img src="./docs/assets/badge-chrome.svg" alt="Chrome Extension" height="28" />
  <img src="./docs/assets/badge-sqlite.svg" alt="SQLite CLI" height="28" />
  <img src="./docs/assets/badge-javascript.svg" alt="JavaScript ES2022" height="28" />
  <img src="./docs/assets/badge-license.svg" alt="MIT License" height="28" />
</p>

<img src="./docs/assets/readme-hero.svg" alt="goblin 本地 Codex 项目观测工具" width="100%" />

goblin 是一个完全本地运行的 Codex 项目观测工具，用来可视化 Codex 管理的项目、对话、对话历史、日志进程线索和 shell 快照。

它默认只读取当前机器上的数据，不上传、不埋点、不注入网页、不访问网页内容。Web UI 和 Chrome 插件 UI 都会明确标注：**所有数据只在本机读取和展示**。

## 功能

- 项目总览：按工作目录汇总 Codex 管理过的项目。
- 对话浏览：查看每个项目下的对话、模型、分支、Token、归档状态和更新时间。
- 历史时间线：解析 rollout JSONL，展示用户消息、助手消息和工具调用。
- 进程线索：聚合日志里的 `process_uuid`，并结合本机 `ps` 信息展示活跃进程。
- 本地快照：关联 Codex 保存的 shell snapshot，辅助回看执行上下文。
- 中英文界面：默认中文，顶部可以切换英文。
- Chrome 插件：无需启动本地 HTTP 服务，也可以使用观测台。

## 本地优先

goblin 的隐私边界很简单：

- 不上传 Codex 对话、日志、项目路径、进程信息或源码片段。
- 不包含 analytics、telemetry、crash reporting、广告或追踪 SDK。
- Chrome 扩展没有 `host_permissions`，也不注入 content script。
- Native Host 只接受固定 API 路由，不接受任意 SQL、shell 命令或文件路径。

更完整的说明见 [PRIVACY.md](./PRIVACY.md)。

## 依赖

goblin 没有 npm 运行时依赖，主要依靠 Node.js 标准库和系统自带工具。

| 依赖 | Logo | 用途 | 要求 |
| --- | --- | --- | --- |
| Node.js | <img src="./docs/assets/badge-node.svg" alt="Node.js" height="24" /> | 启动本地 Web 服务、运行 Native Host、测试和扩展构建脚本。 | `>=20` |
| Google Chrome | <img src="./docs/assets/badge-chrome.svg" alt="Chrome" height="24" /> | 加载 unpacked extension，提供 Native Messaging 通道。 | Manifest V3 |
| SQLite CLI | <img src="./docs/assets/badge-sqlite.svg" alt="SQLite" height="24" /> | 读取 Codex 的 `state_5.sqlite` 和 `logs_2.sqlite`。 | 需要 `sqlite3` 命令 |
| Codex 本机缓存 | <img src="./docs/assets/badge-codex.svg" alt="Codex" height="24" /> | 提供项目、对话、rollout、日志和 shell snapshot 数据源。 | 默认 `~/.codex` |

## 快速启动

```bash
npm run dev
```

默认地址是 `http://127.0.0.1:3001`。可以通过环境变量覆盖端口或 Codex 数据目录：

```bash
PORT=3010 CODEX_HOME=/path/to/.codex npm run dev
```

Web UI 默认显示中文。顶部语言选择器可以切换到 English，偏好只保存在本机浏览器里。

## 运行图

### 项目 Atlas

点击「项目」会打开项目级 token atlas。默认泡泡图可拖动，也可以切换为 Top-N 条形图、Pareto、Treemap 或表格。

<img src="./docs/assets/readme-project-atlas-zh.png" alt="项目 token atlas 中文界面" width="100%" />

### Token 时间线

点击「Tokens」可以查看 token 使用量随时间变化，也可以筛选到具体项目。

<img src="./docs/assets/readme-token-line-zh.png" alt="Token 使用量折线图中文界面" width="100%" />

## Chrome 插件

扩展版不需要启动本地 HTTP 服务。Chrome Extension 只负责展示 UI，数据由本机 Native Host 读取后通过 Native Messaging 返回。

```text
Chrome Extension UI
  -> nativeMessaging
  -> native-host/codex-local-viewer-host.js
  -> 固定白名单内的 ~/.codex 数据源
```

构建扩展目录：

```bash
npm run build:extension
```

在 Chrome 打开 `chrome://extensions`，开启开发者模式，选择 `dist/chrome-extension` 作为 unpacked extension。加载后复制扩展 ID，再安装 Native Host：

```bash
npm run install:native-host -- <extension-id>
```

macOS 上会写入：

```text
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.goblin.codex_local_viewer.json
```

Native Host manifest 会通过 `allowed_origins` 只允许这个扩展 ID 连接。

安装脚本还会在 manifest 旁边创建一个可执行 launcher。Chrome 启动 Native Messaging Host 时只有很少的 GUI 环境变量，所以 launcher 会使用安装时捕获到的 Node.js 绝对路径，不依赖 `env node`。

如果 popup 显示 `Native host has exited`，用当前扩展 ID 重新安装 Native Host：

```bash
npm run install:native-host -- <extension-id>
```

然后在 `chrome://extensions` 里重新加载扩展，再点击「检查本机组件」。

## 数据源

- `~/.codex/state_5.sqlite`: 对话元数据、项目路径、标题、模型、Git 分支和 rollout 路径。
- `~/.codex/logs_2.sqlite`: 日志行、thread 与 process 的关联、日志等级和最近活跃时间。
- `~/.codex/sessions/**/rollout-*.jsonl`: 对话历史与工具调用时间线。
- `~/.codex/shell_snapshots/*.sh`: Codex 记录的 shell 快照。

## API

- `GET /api/overview`: 项目总览、最近对话、进程线索。
- `GET /api/project?cwd=/path/to/project`: 单个项目下的对话和进程聚合。
- `GET /api/thread/:id`: 单个对话的 rollout 时间线、日志、进程和 shell 快照。
- `GET /api/processes`: 按进程聚合的日志与关联对话。
- `GET /api/sources`: 当前数据源可用性。

## 开发检查

```bash
npm test
npm run build:extension
```

## License

goblin 使用 [MIT License](./LICENSE)。当前仓库 License 声明为 `Copyright (c) 2026 thewind`。
