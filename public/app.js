const state = {
  overview: null,
  selectedCwd: null,
  selectedThreadId: null,
  projectDetail: null,
  threadDetail: null,
  activeTab: "timeline",
  refreshTimer: null,
  countdownTimer: null,
  nextRefreshAt: null,
  refreshMs: 30000,
  isLoading: false,
  processOverview: null,
  language: "zh",
  metricPage: null,
  projectChartMode: "bubble",
  threadChartMode: "bars",
  processChartMode: "table",
  tokenProjectCwd: "all",
};

const els = {
  brandHome: document.getElementById("brand-home"),
  languageSelect: document.getElementById("language-select"),
  sourceLine: document.getElementById("source-line"),
  metrics: document.getElementById("metrics"),
  overviewVisuals: document.getElementById("overview-visuals"),
  workspace: document.querySelector(".workspace"),
  insightPage: document.getElementById("insight-page"),
  projectList: document.getElementById("project-list"),
  projectSearch: document.getElementById("project-search"),
  projectSort: document.getElementById("project-sort"),
  projectTitle: document.getElementById("project-title"),
  projectPathLabel: document.getElementById("project-path-label"),
  projectSummary: document.getElementById("project-summary"),
  threadList: document.getElementById("thread-list"),
  threadFilter: document.getElementById("thread-filter"),
  threadIdLabel: document.getElementById("thread-id-label"),
  threadTitle: document.getElementById("thread-title"),
  threadMeta: document.getElementById("thread-meta"),
  detailContent: document.getElementById("detail-content"),
  refreshNow: document.getElementById("refresh-now"),
  refreshInterval: document.getElementById("refresh-interval"),
  refreshProgress: document.getElementById("refresh-progress"),
  refreshCountdown: document.getElementById("refresh-countdown"),
};

const isExtensionRuntime =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  window.location.protocol === "chrome-extension:";

const I18N = {
  zh: {
    "brand.homeAria": "返回主界面并刷新",
    "brand.loading": "读取本机 Codex 状态",
    "brand.sourceLine": "{codexHome} · session_index {count} 条",
    "controls.language": "语言",
    "controls.refreshNow": "立即刷新",
    "controls.autoRefresh": "自动刷新",
    "controls.refreshIntervalAria": "自动刷新间隔",
    "controls.off": "关闭",
    "controls.closed": "已关闭",
    "controls.projectSort": "项目排序",
    "controls.threadFilter": "对话筛选",
    "controls.projectSearch": "搜索路径、分支、模型",
    "controls.backList": "返回列表",
    "controls.backOverview": "返回总览",
    "controls.projectSelect": "选择项目",
    "privacy.aria": "隐私说明",
    "privacy.title": "所有数据只在本机读取和展示",
    "privacy.body": "goblin 完全本地运行，不上传、不埋点、不访问网页内容。",
    "regions.metrics": "总览指标",
    "regions.visuals": "Token 可视化",
    "regions.projects": "项目列表",
    "regions.threads": "对话列表",
    "regions.detail": "对话详情",
    "regions.detailTabs": "详情视图",
    "headings.projects": "项目",
    "headings.conversations": "对话",
    "headings.threadHistory": "对话历史",
    "sort.updated": "最近更新",
    "sort.threads": "对话数量",
    "sort.processes": "进程数量",
    "filters.all": "全部",
    "filters.active": "有进程",
    "filters.snapshots": "有快照",
    "filters.archived": "已归档",
    "tabs.timeline": "时间线",
    "tabs.logs": "日志",
    "tabs.processes": "进程",
    "metrics.projects": "项目",
    "metrics.threads": "对话",
    "metrics.activeProcesses": "活跃进程",
    "metrics.processes": "进程线索",
    "metrics.shellSnapshots": "Shell 快照",
    "metrics.archived": "已归档",
    "metrics.tokens": "Tokens",
    "status.active": "活跃",
    "status.recent": "近期",
    "status.idle": "空闲",
    "status.running": "运行中",
    "status.stopped": "未运行",
    "status.archived": "归档",
    "empty.none": "无",
    "empty.noData": "暂无数据",
    "empty.noProjects": "暂无项目",
    "empty.noThreads": "暂无对话",
    "empty.selectProject": "请选择项目",
    "empty.selectThread": "请选择对话",
    "empty.noPreview": "无预览",
    "empty.noRollout": "暂无 rollout 历史",
    "empty.noLogs": "暂无日志",
    "empty.noProcesses": "暂无进程线索",
    "empty.noProjectData": "暂无项目数据",
    "empty.noThreadData": "暂无对话数据",
    "empty.noThreadBubbles": "暂无对话泡泡",
    "empty.noTokenTime": "暂无 token 时间数据",
    "empty.processNotIndexed": "这个进程线索不在当前索引里。",
    "loading.label": "Loading",
    "loading.readingIndex": "正在读取本机索引",
    "loading.openProject": "正在打开项目详情",
    "loading.openThread": "正在打开对话详情",
    "loading.openProcesses": "正在打开进程总览",
    "loading.openProcess": "正在打开进程详情",
    "loading.openActiveProcesses": "正在打开活跃进程",
    "loading.openProcessClues": "正在打开进程线索",
    "loading.loading": "加载中...",
    "chart.type": "图表类型",
    "chart.bubble": "泡泡",
    "chart.table": "表格",
    "chart.other": "其他",
    "chart.otherProjects": "其他项目",
    "chart.otherThreads": "其他对话",
    "chart.otherProcesses": "其他进程",
    "chart.merged": "{count} 条合并",
    "chart.projectTreemapAria": "项目 token treemap",
    "chart.projectBubbleAria": "项目 Token 泡泡图",
    "chart.threadDistributionAria": "对话消耗分布",
    "chart.processActivityAria": "进程活动泡泡",
    "chart.relatedThreadBubbleAria": "关联对话泡泡",
    "chart.tokenLineAria": "Token 使用量折线图",
    "chart.projectTitle": "项目 Token 分布",
    "chart.projectSubtitle": "按项目汇总 token 消耗，面积和排序突出主要使用来源。",
    "chart.threadTitle": "对话 Token Top-N",
    "chart.threadSubtitle": "Top-N 排序突出 token 消耗最高的对话。",
    "chart.processTitle": "进程线索日志分布",
    "chart.activeProcessTitle": "活跃进程日志分布",
    "chart.processSubtitle": "按日志数量和最近活跃时间汇总本机进程。",
    "chart.snapshotTitle": "Shell 快照项目分布",
    "chart.snapshotSubtitle": "按项目汇总快照数量。",
    "chart.archivedTitle": "已归档对话",
    "chart.archivedSubtitle": "归档对话按 token 消耗排序。",
    "chart.tokenTitle": "Token 使用量折线图",
    "chart.tokenSubtitle": "{count} 个时间点 · 合计 {total} tokens",
    "chart.allProjects": "全部项目",
    "table.project": "项目",
    "table.conversation": "对话",
    "table.tokens": "Tokens",
    "table.status": "状态",
    "table.lastActive": "最近活跃",
    "table.process": "进程",
    "table.logs": "日志",
    "detail.project": "项目",
    "detail.conversation": "对话",
    "detail.process": "进程",
    "detail.snapshot": "快照",
    "detail.token": "Token",
    "detail.activeProcess": "活跃进程",
    "detail.branch": "分支",
    "detail.lastUpdated": "最近更新",
    "detail.timeline": "对话时间线",
    "detail.recentLogs": "最近日志",
    "detail.relatedProcesses": "关联进程",
    "detail.relatedThreads": "关联对话",
    "detail.threadDistribution": "对话消耗分布",
    "detail.processClues": "进程线索",
    "detail.processMap": "进程线索",
    "detail.processMapSubtitle": "按日志密度和关联对话聚合本机进程",
    "detail.processActivity": "进程活动泡泡",
    "detail.processNotFound": "未找到进程",
    "detail.runtime": "运行时长",
    "detail.state": "状态",
    "detail.bubbleTokenHint": "泡泡大小按 token 消耗缩放。",
    "detail.bubbleLogHint": "泡泡大小按日志数量缩放。",
    "detail.bubbleThreadLogHint": "泡泡大小按该进程在对话中的日志数量缩放。",
    "count.conversations": "{count} 对话",
    "count.processes": "{count} 进程",
    "count.snapshots": "{count} 快照",
    "count.threads": "{count} threads",
    "count.thread": "{count} thread",
    "count.events": "{count} events",
    "count.event": "{count} event",
    "count.logs": "{count} logs",
    "count.log": "{count} log",
    "count.activeProcessRatio": "{active}/{total}",
  },
  en: {
    "brand.homeAria": "Return home and refresh",
    "brand.loading": "Reading local Codex state",
    "brand.sourceLine": "{codexHome} · session_index {count} entries",
    "controls.language": "Language",
    "controls.refreshNow": "Refresh",
    "controls.autoRefresh": "Auto refresh",
    "controls.refreshIntervalAria": "Auto refresh interval",
    "controls.off": "Off",
    "controls.closed": "Off",
    "controls.projectSort": "Project sort",
    "controls.threadFilter": "Conversation filter",
    "controls.projectSearch": "Search path, branch, model",
    "controls.backList": "Back to list",
    "controls.backOverview": "Back to overview",
    "controls.projectSelect": "Select project",
    "privacy.aria": "Privacy note",
    "privacy.title": "All data is read and displayed only on this machine",
    "privacy.body": "goblin runs fully locally. No uploads, no tracking, no cloud calls, and no page-content access.",
    "regions.metrics": "Overview metrics",
    "regions.visuals": "Token visualization",
    "regions.projects": "Project list",
    "regions.threads": "Conversation list",
    "regions.detail": "Conversation detail",
    "regions.detailTabs": "Detail views",
    "headings.projects": "Projects",
    "headings.conversations": "Conversations",
    "headings.threadHistory": "Conversation history",
    "sort.updated": "Recently updated",
    "sort.threads": "Conversations",
    "sort.processes": "Processes",
    "filters.all": "All",
    "filters.active": "With processes",
    "filters.snapshots": "With snapshots",
    "filters.archived": "Archived",
    "tabs.timeline": "Timeline",
    "tabs.logs": "Logs",
    "tabs.processes": "Processes",
    "metrics.projects": "Projects",
    "metrics.threads": "Conversations",
    "metrics.activeProcesses": "Active processes",
    "metrics.processes": "Process clues",
    "metrics.shellSnapshots": "Shell snapshots",
    "metrics.archived": "Archived",
    "metrics.tokens": "Tokens",
    "status.active": "Active",
    "status.recent": "Recent",
    "status.idle": "Idle",
    "status.running": "Running",
    "status.stopped": "Stopped",
    "status.archived": "Archived",
    "empty.none": "None",
    "empty.noData": "No data",
    "empty.noProjects": "No projects",
    "empty.noThreads": "No conversations",
    "empty.selectProject": "Select a project",
    "empty.selectThread": "Select a conversation",
    "empty.noPreview": "No preview",
    "empty.noRollout": "No rollout history",
    "empty.noLogs": "No logs",
    "empty.noProcesses": "No process clues",
    "empty.noProjectData": "No project data",
    "empty.noThreadData": "No conversation data",
    "empty.noThreadBubbles": "No conversation bubbles",
    "empty.noTokenTime": "No token time data",
    "empty.processNotIndexed": "This process clue is not in the current index.",
    "loading.label": "Loading",
    "loading.readingIndex": "Reading local index",
    "loading.openProject": "Opening project detail",
    "loading.openThread": "Opening conversation detail",
    "loading.openProcesses": "Opening process overview",
    "loading.openProcess": "Opening process detail",
    "loading.openActiveProcesses": "Opening active processes",
    "loading.openProcessClues": "Opening process clues",
    "loading.loading": "Loading...",
    "chart.type": "Chart type",
    "chart.bubble": "Bubble",
    "chart.table": "Table",
    "chart.other": "Other",
    "chart.otherProjects": "Other projects",
    "chart.otherThreads": "Other conversations",
    "chart.otherProcesses": "Other processes",
    "chart.merged": "{count} merged",
    "chart.projectTreemapAria": "Project token treemap",
    "chart.projectBubbleAria": "Project token bubble chart",
    "chart.threadDistributionAria": "Conversation usage distribution",
    "chart.processActivityAria": "Process activity bubbles",
    "chart.relatedThreadBubbleAria": "Related conversation bubbles",
    "chart.tokenLineAria": "Token usage line chart",
    "chart.projectTitle": "Project token distribution",
    "chart.projectSubtitle": "Token usage grouped by project, with area and ranking highlighting the largest sources.",
    "chart.threadTitle": "Conversation token Top-N",
    "chart.threadSubtitle": "Top-N ranking surfaces the conversations with the highest token usage.",
    "chart.processTitle": "Process clue log distribution",
    "chart.activeProcessTitle": "Active process log distribution",
    "chart.processSubtitle": "Local processes summarized by log count and recent activity.",
    "chart.snapshotTitle": "Shell snapshot distribution",
    "chart.snapshotSubtitle": "Shell snapshots grouped by project.",
    "chart.archivedTitle": "Archived conversations",
    "chart.archivedSubtitle": "Archived conversations sorted by token usage.",
    "chart.tokenTitle": "Token usage line chart",
    "chart.tokenSubtitle": "{count} time points · {total} tokens total",
    "chart.allProjects": "All projects",
    "table.project": "Project",
    "table.conversation": "Conversation",
    "table.tokens": "Tokens",
    "table.status": "Status",
    "table.lastActive": "Last active",
    "table.process": "Process",
    "table.logs": "Logs",
    "detail.project": "Project",
    "detail.conversation": "Conversation",
    "detail.process": "Process",
    "detail.snapshot": "Snapshot",
    "detail.token": "Token",
    "detail.activeProcess": "Active processes",
    "detail.branch": "Branch",
    "detail.lastUpdated": "Last updated",
    "detail.timeline": "Conversation timeline",
    "detail.recentLogs": "Recent logs",
    "detail.relatedProcesses": "Related processes",
    "detail.relatedThreads": "Related conversations",
    "detail.threadDistribution": "Conversation usage distribution",
    "detail.processClues": "Process clues",
    "detail.processMap": "Process clues",
    "detail.processMapSubtitle": "Local processes grouped by log density and related conversations",
    "detail.processActivity": "Process activity",
    "detail.processNotFound": "Process not found",
    "detail.runtime": "Runtime",
    "detail.state": "State",
    "detail.bubbleTokenHint": "Bubble size scales with token usage.",
    "detail.bubbleLogHint": "Bubble size scales with log count.",
    "detail.bubbleThreadLogHint": "Bubble size scales with this process's log count in each conversation.",
    "count.conversations": "{count} conversations",
    "count.conversation": "{count} conversation",
    "count.processes": "{count} processes",
    "count.process": "{count} process",
    "count.snapshots": "{count} snapshots",
    "count.snapshot": "{count} snapshot",
    "count.threads": "{count} threads",
    "count.thread": "{count} thread",
    "count.events": "{count} events",
    "count.event": "{count} event",
    "count.logs": "{count} logs",
    "count.log": "{count} log",
    "count.activeProcessRatio": "{active}/{total}",
  },
};

