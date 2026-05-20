const statusEl = document.getElementById("status");
const languageSelect = document.getElementById("language-select");

const I18N = {
  zh: {
    privacy: "所有数据只在本机读取和展示。",
    language: "语言",
    open: "打开 goblin",
    check: "检查本机组件",
    statusIdle: "完全本地运行，不上传、不埋点。",
    checking: "正在检查...",
    connected: "已连接：{path}",
    unavailable: "本机组件未响应",
  },
  en: {
    privacy: "All data is read and displayed only on this machine.",
    language: "Language",
    open: "Open goblin",
    check: "Check native host",
    statusIdle: "Fully local. No uploads, no tracking.",
    checking: "Checking...",
    connected: "Connected: {path}",
    unavailable: "Native host did not respond",
  },
};

let language = readSavedLanguage();

function t(key, values = {}) {
  const dictionary = I18N[language] || I18N.zh;
  const template = dictionary[key] || I18N.zh[key] || key;
  return template.replaceAll(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

function readSavedLanguage() {
  try {
    return window.localStorage.getItem("goblin.language") === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

function saveLanguage(value) {
  try {
    window.localStorage.setItem("goblin.language", value);
  } catch {
    // Popup 语言只是本地 UI 偏好；无法持久化时保持当前打开的弹窗状态即可。
  }
}

function applyTranslations() {
  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  languageSelect.value = language;

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
}

languageSelect.addEventListener("change", () => {
  language = languageSelect.value === "en" ? "en" : "zh";
  saveLanguage(language);
  applyTranslations();
});

document.getElementById("check-native-host").addEventListener("click", () => {
  statusEl.textContent = t("checking");
  chrome.runtime.sendMessage({ type: "codexLocalRequest", url: "/api/sources" }, (response) => {
    const error = chrome.runtime.lastError;
    if (error) {
      statusEl.textContent = error.message;
      return;
    }
    statusEl.textContent = response?.ok
      ? t("connected", { path: response.data?.codexHome || "~/.codex" })
      : response?.error || t("unavailable");
  });
});

applyTranslations();
