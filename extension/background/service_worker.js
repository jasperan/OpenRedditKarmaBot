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

  if (message.type === "SCAN_PAGE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SCAN_PAGE" }, (result) => {
          sendResponse(result);
        });
      }
    });
    return true;
  }

  if (message.type === "TYPE_REPLY") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "TYPE_REPLY",
          text: message.text,
          wpm: message.wpm,
          typoSimulation: message.typoSimulation,
          autoSubmit: message.autoSubmit,
        });
        sendResponse({ ok: true });
      }
    });
    return true;
  }
});