function t(key, values = {}) {
  const dictionary = I18N[state.language] || I18N.zh;
  const fallback = I18N.zh[key] || key;
  const template = dictionary[key] || fallback;
  return String(template).replaceAll(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

function countText(key, count) {
  if (state.language === "en" && Number(count) === 1) {
    const singularKey = {
      conversations: "conversation",
      processes: "process",
      snapshots: "snapshot",
      threads: "thread",
      events: "event",
      logs: "log",
    }[key];
    if (singularKey) {
      return t(`count.${singularKey}`, { count });
    }
  }
  return t(`count.${key}`, { count });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return t("empty.none");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("empty.none");
  return new Intl.DateTimeFormat(state.language === "en" ? "en-US" : "zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFullDate(value) {
  if (!value) return t("empty.none");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("empty.none");
  return new Intl.DateTimeFormat(state.language === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function compactNumber(value) {
  return new Intl.NumberFormat(state.language === "en" ? "en-US" : "zh-CN", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function shortId(value) {
  const text = String(value || "");
  return text.length > 12 ? `${text.slice(0, 8)}...${text.slice(-4)}` : text;
}

function shortLabel(value, limit = 18) {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function formatDuration(ms) {
  const seconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function bubbleSize(value, maxValue, min = 74, max = 178) {
  const safeMax = Math.max(1, Number(maxValue || 0));
  const ratio = Math.sqrt(Math.max(0, Number(value || 0)) / safeMax);
  return Math.round(min + (max - min) * ratio);
}

function tone(index) {
  return ["coral", "violet", "mint", "amber", "cyan", "rose"][index % 6];
}

function toneColor(index) {
  const colors = ["#f36b5f", "#8358d5", "#12a594", "#b98221", "#269eb6", "#c75785"];
  return colors[index % colors.length];
}

function statusText(status) {
  return status === "active" ? t("status.active") : status === "recent" ? t("status.recent") : t("status.idle");
}

function readSavedRefreshMs() {
  const fallback = 30000;
  try {
    const saved = window.localStorage.getItem("goblin.refreshMs");
    return ["0", "10000", "30000", "60000", "300000"].includes(saved) ? Number(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveRefreshMs(value) {
  try {
    window.localStorage.setItem("goblin.refreshMs", String(value));
  } catch {
    // localStorage can be unavailable in hardened extension contexts; refreshing still works in memory.
  }
}

function readSavedLanguage() {
  try {
    const saved = window.localStorage.getItem("goblin.language");
    return saved === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

function saveLanguage(value) {
  try {
    window.localStorage.setItem("goblin.language", value);
  } catch {
    // 语言选择只是 UI 偏好；无法写入 localStorage 时保持本次会话即可。
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of node.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":");
      if (attr && key) {
        node.setAttribute(attr, t(key));
      }
    }
  }
  if (els.languageSelect) {
    els.languageSelect.value = state.language;
  }
}

function rerenderForLanguage() {
  applyStaticTranslations();
  if (!state.overview) return;
  renderMetrics();
  if (state.metricPage) {
    openMetricPage(state.metricPage);
  }
  renderProjects();
  renderThreads();
  renderDetail();
}

function setLanguage(language, options = {}) {
  state.language = language === "en" ? "en" : "zh";
  if (options.persist !== false) {
    saveLanguage(state.language);
  }
  rerenderForLanguage();
  updateRefreshIndicator();
}

function updateRefreshIndicator() {
  if (!state.refreshMs) {
    if (els.refreshCountdown) els.refreshCountdown.textContent = t("controls.closed");
    if (els.refreshProgress) els.refreshProgress.style.width = "0%";
    return;
  }

  const remaining = Math.max(0, state.nextRefreshAt - Date.now());
  const elapsed = Math.min(state.refreshMs, state.refreshMs - remaining);
  const progress = Math.max(0, Math.min(100, (elapsed / state.refreshMs) * 100));

  if (els.refreshCountdown) {
    els.refreshCountdown.textContent = formatDuration(remaining);
  }
  if (els.refreshProgress) {
    els.refreshProgress.style.width = `${progress}%`;
  }
}

function scheduleAutoRefresh() {
  window.clearTimeout(state.refreshTimer);
  window.clearInterval(state.countdownTimer);
  state.refreshTimer = null;
  state.countdownTimer = null;

  if (!state.refreshMs) {
    state.nextRefreshAt = null;
    updateRefreshIndicator();
    return;
  }

  state.nextRefreshAt = Date.now() + state.refreshMs;
  updateRefreshIndicator();
  state.countdownTimer = window.setInterval(updateRefreshIndicator, 1000);

  // 自动刷新默认开启，但要保留用户当前看的项目和对话，避免监控时视图跳回第一条。
  state.refreshTimer = window.setTimeout(async () => {
    await loadOverview({ showLoading: false });
    scheduleAutoRefresh();
  }, state.refreshMs);
}

function setRefreshMs(value) {
  state.refreshMs = Number(value || 0);
  if (els.refreshInterval) {
    els.refreshInterval.value = String(state.refreshMs);
  }
  saveRefreshMs(state.refreshMs);
  scheduleAutoRefresh();
}

async function refreshNow() {
  if (state.isLoading) return;
  if (els.refreshNow) {
    els.refreshNow.disabled = true;
  }
  try {
    await loadOverview();
    scheduleAutoRefresh();
  } finally {
    if (els.refreshNow) {
      els.refreshNow.disabled = false;
    }
  }
}

async function requestJson(url) {
  if (isExtensionRuntime) {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "codexLocalRequest", url }, (message) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(message);
      });
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Native host request failed");
    }
    return response.data;
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || response.statusText);
  }
  return response.json();
}

function renderMetrics() {
  const stats = state.overview?.stats || {};
  const items = [
    [t("metrics.projects"), stats.projectCount, "projects"],
    [t("metrics.threads"), stats.threadCount, "threads"],
    [t("metrics.activeProcesses"), stats.activeProcessCount, "active-processes"],
    [t("metrics.processes"), stats.processCount, "processes"],
    [t("metrics.shellSnapshots"), stats.shellSnapshotCount, "snapshots"],
    [t("metrics.archived"), stats.archivedThreadCount, "archived"],
    [t("metrics.tokens"), stats.tokenCount, "tokens"],
  ];

  els.metrics.innerHTML = items
    .map(
      ([label, value, page]) => `
        <button class="metric ${page === state.metricPage ? "is-active" : ""}" type="button" ${
          page ? `data-page="${page}" aria-pressed="${page === state.metricPage ? "true" : "false"}"` : ""
        }>
          <span class="eyebrow">${escapeHtml(label)}</span>
          <strong>${compactNumber(value)}</strong>
        </button>
      `,
    )
    .join("");

  for (const metric of els.metrics.querySelectorAll("[data-page]")) {
    metric.addEventListener("click", () => openMetricPage(metric.dataset.page));
  }

  const source = state.overview?.sources;
  if (source) {
    els.sourceLine.textContent = t("brand.sourceLine", {
      codexHome: source.codexHome,
      count: compactNumber(source.sessionIndexCount),
    });
  }
}

function projectBubbleNodes() {
  return [...(state.overview?.projects || [])]
    .filter((project) => project.tokensUsed > 0)
    .sort((a, b) => b.tokensUsed - a.tokensUsed)
    .slice(0, 40)
    .map((project, index) => ({
      id: project.cwd,
      label: project.name,
      value: project.tokensUsed,
      meta: `${compactNumber(project.tokensUsed)} tokens`,
      color: toneColor(index),
      kind: "project",
    }));
}

function renderForceBubbleChart(svgElement, nodes, options = {}) {
  if (!svgElement || typeof d3 === "undefined") return;

  const width = Math.max(720, svgElement.parentElement.clientWidth || 720);
  const availableHeight = options.fillHeight ? svgElement.parentElement.clientHeight : 0;
  const height =
    options.fillHeight && availableHeight
      ? Math.max(180, availableHeight)
      : Math.max(options.minHeight || 280, options.height || 280);
  const margin = options.margin || 10;
  const maxValue = Math.max(1, ...nodes.map((node) => node.value || 0));
  const radius = d3.scaleSqrt().domain([0, maxValue]).range([32, 92]);
  const chartNodes = nodes.map((node, index) => ({
    ...node,
    r: radius(node.value || 0),
    x: width * (0.2 + (index % 5) * 0.15),
    y: height * (0.28 + (index % 3) * 0.2),
  }));

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("height", `${height}px`);

  const defs = svg.append("defs");
  chartNodes.forEach((node, index) => {
    const gradient = defs
      .append("radialGradient")
      .attr("id", `bubble-gradient-${options.id || "chart"}-${index}`)
      .attr("cx", "34%")
      .attr("cy", "28%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffffff").attr("stop-opacity", 0.96);
    gradient.append("stop").attr("offset", "48%").attr("stop-color", node.color).attr("stop-opacity", 0.18);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", node.color).attr("stop-opacity", 0.5);
  });

  const groups = svg
    .append("g")
    .selectAll("g")
    .data(chartNodes)
    .join("g")
    .attr("class", "force-node")
    .attr("tabindex", 0)
    .attr("role", "button")
    .on("click", (event, node) => {
      if (node.__dragMoved || node.__suppressClickUntil > Date.now()) {
        node.__dragMoved = false;
        event.stopPropagation();
        return;
      }
      if (node.kind === "project") openProjectPage(node.id);
      if (node.kind === "thread") openThreadPage(node.id);
      if (node.kind === "process") openProcessPage(node.id);
    })
    .on("keydown", (event, node) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (node.kind === "project") openProjectPage(node.id);
      if (node.kind === "thread") openThreadPage(node.id);
      if (node.kind === "process") openProcessPage(node.id);
    });

  groups.append("title").text((node) => `${node.label} · ${node.meta}`);

  groups
    .append("circle")
    .attr("r", (node) => node.r)
    .attr("fill", (_, index) => `url(#bubble-gradient-${options.id || "chart"}-${index})`)
    .attr("stroke", (node) => node.color)
    .attr("stroke-opacity", 0.32)
    .attr("stroke-width", 1.2);

  groups
    .append("text")
    .attr("class", "force-label")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.15em")
    .text((node) => shortLabel(node.label, node.r > 70 ? 20 : 13));

  groups
    .append("text")
    .attr("class", "force-meta")
    .attr("text-anchor", "middle")
    .attr("dy", "1.35em")
    .text((node) => node.meta);

  // D3 forceCollide 让泡泡自然排布，避免大小差异较大的项目互相压住文字。
  d3.forceSimulation(chartNodes)
    .force("x", d3.forceX(width / 2).strength(0.055))
    .force("y", d3.forceY(height / 2).strength(0.08))
    .force("collide", d3.forceCollide((node) => node.r + 6).iterations(3))
    .force("charge", d3.forceManyBody().strength(4))
    .stop()
    .tick(260);

  chartNodes.forEach((node) => {
    node.x = Math.max(node.r + margin, Math.min(width - node.r - margin, node.x));
    node.y = Math.max(node.r + margin, Math.min(height - node.r - margin, node.y));
  });

  groups.attr("transform", (node) => `translate(${node.x},${node.y})`);

  if (options.draggable) {
    // 项目泡泡图是一个探索入口，允许用户手动挪开相互靠近的泡泡来查看标题。
    const clamp = (value, minValue, maxValue) => Math.max(minValue, Math.min(maxValue, value));
    groups.call(
      d3
        .drag()
        .on("start", function (_, node) {
          node.__dragMoved = false;
          d3.select(this).raise().classed("is-dragging", true);
        })
        .on("drag", function (event, node) {
          node.__dragMoved = true;
          node.x = clamp(event.x, node.r + margin, width - node.r - margin);
          node.y = clamp(event.y, node.r + margin, height - node.r - margin);
          d3.select(this).attr("transform", `translate(${node.x},${node.y})`);
        })
        .on("end", function (_, node) {
          node.__suppressClickUntil = Date.now() + 180;
          d3.select(this).classed("is-dragging", false);
          window.setTimeout(() => {
            node.__dragMoved = false;
          }, 200);
        }),
    );
  }
}

function allThreadRows() {
  return [...(state.overview?.projects || [])].flatMap((project) =>
    (project.threads || []).map((thread) => ({
      ...thread,
      cwd: thread.cwd || project.cwd,
      projectName: project.name,
    })),
  );
}

function projectChartRows() {
  return [...(state.overview?.projects || [])]
    .sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0))
    .map((project, index) => ({
      id: project.cwd,
      kind: "project",
      title: project.name || project.cwd,
      subtitle: project.cwd,
      value: project.tokensUsed || 0,
      meta: `${countText("conversations", project.threadCount || 0)} · ${countText("processes", project.processCount || 0)}`,
      status: statusText(project.status),
      updatedAt: project.lastUpdatedAt,
      color: toneColor(index),
    }));
}

function threadChartRows() {
  return allThreadRows()
    .sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0))
    .map((thread, index) => ({
      id: thread.id,
      kind: "thread",
      title: thread.title || "Untitled",
      subtitle: thread.projectName || thread.cwd,
      value: thread.tokensUsed || 0,
      meta: `${countText("processes", thread.logProcessCount || 0)} · ${countText("snapshots", thread.shellSnapshotCount || 0)}`,
      updatedAt: thread.updatedAt,
      archived: thread.archived,
      color: toneColor(index),
    }));
}

function processChartRows(processes = []) {
  return [...processes]
    .sort((a, b) => (b.logCount || 0) - (a.logCount || 0))
    .map((process, index) => ({
      id: process.processUuid,
      kind: "process",
      title: process.pid ? `pid ${process.pid}` : shortId(process.processUuid),
      subtitle: process.command || process.processUuid,
      value: process.logCount || 0,
      meta: countText("conversations", process.threadCount || process.threads?.length || 0),
      updatedAt: process.lastAt,
      active: process.active,
      color: toneColor(index),
    }));
}

function topRowsWithOther(rows, limit, otherLabel = t("chart.other")) {
  const sorted = [...rows].filter((row) => (row.value || 0) > 0).sort((a, b) => b.value - a.value);
  const visible = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const restValue = rest.reduce((sum, row) => sum + (row.value || 0), 0);
  if (restValue > 0) {
    visible.push({
      id: "__other",
      title: otherLabel,
      subtitle: t("chart.merged", { count: rest.length }),
      value: restValue,
      meta: "",
      disabled: true,
      color: "#98a2b3",
    });
  }
  return visible;
}

function chartItemAttrs(row) {
  if (!row.kind || !row.id || row.disabled) return "";
  return `data-chart-kind="${escapeHtml(row.kind)}" data-chart-id="${escapeHtml(row.id)}"`;
}

function renderChartSwitch(scope, active, items) {
  return `
    <div class="chart-switch" role="tablist" aria-label="${escapeHtml(t("chart.type"))}">
      ${items
        .map(
          ([mode, label]) => `
            <button class="chart-switch-button ${mode === active ? "is-active" : ""}" type="button"
              data-chart-scope="${escapeHtml(scope)}" data-chart-mode="${escapeHtml(mode)}"
              aria-pressed="${mode === active ? "true" : "false"}">
              ${escapeHtml(label)}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderMetricShell({ eyebrow, title, subtitle, controls = "", filters = "", body }) {
  return `
    <div class="metric-shell">
      <div class="metric-shell-header">
        <div class="page-title">
          <span class="eyebrow">${escapeHtml(eyebrow)}</span>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <div class="metric-toolbar">
          ${controls}
          ${filters}
          <button class="back-button" type="button" data-action="show-workspace">${escapeHtml(t("controls.backList"))}</button>
        </div>
      </div>
      <div class="metric-chart-body">${body}</div>
    </div>
  `;
}

function updateMetricViewHeight() {
  if (!els.overviewVisuals.classList.contains("is-metric-view")) return;
  const shellStyles = window.getComputedStyle(document.querySelector(".app-shell"));
  const visualStyles = window.getComputedStyle(els.overviewVisuals);
  const bottomPadding = Number.parseFloat(shellStyles.paddingBottom) || 0;
  const bottomMargin = Number.parseFloat(visualStyles.marginBottom) || 0;
  const top = els.overviewVisuals.getBoundingClientRect().top;
  const available = window.innerHeight - top - bottomPadding - bottomMargin;
  els.overviewVisuals.style.setProperty("--metric-view-height", `${Math.max(180, available)}px`);
}

function showMetricPage(html) {
  els.metrics.hidden = false;
  els.overviewVisuals.hidden = false;
  els.overviewVisuals.classList.add("is-metric-view");
  els.workspace.hidden = true;
  els.insightPage.hidden = true;
  els.insightPage.innerHTML = "";
  els.overviewVisuals.innerHTML = html;
  window.scrollTo({ top: 0 });
  updateMetricViewHeight();
}

function renderMetricLoading(title) {
  showMetricPage(
    renderMetricShell({
      eyebrow: "Loading",
      title,
      subtitle: t("loading.readingIndex"),
      body: `<div class="empty-state">${escapeHtml(t("loading.loading"))}</div>`,
    }),
  );
}

function renderChartEmpty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderHorizontalBars(rows, options = {}) {
  const data = topRowsWithOther(rows, options.limit || 20, options.otherLabel || t("chart.other"));
  if (!data.length) return renderChartEmpty(options.empty || t("empty.noData"));

  const maxValue = Math.max(1, ...data.map((row) => row.value || 0));
  return `
    <div class="rank-chart">
      ${data
        .map((row, index) => {
          const width = Math.max(3, Math.round(((row.value || 0) / maxValue) * 100));
          const tag = row.kind && !row.disabled ? "button" : "div";
          const attrs = row.kind && !row.disabled ? `type="button" ${chartItemAttrs(row)}` : "";
          return `
            <${tag} class="rank-row ${row.disabled ? "is-muted" : ""}" ${attrs}
              title="${escapeHtml(`${row.title}${row.subtitle ? ` · ${row.subtitle}` : ""}`)}">
              <span class="rank-index">${String(index + 1).padStart(2, "0")}</span>
              <span class="rank-label">
                <strong>${escapeHtml(shortLabel(row.title, 34))}</strong>
                <small>${escapeHtml(row.subtitle || row.meta || "")}</small>
              </span>
              <span class="rank-track" aria-hidden="true">
                <span class="rank-fill" style="width:${width}%; background:${escapeHtml(row.color || toneColor(index))}"></span>
              </span>
              <span class="rank-value">${compactNumber(row.value)} ${escapeHtml(options.unit || "")}</span>
            </${tag}>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderParetoChart(rows, options = {}) {
  const data = topRowsWithOther(rows, options.limit || 30, options.otherLabel || t("chart.other"));
  if (!data.length) return renderChartEmpty(options.empty || t("empty.noData"));

  const total = data.reduce((sum, row) => sum + (row.value || 0), 0) || 1;
  const maxValue = Math.max(1, ...data.map((row) => row.value || 0));
  let cumulative = 0;
  return `
    <div class="pareto-chart">
      ${data
        .map((row, index) => {
          cumulative += row.value || 0;
          const barWidth = Math.max(3, Math.round(((row.value || 0) / maxValue) * 100));
          const cumulativePercent = Math.round((cumulative / total) * 100);
          const tag = row.kind && !row.disabled ? "button" : "div";
          const attrs = row.kind && !row.disabled ? `type="button" ${chartItemAttrs(row)}` : "";
          return `
            <${tag} class="pareto-row ${row.disabled ? "is-muted" : ""}" ${attrs}>
              <span class="rank-index">${String(index + 1).padStart(2, "0")}</span>
              <span class="pareto-name" title="${escapeHtml(row.title)}">${escapeHtml(shortLabel(row.title, 28))}</span>
              <span class="pareto-bars">
                <span class="pareto-bar" style="width:${barWidth}%; background:${escapeHtml(row.color || toneColor(index))}"></span>
                <span class="pareto-line" style="left:${cumulativePercent}%"></span>
              </span>
              <span class="pareto-value">${compactNumber(row.value)}</span>
              <span class="pareto-percent">${cumulativePercent}%</span>
            </${tag}>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderProjectTable(rows) {
  if (!rows.length) return renderChartEmpty(t("empty.noProjectData"));
  const maxValue = Math.max(1, ...rows.map((row) => row.value || 0));
  return `
    <div class="chart-table project-table" role="table">
      <div class="chart-table-head" role="row">
        <span>${escapeHtml(t("table.project"))}</span><span>${escapeHtml(t("table.tokens"))}</span><span>${escapeHtml(
          t("table.status"),
        )}</span><span>${escapeHtml(t("table.lastActive"))}</span>
      </div>
      ${rows
        .map((row) => {
          const width = Math.max(3, Math.round(((row.value || 0) / maxValue) * 100));
          return `
            <button class="chart-table-row" type="button" role="row" ${chartItemAttrs(row)}>
              <span class="table-title">
                <strong>${escapeHtml(row.title)}</strong>
                <small>${escapeHtml(row.subtitle || "")}</small>
              </span>
              <span>
                <strong>${compactNumber(row.value)}</strong>
                <span class="mini-progress" aria-hidden="true"><span style="width:${width}%"></span></span>
              </span>
              <span>${escapeHtml(row.status || "-")}</span>
              <span>${formatDate(row.updatedAt)}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderThreadTable(rows) {
  if (!rows.length) return renderChartEmpty(t("empty.noThreadData"));
  const maxValue = Math.max(1, ...rows.map((row) => row.value || 0));
  return `
    <div class="chart-table thread-table" role="table">
      <div class="chart-table-head" role="row">
        <span>${escapeHtml(t("table.conversation"))}</span><span>${escapeHtml(t("table.project"))}</span><span>${escapeHtml(
          t("table.tokens"),
        )}</span><span>${escapeHtml(t("table.lastActive"))}</span>
      </div>
      ${rows.slice(0, 80)
        .map((row) => {
          const width = Math.max(3, Math.round(((row.value || 0) / maxValue) * 100));
          return `
            <button class="chart-table-row" type="button" role="row" ${chartItemAttrs(row)}>
              <span class="table-title" title="${escapeHtml(row.title)}">
                <strong>${escapeHtml(row.title)}</strong>
                <small>${escapeHtml(row.meta || "")}</small>
              </span>
              <span>${escapeHtml(row.subtitle || "-")}</span>
              <span>
                <strong>${compactNumber(row.value)}</strong>
                <span class="mini-progress" aria-hidden="true"><span style="width:${width}%"></span></span>
              </span>
              <span>${formatDate(row.updatedAt)}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderProcessTable(rows) {
  if (!rows.length) return renderChartEmpty(t("empty.noProcesses"));
  const maxValue = Math.max(1, ...rows.map((row) => row.value || 0));
  return `
    <div class="chart-table process-table" role="table">
      <div class="chart-table-head" role="row">
        <span>${escapeHtml(t("table.process"))}</span><span>${escapeHtml(t("table.status"))}</span><span>${escapeHtml(
          t("table.logs"),
        )}</span><span>${escapeHtml(t("table.lastActive"))}</span>
      </div>
      ${rows.slice(0, 80)
        .map((row) => {
          const width = Math.max(3, Math.round(((row.value || 0) / maxValue) * 100));
          return `
            <button class="chart-table-row" type="button" role="row" ${chartItemAttrs(row)}>
              <span class="table-title">
                <strong>${escapeHtml(row.title)}</strong>
                <small>${escapeHtml(row.subtitle || "")}</small>
              </span>
              <span><span class="chip ${row.active ? "active" : "idle"}">${
                row.active ? t("status.running") : t("status.stopped")
              }</span></span>
              <span>
                <strong>${compactNumber(row.value)}</strong>
                <span class="mini-progress" aria-hidden="true"><span style="width:${width}%"></span></span>
              </span>
              <span>${formatFullDate(row.updatedAt)}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderTreemapChart(svgElement, rows, options = {}) {
  if (!svgElement || typeof d3 === "undefined") return;
  const data = rows.filter((row) => (row.value || 0) > 0).slice(0, options.limit || 40);
  const width = Math.max(720, svgElement.parentElement.clientWidth || 720);
  const height = options.height || 420;

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet").style("height", `${height}px`);

  if (!data.length) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#6a7284")
      .text(t("empty.noData"));
    return;
  }

  const root = d3
    .hierarchy({ children: data })
    .sum((node) => node.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));
  d3.treemap().size([width, height]).paddingInner(4).round(true)(root);

  const groups = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (node) => `translate(${node.x0},${node.y0})`)
    .attr("class", "treemap-node")
    .on("click", (_, node) => {
      if (node.data.kind === "project") openProjectPage(node.data.id);
      if (node.data.kind === "thread") openThreadPage(node.data.id);
    });

  groups.append("title").text((node) => `${node.data.title} · ${compactNumber(node.data.value)}`);
  groups
    .append("rect")
    .attr("width", (node) => Math.max(0, node.x1 - node.x0))
    .attr("height", (node) => Math.max(0, node.y1 - node.y0))
    .attr("rx", 7)
    .attr("fill", (node, index) => node.data.color || toneColor(index))
    .attr("fill-opacity", 0.76);

  groups
    .filter((node) => node.x1 - node.x0 > 96 && node.y1 - node.y0 > 46)
    .append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("class", "treemap-label")
    .text((node) => shortLabel(node.data.title, 22));

  groups
    .filter((node) => node.x1 - node.x0 > 112 && node.y1 - node.y0 > 70)
    .append("text")
    .attr("x", 10)
    .attr("y", 40)
    .attr("class", "treemap-meta")
    .text((node) => `${compactNumber(node.data.value)} tokens`);
}

function buildTokenSeries(threads) {
  const buckets = new Map();
  for (const thread of threads) {
    const tokens = Number(thread.tokensUsed || 0);
    const timestamp = Number(thread.updatedAtMs || new Date(thread.updatedAt || 0).getTime());
    if (!tokens || !timestamp || Number.isNaN(timestamp)) continue;
    const date = new Date(timestamp);
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    buckets.set(day, (buckets.get(day) || 0) + tokens);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, value]) => ({ date: new Date(day), value }));
}

function renderTokenLineChart(svgElement, series) {
  if (!svgElement || typeof d3 === "undefined") return;
  const width = Math.max(720, svgElement.parentElement.clientWidth || 720);
  const height = 380;
  const margin = { top: 18, right: 26, bottom: 42, left: 76 };
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet").style("height", `${height}px`);

  if (!series.length) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#6a7284")
      .text(t("empty.noTokenTime"));
    return;
  }

  const dates = series.map((point) => point.date);
  let xDomain = d3.extent(dates);
  if (xDomain[0].getTime() === xDomain[1].getTime()) {
    xDomain = [
      new Date(xDomain[0].getTime() - 86400000),
      new Date(xDomain[1].getTime() + 86400000),
    ];
  }
  const x = d3.scaleTime().domain(xDomain).range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([0, Math.max(1, d3.max(series, (point) => point.value) || 0) * 1.12])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%m/%d")));

  svg
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat((value) => compactNumber(value)));

  const area = d3
    .area()
    .x((point) => x(point.date))
    .y0(height - margin.bottom)
    .y1((point) => y(point.value))
    .curve(d3.curveMonotoneX);
  const line = d3
    .line()
    .x((point) => x(point.date))
    .y((point) => y(point.value))
    .curve(d3.curveMonotoneX);

  svg.append("path").datum(series).attr("class", "token-area").attr("d", area);
  svg.append("path").datum(series).attr("class", "token-line").attr("d", line);
  svg
    .append("g")
    .selectAll("circle")
    .data(series)
    .join("circle")
    .attr("class", "token-point")
    .attr("cx", (point) => x(point.date))
    .attr("cy", (point) => y(point.value))
    .attr("r", 4)
    .append("title")
    .text((point) => `${formatDate(point.date)} · ${compactNumber(point.value)} tokens`);
}

function renderProjectsMetricPage() {
  const rows = projectChartRows();
  const controls = renderChartSwitch("projects", state.projectChartMode, [
    ["bubble", t("chart.bubble")],
    ["bars", "Top-N"],
    ["pareto", "Pareto"],
    ["treemap", "Treemap"],
    ["table", t("chart.table")],
  ]);
  let body = "";
  if (state.projectChartMode === "bars") {
    body = renderHorizontalBars(rows, { limit: 20, unit: "tokens", otherLabel: t("chart.otherProjects") });
  } else if (state.projectChartMode === "pareto") {
    body = renderParetoChart(rows, { limit: 30, unit: "tokens", otherLabel: t("chart.otherProjects") });
  } else if (state.projectChartMode === "treemap") {
    body = `<div class="treemap-wrap"><svg data-chart="project-treemap" role="img" aria-label="${escapeHtml(
      t("chart.projectTreemapAria"),
    )}"></svg></div>`;
  } else if (state.projectChartMode === "table") {
    body = renderProjectTable(rows);
  } else {
    body = `
      <div class="force-chart-wrap metric-chart-large metric-chart-fill">
        <svg class="force-chart" data-chart="project-bubbles" role="img" aria-label="${escapeHtml(
          t("chart.projectBubbleAria"),
        )}"></svg>
      </div>
    `;
  }

  showMetricPage(
    renderMetricShell({
      eyebrow: "Project Atlas",
      title: t("chart.projectTitle"),
      subtitle: t("chart.projectSubtitle"),
      controls,
      body,
    }),
  );

  if (state.projectChartMode === "treemap") {
    renderTreemapChart(els.overviewVisuals.querySelector("[data-chart='project-treemap']"), rows, {
      height: 460,
    });
  } else if (state.projectChartMode === "bubble") {
    renderForceBubbleChart(els.overviewVisuals.querySelector("[data-chart='project-bubbles']"), projectBubbleNodes(), {
      id: "metric-projects",
      fillHeight: true,
      draggable: true,
    });
  }
}

function renderThreadsMetricPage() {
  const rows = threadChartRows();
  const controls = renderChartSwitch("threads", state.threadChartMode, [
    ["bars", "Top-N"],
    ["pareto", "Pareto"],
    ["table", t("chart.table")],
  ]);
  const body =
    state.threadChartMode === "pareto"
      ? renderParetoChart(rows, { limit: 30, otherLabel: t("chart.otherThreads") })
      : state.threadChartMode === "table"
        ? renderThreadTable(rows)
        : renderHorizontalBars(rows, { limit: 30, unit: "tokens", otherLabel: t("chart.otherThreads") });

  showMetricPage(
    renderMetricShell({
      eyebrow: "Conversations",
      title: t("chart.threadTitle"),
      subtitle: t("chart.threadSubtitle"),
      controls,
      body,
    }),
  );
}

function renderProcessesMetricPage(processes, activeOnly = false) {
  const rows = processChartRows(activeOnly ? processes.filter((process) => process.active) : processes);
  const controls = renderChartSwitch("processes", state.processChartMode, [
    ["table", t("chart.table")],
    ["bars", "Top-N"],
  ]);
  const body =
    state.processChartMode === "bars"
      ? renderHorizontalBars(rows, { limit: 30, unit: "logs", otherLabel: t("chart.otherProcesses") })
      : renderProcessTable(rows);

  showMetricPage(
    renderMetricShell({
      eyebrow: activeOnly ? "Active Processes" : "Processes",
      title: activeOnly ? t("chart.activeProcessTitle") : t("chart.processTitle"),
      subtitle: t("chart.processSubtitle"),
      controls,
      body,
    }),
  );
}

function renderSnapshotsMetricPage() {
  const rows = [...(state.overview?.projects || [])]
    .sort((a, b) => (b.shellSnapshotCount || 0) - (a.shellSnapshotCount || 0))
    .map((project, index) => ({
      id: project.cwd,
      kind: "project",
      title: project.name,
      subtitle: project.cwd,
      value: project.shellSnapshotCount || 0,
      color: toneColor(index),
    }));

  showMetricPage(
    renderMetricShell({
      eyebrow: "Shell Snapshots",
      title: t("chart.snapshotTitle"),
      subtitle: t("chart.snapshotSubtitle"),
      body: renderHorizontalBars(rows, { limit: 20, unit: "snapshots", otherLabel: t("chart.otherProjects") }),
    }),
  );
}

function renderArchivedMetricPage() {
  const rows = threadChartRows().filter((thread) => thread.archived);
  showMetricPage(
    renderMetricShell({
      eyebrow: "Archived",
      title: t("chart.archivedTitle"),
      subtitle: t("chart.archivedSubtitle"),
      body: renderThreadTable(rows),
    }),
  );
}

function renderTokensMetricPage() {
  const projects = state.overview?.projects || [];
  if (state.tokenProjectCwd !== "all" && !projects.some((project) => project.cwd === state.tokenProjectCwd)) {
    state.tokenProjectCwd = "all";
  }
  const threads =
    state.tokenProjectCwd === "all"
      ? allThreadRows()
      : allThreadRows().filter((thread) => thread.cwd === state.tokenProjectCwd);
  const series = buildTokenSeries(threads);
  const total = series.reduce((sum, point) => sum + point.value, 0);
  const filters = `
    <select id="token-project-select" class="metric-select" aria-label="${escapeHtml(t("controls.projectSelect"))}">
      <option value="all"${state.tokenProjectCwd === "all" ? " selected" : ""}>${escapeHtml(t("chart.allProjects"))}</option>
      ${projects
        .map(
          (project) => `
            <option value="${escapeHtml(project.cwd)}"${state.tokenProjectCwd === project.cwd ? " selected" : ""}>
              ${escapeHtml(project.name)}
            </option>
          `,
        )
        .join("")}
    </select>
  `;

  showMetricPage(
    renderMetricShell({
      eyebrow: "Tokens",
      title: t("chart.tokenTitle"),
      subtitle: t("chart.tokenSubtitle", { count: series.length, total: compactNumber(total) }),
      filters,
      body: `
        <div class="line-chart-wrap">
          <svg data-chart="tokens-line" role="img" aria-label="${escapeHtml(t("chart.tokenLineAria"))}"></svg>
        </div>
      `,
    }),
  );
  renderTokenLineChart(els.overviewVisuals.querySelector("[data-chart='tokens-line']"), series);
}

async function openMetricPage(page) {
  state.metricPage = page;
  renderMetrics();

  if (page === "projects") {
    renderProjectsMetricPage();
    return;
  }
  if (page === "threads") {
    renderThreadsMetricPage();
    return;
  }
  if (page === "snapshots") {
    renderSnapshotsMetricPage();
    return;
  }
  if (page === "archived") {
    renderArchivedMetricPage();
    return;
  }
  if (page === "tokens") {
    renderTokensMetricPage();
    return;
  }
  if (page === "processes" || page === "active-processes") {
    renderMetricLoading(page === "active-processes" ? t("loading.openActiveProcesses") : t("loading.openProcessClues"));
    const overview = await ensureProcessOverview();
    if (state.metricPage !== page) return;
    renderProcessesMetricPage(overview.processes || [], page === "active-processes");
  }
}

function openChartItem(kind, id) {
  if (!kind || !id) return;
  if (kind === "project") {
    openProjectPage(id);
  } else if (kind === "thread") {
    openThreadPage(id);
  } else if (kind === "process") {
    openProcessPage(id);
  }
}

function getVisibleProjects() {
  const query = els.projectSearch.value.trim().toLowerCase();
  const sorted = [...(state.overview?.projects || [])];
  const sortBy = els.projectSort.value;
  sorted.sort((a, b) => {
    if (sortBy === "threads") return b.threadCount - a.threadCount;
    if (sortBy === "processes") return b.processCount - a.processCount;
    if (sortBy === "tokens") return b.tokensUsed - a.tokensUsed;
    return (b.lastUpdatedMs || 0) - (a.lastUpdatedMs || 0);
  });

  if (!query) return sorted;
  return sorted.filter((project) => {
    const haystack = [
      project.name,
      project.cwd,
      project.models.join(" "),
      project.branches.join(" "),
      project.remotes.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function renderProjects() {
  const projects = getVisibleProjects();
  if (projects.length === 0) {
    els.projectList.innerHTML = `<div class="empty-state">${escapeHtml(t("empty.noProjects"))}</div>`;
    return;
  }

  els.projectList.innerHTML = projects
    .map(
      (project) => `
        <button class="project-row ${project.cwd === state.selectedCwd ? "is-active" : ""}" data-cwd="${escapeHtml(
          project.cwd,
        )}" type="button">
          <div class="row-title">
            <strong>${escapeHtml(project.name)}</strong>
            <span class="chip ${escapeHtml(project.status)}">${statusText(project.status)}</span>
          </div>
          <div class="path">${escapeHtml(project.cwd)}</div>
          <div class="chips">
            <span class="chip">${escapeHtml(countText("conversations", project.threadCount))}</span>
            <span class="chip">${escapeHtml(countText("processes", project.processCount))}</span>
            <span class="chip">${compactNumber(project.tokensUsed)} tokens</span>
            <span class="chip">${formatDate(project.lastUpdatedAt)}</span>
          </div>
        </button>
      `,
    )
    .join("");

  for (const row of els.projectList.querySelectorAll(".project-row")) {
    row.addEventListener("click", () => {
      hideMetricPage();
      selectProject(row.dataset.cwd);
    });
  }
}

function renderProjectSummary(project) {
  const items = [
    [t("detail.conversation"), project.threadCount || 0],
    [t("detail.process"), t("count.activeProcessRatio", { active: project.activeProcessCount || 0, total: project.processCount || 0 })],
    [t("detail.snapshot"), project.shellSnapshotCount || 0],
    [t("detail.token"), compactNumber(project.tokensUsed || 0)],
  ];
  els.projectSummary.innerHTML = items
    .map(
      ([label, value]) => `
        <div class="summary-item">
          <span class="eyebrow">${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `,
    )
    .join("");
}

function getVisibleThreads(project) {
  const filter = els.threadFilter.value;
  const threads = [...(project?.threads || [])];
  if (filter === "active") {
    return threads.filter((thread) => thread.logProcessCount > 0);
  }
  if (filter === "snapshots") {
    return threads.filter((thread) => thread.shellSnapshotCount > 0);
  }
  if (filter === "archived") {
    return threads.filter((thread) => thread.archived);
  }
  return threads;
}

function renderThreads() {
  const project = state.projectDetail;
  if (!project) {
    els.projectTitle.textContent = t("headings.conversations");
    els.projectPathLabel.textContent = "Conversation";
    els.threadList.innerHTML = `<div class="empty-state">${escapeHtml(t("empty.selectProject"))}</div>`;
    els.projectSummary.innerHTML = "";
    return;
  }

  els.projectTitle.textContent = project.name || t("headings.conversations");
  els.projectPathLabel.textContent = project.cwd || "Conversation";
  renderProjectSummary(project);

  const threads = getVisibleThreads(project);
  if (threads.length === 0) {
    els.threadList.innerHTML = `<div class="empty-state">${escapeHtml(t("empty.noThreads"))}</div>`;
    return;
  }

  els.threadList.innerHTML = threads
    .map(
      (thread) => `
        <button class="thread-row ${thread.id === state.selectedThreadId ? "is-active" : ""}" data-thread-id="${escapeHtml(
          thread.id,
        )}" type="button">
          <div class="row-title">
            <strong>${escapeHtml(thread.title)}</strong>
            <span class="chip ${thread.archived ? "warn" : "recent"}">${thread.archived ? t("status.archived") : formatDate(
              thread.updatedAt,
            )}</span>
          </div>
          <div class="preview">${escapeHtml(thread.preview || t("empty.noPreview"))}</div>
          <div class="chips">
            <span class="chip">${escapeHtml(thread.model || "model")}</span>
            <span class="chip">${escapeHtml(thread.gitBranch || "branch")}</span>
            <span class="chip">${escapeHtml(countText("processes", thread.logProcessCount || 0))}</span>
            <span class="chip">${escapeHtml(countText("snapshots", thread.shellSnapshotCount || 0))}</span>
          </div>
        </button>
      `,
    )
    .join("");

  for (const row of els.threadList.querySelectorAll(".thread-row")) {
    row.addEventListener("click", () => {
      hideMetricPage();
      selectThread(row.dataset.threadId);
    });
  }
}

function renderThreadMeta() {
  const detail = state.threadDetail;
  if (!detail) {
    els.threadIdLabel.textContent = "Thread";
    els.threadTitle.textContent = t("headings.threadHistory");
    els.threadMeta.innerHTML = "";
    return;
  }
  const thread = detail.thread;
  els.threadIdLabel.textContent = thread.id;
  els.threadTitle.textContent = thread.title;
  const rolloutStats = detail.rollout?.stats || {};
  const chips = [
    thread.cwd,
    thread.model,
    thread.reasoningEffort,
    thread.gitBranch,
    countText("events", rolloutStats.totalEvents || 0),
    countText("processes", detail.processes.length),
    countText("snapshots", detail.shellSnapshots.length),
  ].filter(Boolean);

  els.threadMeta.innerHTML = chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("");
}

function eventTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function renderTimeline(detail) {
  const timeline = detail.rollout?.timeline || [];
  if (timeline.length === 0) {
    return `<div class="empty-state">${escapeHtml(t("empty.noRollout"))}</div>`;
  }

  return `
    <div class="timeline">
      ${timeline
        .map(
          (event) => `
            <article class="event-row ${escapeHtml(event.category)}">
              <time class="event-time">${eventTime(event.timestamp)}</time>
              <div class="event-body">
                <div class="event-label">
                  <h3>${escapeHtml(event.label)}</h3>
                  <span class="chip">${escapeHtml(event.actor)}</span>
                </div>
                <div class="event-text">${escapeHtml(event.text || event.category)}</div>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderLogs(detail) {
  if (!detail.logs.length) {
    return `<div class="empty-state">${escapeHtml(t("empty.noLogs"))}</div>`;
  }

  return `
    <div class="log-list">
      ${detail.logs
        .map(
          (log) => `
            <article class="log-row ${escapeHtml(log.level)}">
              <div class="event-label">
                <h3>${escapeHtml(log.level)} · ${escapeHtml(log.target || "log")}</h3>
                <span class="chip">${formatFullDate(log.at)}</span>
              </div>
              <div class="log-body">${escapeHtml(log.body || "")}</div>
              <div class="chips">
                <span class="chip">${escapeHtml(log.modulePath || "module")}</span>
                <span class="chip">${escapeHtml(log.processUuid || "process")}</span>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBars(processes) {
  const maxLogs = Math.max(1, ...processes.map((process) => process.logCount || 0));
  return `
    <div class="bars">
      ${processes
        .slice(0, 12)
        .map((process) => {
          const width = Math.max(4, Math.round(((process.logCount || 0) / maxLogs) * 100));
          return `
            <div class="bar-line">
              <span>pid ${escapeHtml(process.pid || "-")}</span>
              <span class="bar-track"><span class="bar-fill" style="width:${width}%"></span></span>
              <span>${compactNumber(process.logCount)}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderProcesses(detail) {
  if (!detail.processes.length) {
    return `<div class="empty-state">${escapeHtml(t("empty.noProcesses"))}</div>`;
  }

  return `
    ${renderBars(detail.processes)}
    <div class="process-list">
      ${detail.processes
        .map(
          (process) => `
            <button class="process-row process-link" data-process-uuid="${escapeHtml(
              process.processUuid,
            )}" type="button">
              <div>
                <div class="event-label">
                  <h3>pid ${escapeHtml(process.pid || "-")}</h3>
                  <span class="chip ${process.active ? "active" : "idle"}">${
                    process.active ? t("status.running") : t("status.stopped")
                  }</span>
                </div>
                <div class="process-command">${escapeHtml(process.command || process.processUuid)}</div>
                <div class="chips">
                  <span class="chip">${escapeHtml(countText("logs", compactNumber(process.logCount)))}</span>
                  <span class="chip">${formatFullDate(process.lastAt)}</span>
                  <span class="chip">${escapeHtml(process.stat || "stat")}</span>
                  <span class="chip">CPU ${process.pcpu ?? "-"}</span>
                  <span class="chip">MEM ${process.pmem ?? "-"}</span>
                </div>
              </div>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderDetail() {
  renderThreadMeta();
  const detail = state.threadDetail;
  if (!detail) {
    els.detailContent.innerHTML = `<div class="empty-state">${escapeHtml(t("empty.selectThread"))}</div>`;
    return;
  }

  if (state.activeTab === "logs") {
    els.detailContent.innerHTML = renderLogs(detail);
  } else if (state.activeTab === "processes") {
    els.detailContent.innerHTML = renderProcesses(detail);
  } else {
    els.detailContent.innerHTML = renderTimeline(detail);
  }
}

function showDashboard(options = {}) {
  const { showVisuals = false } = options;
  els.metrics.hidden = false;
  if (!showVisuals) {
    state.metricPage = null;
    renderMetrics();
  }
  els.overviewVisuals.hidden = !showVisuals;
  els.overviewVisuals.classList.remove("is-metric-view");
  els.overviewVisuals.style.removeProperty("--metric-view-height");
  if (!showVisuals) {
    els.overviewVisuals.innerHTML = "";
  }
  els.workspace.hidden = false;
  els.insightPage.hidden = true;
  els.insightPage.innerHTML = "";
}

function hideMetricPage() {
  state.metricPage = null;
  renderMetrics();
  els.overviewVisuals.hidden = true;
  els.overviewVisuals.classList.remove("is-metric-view");
  els.overviewVisuals.style.removeProperty("--metric-view-height");
  els.overviewVisuals.innerHTML = "";
}

function showInsightPage(html) {
  state.metricPage = null;
  renderMetrics();
  els.metrics.hidden = true;
  els.overviewVisuals.hidden = true;
  els.overviewVisuals.classList.remove("is-metric-view");
  els.overviewVisuals.style.removeProperty("--metric-view-height");
  els.workspace.hidden = true;
  els.insightPage.hidden = false;
  els.insightPage.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function returnHomeAndRefresh() {
  showDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
  await refreshNow();
}

function renderInsightLoading(title) {
  showInsightPage(`
    <div class="insight-loading">
      <button class="back-button" type="button" data-action="back">${escapeHtml(t("controls.backOverview"))}</button>
      <div>
        <span class="eyebrow">${escapeHtml(t("loading.label"))}</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
    </div>
  `);
}

function renderPageHero({ eyebrow, title, subtitle, chips = [] }) {
  return `
    <div class="page-hero">
      <button class="back-button" type="button" data-action="back">${escapeHtml(t("controls.backOverview"))}</button>
      <div class="page-title">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2>${escapeHtml(title)}</h2>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
      <div class="page-chips">
        ${chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderStatGrid(items) {
  return `
    <div class="detail-stat-grid">
      ${items
        .map(
          ([label, value]) => `
            <div class="summary-item">
              <span class="eyebrow">${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderThreadBubbles(threads) {
  const visibleThreads = [...(threads || [])]
    .sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0))
    .slice(0, 18);
  if (!visibleThreads.length) {
    return `<div class="empty-state">${escapeHtml(t("empty.noThreadBubbles"))}</div>`;
  }

  return `
    <div class="force-chart-wrap force-chart-compact">
      <svg class="force-chart" data-chart="project-threads" role="img" aria-label="${escapeHtml(
        t("chart.threadDistributionAria"),
      )}"></svg>
    </div>
  `;
}

function threadNodesFromThreads(threads, valueKey = "tokensUsed", limit = 24) {
  return [...(threads || [])]
    .sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
    .slice(0, limit)
    .map((thread, index) => ({
      id: thread.id || thread.threadId,
      label: thread.title || "thread",
      value: thread[valueKey] || 0,
      meta:
        valueKey === "logCount"
          ? countText("logs", compactNumber(thread[valueKey] || 0))
          : `${compactNumber(thread[valueKey] || 0)} tokens`,
      color: toneColor(index),
      kind: "thread",
    }));
}

function processNodesFromProcesses(processes, limit = 30) {
  return [...(processes || [])]
    .sort((a, b) => (b.logCount || 0) - (a.logCount || 0))
    .slice(0, limit)
    .map((process, index) => ({
      id: process.processUuid,
      label: process.pid ? `pid ${process.pid}` : shortId(process.processUuid),
      value: process.logCount || 0,
      meta: countText("logs", compactNumber(process.logCount || 0)),
      color: toneColor(index),
      kind: "process",
    }));
}

function renderProcessButtons(processes, limit = 8) {
  const visible = [...(processes || [])].slice(0, limit);
  if (!visible.length) {
    return `<div class="empty-state">${escapeHtml(t("empty.noProcesses"))}</div>`;
  }

  return `
    <div class="process-stack">
      ${visible
        .map(
          (process) => `
            <button class="process-row process-link" data-process-uuid="${escapeHtml(
              process.processUuid,
            )}" type="button">
              <div>
                <div class="event-label">
                  <h3>${process.pid ? `pid ${escapeHtml(process.pid)}` : shortId(process.processUuid)}</h3>
                  <span class="chip ${process.active ? "active" : "idle"}">${
                    process.active ? t("status.running") : t("status.stopped")
                  }</span>
                </div>
                <div class="process-command">${escapeHtml(process.command || process.processUuid)}</div>
                <div class="chips">
                  <span class="chip">${escapeHtml(countText("logs", compactNumber(process.logCount)))}</span>
                  <span class="chip">${formatFullDate(process.lastAt)}</span>
                </div>
              </div>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

async function openProjectPage(cwd) {
  if (!cwd) return;
  renderInsightLoading(t("loading.openProject"));

  const detail =
    state.projectDetail?.cwd === cwd
      ? state.projectDetail
      : await requestJson(`/api/project?cwd=${encodeURIComponent(cwd)}`);
  state.selectedCwd = cwd;
  state.projectDetail = detail;
  renderProjects();
  renderThreads();

  showInsightPage(`
    ${renderPageHero({
      eyebrow: "Project Detail",
      title: detail.name || t("detail.project"),
      subtitle: detail.cwd,
      chips: [
        countText("conversations", detail.threadCount || 0),
        countText("processes", detail.processCount || 0),
        `${compactNumber(detail.tokensUsed || 0)} tokens`,
        countText("snapshots", detail.shellSnapshotCount || 0),
      ],
    })}
    ${renderStatGrid([
      [t("detail.conversation"), detail.threadCount || 0],
      [t("detail.activeProcess"), t("count.activeProcessRatio", { active: detail.activeProcessCount || 0, total: detail.processCount || 0 })],
      [t("detail.branch"), detail.branches?.slice(0, 1).join(", ") || t("empty.none")],
      [t("detail.lastUpdated"), formatDate(detail.lastUpdatedAt)],
    ])}
    <div class="insight-layout">
      <section class="glass-panel">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Token Bubbles</span>
              <h3>${escapeHtml(t("detail.threadDistribution"))}</h3>
            </div>
          <p>${escapeHtml(t("detail.bubbleTokenHint"))}</p>
        </div>
        ${renderThreadBubbles(detail.threads)}
      </section>
      <aside class="glass-panel">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Processes</span>
              <h3>${escapeHtml(t("detail.processClues"))}</h3>
          </div>
        </div>
        ${renderProcessButtons(detail.processes, 10)}
      </aside>
    </div>
  `);
  renderForceBubbleChart(els.insightPage.querySelector("[data-chart='project-threads']"), threadNodesFromThreads(detail.threads), {
    id: "project-threads",
    height: 320,
  });
}

async function openThreadPage(threadId) {
  if (!threadId) return;
  renderInsightLoading(t("loading.openThread"));

  const detail =
    state.threadDetail?.thread?.id === threadId
      ? state.threadDetail
      : await requestJson(`/api/thread/${encodeURIComponent(threadId)}`);
  state.selectedThreadId = threadId;
  state.threadDetail = detail;
  renderThreads();

  const rolloutStats = detail.rollout?.stats || {};
  showInsightPage(`
    ${renderPageHero({
      eyebrow: "Thread Detail",
      title: detail.thread.title,
      subtitle: detail.thread.cwd,
      chips: [
        detail.thread.model || "model",
        detail.thread.reasoningEffort || "effort",
        detail.thread.gitBranch || "branch",
        `${compactNumber(detail.thread.tokensUsed || 0)} tokens`,
      ].filter(Boolean),
    })}
    <div class="insight-layout thread-layout">
      <section class="glass-panel">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Timeline</span>
          <h3>${escapeHtml(t("detail.timeline"))}</h3>
          </div>
          <p>${compactNumber(rolloutStats.totalEvents || 0)} events</p>
        </div>
        ${renderTimeline(detail)}
      </section>
      <aside class="insight-side">
        <div class="glass-panel token-focus">
          <span class="eyebrow">Token Weight</span>
          <div class="single-bubble tone-violet">
            <strong>${compactNumber(detail.thread.tokensUsed || 0)}</strong>
            <span>tokens</span>
          </div>
        </div>
        <div class="glass-panel">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Processes</span>
              <h3>${escapeHtml(t("detail.relatedProcesses"))}</h3>
            </div>
          </div>
          ${renderProcessButtons(detail.processes, 8)}
        </div>
      </aside>
    </div>
    <section class="glass-panel log-preview-panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Logs</span>
          <h3>${escapeHtml(t("detail.recentLogs"))}</h3>
        </div>
      </div>
      ${renderLogs(detail)}
    </section>
  `);
}

async function ensureProcessOverview() {
  if (!state.processOverview) {
    state.processOverview = await requestJson("/api/processes");
  }
  return state.processOverview;
}

async function openProcessOverviewPage() {
  renderInsightLoading(t("loading.openProcesses"));
  const overview = await ensureProcessOverview();
  const processes = overview.processes || [];

  showInsightPage(`
    ${renderPageHero({
      eyebrow: "Process Map",
      title: t("detail.processMap"),
      subtitle: t("detail.processMapSubtitle"),
      chips: [countText("processes", processes.length), overview.lookupAvailable ? "ps available" : "ps unavailable"],
    })}
    <section class="glass-panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Activity Bubbles</span>
          <h3>${escapeHtml(t("detail.processActivity"))}</h3>
        </div>
        <p>${escapeHtml(t("detail.bubbleLogHint"))}</p>
      </div>
      <div class="force-chart-wrap force-chart-compact">
        <svg class="force-chart" data-chart="process-overview" role="img" aria-label="${escapeHtml(
          t("chart.processActivityAria"),
        )}"></svg>
      </div>
    </section>
  `);
  renderForceBubbleChart(
    els.insightPage.querySelector("[data-chart='process-overview']"),
    processNodesFromProcesses(processes, 34),
    {
      id: "process-overview",
      height: 360,
    },
  );
}

async function openProcessPage(processUuid) {
  if (!processUuid) return;
  renderInsightLoading(t("loading.openProcess"));
  const overview = await ensureProcessOverview();
  const process = overview.processes?.find((item) => item.processUuid === processUuid);

  if (!process) {
    showInsightPage(`
      ${renderPageHero({
        eyebrow: "Process Detail",
        title: t("detail.processNotFound"),
        subtitle: processUuid,
      })}
      <div class="empty-state">${escapeHtml(t("empty.processNotIndexed"))}</div>
    `);
    return;
  }

  const relatedThreads = process.threads || [];
  showInsightPage(`
    ${renderPageHero({
      eyebrow: "Process Detail",
      title: process.pid ? `pid ${process.pid}` : shortId(process.processUuid),
      subtitle: process.command || process.processUuid,
      chips: [
        process.active ? t("status.running") : t("status.stopped"),
        countText("logs", compactNumber(process.logCount)),
        countText("threads", process.threadCount || relatedThreads.length),
        formatFullDate(process.lastAt),
      ],
    })}
    ${renderStatGrid([
      ["CPU", process.pcpu ?? "-"],
      ["MEM", process.pmem ?? "-"],
      [t("detail.state"), process.stat || "-"],
      [t("detail.runtime"), process.etime || "-"],
    ])}
    <section class="glass-panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Related Threads</span>
          <h3>${escapeHtml(t("detail.relatedThreads"))}</h3>
        </div>
        <p>${escapeHtml(t("detail.bubbleThreadLogHint"))}</p>
      </div>
      <div class="force-chart-wrap force-chart-compact">
        <svg class="force-chart" data-chart="process-threads" role="img" aria-label="${escapeHtml(
          t("chart.relatedThreadBubbleAria"),
        )}"></svg>
      </div>
    </section>
  `);
  renderForceBubbleChart(
    els.insightPage.querySelector("[data-chart='process-threads']"),
    threadNodesFromThreads(relatedThreads, "logCount", 26),
    {
      id: "process-threads",
      height: 340,
    },
  );
}

async function selectProject(cwd, options = {}) {
  if (!cwd) return;
  const { clearBeforeLoad = true, preferredThreadId = null } = options;
  state.selectedCwd = cwd;

  if (clearBeforeLoad) {
    state.projectDetail = null;
    state.threadDetail = null;
    state.selectedThreadId = null;
    renderProjects();
    renderThreads();
    renderDetail();
  } else {
    renderProjects();
  }

  const detail = await requestJson(`/api/project?cwd=${encodeURIComponent(cwd)}`);
  state.projectDetail = detail;
  const targetThread =
    detail.threads?.find((thread) => thread.id === preferredThreadId) || detail.threads?.[0];
  state.selectedThreadId = targetThread?.id || null;
  renderThreads();
  if (state.selectedThreadId) {
    await selectThread(state.selectedThreadId, { clearBeforeLoad });
  } else {
    renderDetail();
  }
}

async function selectThread(threadId, options = {}) {
  if (!threadId) return;
  const { clearBeforeLoad = true } = options;
  state.selectedThreadId = threadId;

  if (clearBeforeLoad) {
    state.threadDetail = null;
    renderThreads();
    renderDetail();
  } else {
    renderThreads();
  }

  const detail = await requestJson(`/api/thread/${encodeURIComponent(threadId)}`);
  if (state.selectedThreadId !== threadId) return;

  state.threadDetail = detail;
  renderThreads();
  renderDetail();
}

function setTab(tab) {
  state.activeTab = tab;
  for (const button of document.querySelectorAll(".tab-button")) {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  }
  renderDetail();
}

async function loadOverview(options = {}) {
  if (state.isLoading) return;
  const { showLoading = true } = options;
  state.isLoading = true;
  if (showLoading) {
    document.body.classList.add("loading");
  }

  try {
    const preferredThreadId = state.selectedThreadId;
    state.overview = await requestJson("/api/overview");
    state.processOverview = null;
    const firstProject = state.overview.projects?.[0];
    if (!state.selectedCwd || !state.overview.projects.some((project) => project.cwd === state.selectedCwd)) {
      state.selectedCwd = firstProject?.cwd || null;
    }
    const activeMetricPage = state.metricPage;
    renderMetrics();
    renderProjects();
    if (state.selectedCwd) {
      await selectProject(state.selectedCwd, {
        clearBeforeLoad: showLoading,
        preferredThreadId,
      });
    } else {
      renderThreads();
      renderDetail();
    }
    if (activeMetricPage) {
      await openMetricPage(activeMetricPage);
    }
  } catch (error) {
    els.detailContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  } finally {
    state.isLoading = false;
    if (showLoading) {
      document.body.classList.remove("loading");
    }
  }
}

els.projectSearch.addEventListener("input", renderProjects);
els.projectSort.addEventListener("change", renderProjects);
els.threadFilter.addEventListener("change", renderThreads);
els.languageSelect.addEventListener("change", () => setLanguage(els.languageSelect.value));
els.brandHome.addEventListener("click", returnHomeAndRefresh);
els.refreshNow.addEventListener("click", refreshNow);
els.refreshInterval.addEventListener("change", () => setRefreshMs(els.refreshInterval.value));
window.addEventListener("resize", updateMetricViewHeight);
els.overviewVisuals.addEventListener("click", (event) => {
  const backButton = event.target.closest("[data-action='show-workspace']");
  if (backButton) {
    showDashboard();
    return;
  }

  const chartButton = event.target.closest("[data-chart-mode]");
  if (chartButton) {
    const scope = chartButton.dataset.chartScope;
    if (scope === "projects") {
      state.projectChartMode = chartButton.dataset.chartMode;
      renderProjectsMetricPage();
    } else if (scope === "threads") {
      state.threadChartMode = chartButton.dataset.chartMode;
      renderThreadsMetricPage();
    } else if (scope === "processes") {
      state.processChartMode = chartButton.dataset.chartMode;
      openMetricPage(state.metricPage);
    }
    return;
  }

  const chartItem = event.target.closest("[data-chart-kind]");
  if (chartItem) {
    openChartItem(chartItem.dataset.chartKind, chartItem.dataset.chartId);
  }
});
els.overviewVisuals.addEventListener("change", (event) => {
  if (event.target.id === "token-project-select") {
    state.tokenProjectCwd = event.target.value;
    renderTokensMetricPage();
  }
});
els.detailContent.addEventListener("click", (event) => {
  const processLink = event.target.closest("[data-process-uuid]");
  if (processLink) {
    openProcessPage(processLink.dataset.processUuid);
  }
});
els.insightPage.addEventListener("click", (event) => {
  const backButton = event.target.closest("[data-action='back']");
  if (backButton) {
    showDashboard();
    return;
  }

  const projectLink = event.target.closest("[data-cwd]");
  if (projectLink) {
    openProjectPage(projectLink.dataset.cwd);
    return;
  }

  const threadLink = event.target.closest("[data-thread-id]");
  if (threadLink) {
    openThreadPage(threadLink.dataset.threadId);
    return;
  }

  const processLink = event.target.closest("[data-process-uuid]");
  if (processLink) {
    openProcessPage(processLink.dataset.processUuid);
  }
});
for (const button of document.querySelectorAll(".tab-button")) {
  button.addEventListener("click", () => setTab(button.dataset.tab));
}

setLanguage(readSavedLanguage(), { persist: false });
setRefreshMs(readSavedRefreshMs());
loadOverview();
