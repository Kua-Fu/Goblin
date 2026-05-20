const NATIVE_HOST_NAME = "com.goblin.codex_local_viewer";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "codexLocalRequest") {
    return false;
  }

  // 扩展只把固定的本地 API 路径交给 Native Host；真正的数据读取和白名单校验都在本机层完成。
  chrome.runtime.sendNativeMessage(
    NATIVE_HOST_NAME,
    { url: message.url },
    (nativeResponse) => {
      const error = chrome.runtime.lastError;
      if (error) {
        sendResponse({
          ok: false,
          error: `Native host unavailable: ${error.message}`,
        });
        return;
      }

      sendResponse(nativeResponse || { ok: false, error: "Native host returned no response" });
    },
  );

  return true;
});
