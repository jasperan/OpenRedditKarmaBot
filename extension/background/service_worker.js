const DEFAULT_SETTINGS = {
  backendUrl: "http://localhost:8000",
  apiKey: "",
  wpm: 85,
  draftCount: 3,
  tone: "auto",
  autoSubmit: false,
  typoSimulation: false,
  temperature: 0.8,
  maxTokens: 300,
  model: "",
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("settings");
  if (!stored.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

async function resolveTabId(message) {
  if (typeof message.tabId === "number") {
    return message.tabId;
  }

  if (typeof message.tabUrl === "string" && message.tabUrl) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const matchingTab = tabs.find(
      (tab) => tab.url === message.tabUrl || tab.url?.startsWith(message.tabUrl)
    );
    if (typeof matchingTab?.id === "number") {
      return matchingTab.id;
    }
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeUrl = activeTab?.url || "";
  if (activeTab?.id && !activeUrl.startsWith("chrome-extension://")) {
    return activeTab.id;
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const fallbackTab = tabs.find((tab) => {
    const url = tab.url || "";
    return typeof tab.id === "number" && !url.startsWith("chrome-extension://");
  });
  return fallbackTab?.id;
}

function withContentScriptResponse(message, sendResponse) {
  resolveTabId(message)
    .then((tabId) => {
      if (typeof tabId !== "number") {
        sendResponse({ success: false, error: "No active tab available" });
        return;
      }

      chrome.tabs.sendMessage(tabId, message, (result) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        sendResponse(result || { success: false, error: "No response from page" });
      });
    })
    .catch((error) => {
      sendResponse({ success: false, error: error.message || String(error) });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get("settings").then((data) => {
      sendResponse(data.settings || DEFAULT_SETTINGS);
    });
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    chrome.storage.local.set({ settings: message.settings }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "SCAN_PAGE" || message.type === "TYPE_REPLY") {
    withContentScriptResponse(message, sendResponse);
    return true;
  }
});
