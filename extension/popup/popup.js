let settings = {};
let scannedContext = null;
let selectedDraftIndex = null;
let drafts = [];
let generationMeta = null;
const popupParams = new URLSearchParams(window.location.search);
const tabTarget = {
  tabUrl: popupParams.get("tabUrl") || undefined,
  tabId: popupParams.get("tabId") ? Number(popupParams.get("tabId")) : undefined,
};

const DEFAULT_BACKEND_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", async () => {
  settings = await getSettings();
  applySettings();
  bindEvents();
  await refreshBackendStatus();
});

async function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (resp) => {
      resolve(resp || {});
    });
  });
}

function applySettings() {
  document.getElementById("backend-url").value = settings.backendUrl || DEFAULT_BACKEND_URL;
  document.getElementById("model").value = settings.model || "";
  document.getElementById("api-key").value = settings.apiKey || "";
  document.getElementById("wpm").value = settings.wpm || 85;
  document.getElementById("temperature").value = settings.temperature || 0.8;
  document.getElementById("max-tokens").value = settings.maxTokens || 300;
  document.getElementById("auto-submit").checked = settings.autoSubmit || false;
  document.getElementById("typo-simulation").checked = settings.typoSimulation || false;
  document.getElementById("tone-select").value = settings.tone || "auto";
  document.getElementById("draft-count").value = settings.draftCount || 3;
  document.getElementById("draft-count-display").textContent = settings.draftCount || 3;
}

function bindEvents() {
  document.getElementById("settings-btn").addEventListener("click", showSettings);
  document.getElementById("back-btn").addEventListener("click", hideSettings);
  document.getElementById("save-settings-btn").addEventListener("click", saveSettings);
  document.getElementById("check-backend-btn").addEventListener("click", () => refreshBackendStatus({ announce: true }));
  document.getElementById("scan-btn").addEventListener("click", scanThread);
  document.getElementById("generate-btn").addEventListener("click", generateReplies);
  document.getElementById("type-btn").addEventListener("click", typeSelectedDraft);
  document.getElementById("regenerate-btn").addEventListener("click", generateReplies);
  document.getElementById("draft-count").addEventListener("input", (e) => {
    document.getElementById("draft-count-display").textContent = e.target.value;
  });
}

function showSettings() {
  document.getElementById("main-view").classList.add("hidden");
  document.getElementById("settings-view").classList.remove("hidden");
}

function hideSettings() {
  document.getElementById("settings-view").classList.add("hidden");
  document.getElementById("main-view").classList.remove("hidden");
}

async function saveSettings() {
  settings = {
    backendUrl: getConfiguredBackendUrl(),
    model: document.getElementById("model").value.trim(),
    apiKey: document.getElementById("api-key").value,
    wpm: parseInt(document.getElementById("wpm").value, 10),
    temperature: parseFloat(document.getElementById("temperature").value || "0.8"),
    maxTokens: parseInt(document.getElementById("max-tokens").value || "300", 10),
    autoSubmit: document.getElementById("auto-submit").checked,
    typoSimulation: document.getElementById("typo-simulation").checked,
    tone: document.getElementById("tone-select").value,
    draftCount: parseInt(document.getElementById("draft-count").value, 10),
  };

  await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings }, resolve);
  });

  await refreshBackendStatus();
  showStatus("Settings saved", "success");
  setTimeout(hideSettings, 800);
}

async function scanThread() {
  showStatus("Scanning thread...", "loading");
  scannedContext = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SCAN_PAGE", ...tabTarget }, (result) => {
      resolve(result);
    });
  });

  if (!scannedContext || scannedContext.error) {
    showStatus(scannedContext?.error || "No Reddit-compatible page detected.", "error");
    return;
  }

  if (!scannedContext.post_title) {
    showStatus("No Reddit thread detected. Navigate to a post first.", "error");
    return;
  }

  document.getElementById("subreddit-badge").textContent = scannedContext.subreddit
    ? "r/" + scannedContext.subreddit
    : "Local thread";
  document.getElementById("post-title").textContent = scannedContext.post_title;
  document.getElementById("generate-btn").disabled = false;
  showStatus("Found " + (scannedContext.comments?.length || 0) + " comments", "success");
}

async function generateReplies() {
  if (!scannedContext) {
    showStatus("Scan a thread first.", "error");
    return;
  }

  const draftCount = parseInt(document.getElementById("draft-count").value, 10);
  const tone = document.getElementById("tone-select").value;

  showStatus("Generating replies...", "loading");
  document.getElementById("generate-btn").disabled = true;
  document.getElementById("drafts-container").classList.add("hidden");
  document.getElementById("action-buttons").classList.add("hidden");
  drafts = [];
  selectedDraftIndex = null;
  generationMeta = null;

  try {
    const response = await fetch(getConfiguredBackendUrl() + "/api/generate", {
      method: "POST",
      headers: buildBackendHeaders({ includeJson: true }),
      body: JSON.stringify({
        context: scannedContext,
        tone,
        context_mode: /reddit\.com/.test(scannedContext.url || "") ? "auto" : "inline",
        draft_count: draftCount,
        temperature: settings.temperature || 0.8,
        max_tokens: settings.maxTokens || 300,
        ...(settings.model ? { model: settings.model } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error("Backend error: " + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const chunk of events) {
        const parsed = parseSseChunk(chunk);
        if (!parsed) continue;
        const { event, data } = parsed;
        if (event === "error" || data.error) {
          throw new Error(data.error || "Generation failed");
        }
        if (event === "meta") {
          generationMeta = data;
          continue;
        }
        if (event === "draft" && data.text) {
          drafts.push(data);
          renderDrafts();
        }
      }
    }

    if (drafts.length > 0) {
      const detail = generationMeta
        ? " via " + (generationMeta.model || "default") + " • " + (generationMeta.context_source || "unknown")
        : "";
      showStatus("Generated " + drafts.length + " drafts" + detail, "success");
    } else {
      showStatus("No drafts generated. Check backend connection.", "error");
    }
  } catch (err) {
    showStatus("Error: " + err.message, "error");
  }

  document.getElementById("generate-btn").disabled = false;
}

function parseSseChunk(chunk) {
  const lines = chunk.split("\n").filter(Boolean);
  if (!lines.length) return null;

  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLine = lines.find((line) => line.startsWith("data:"));
  if (!dataLine) return null;

  const rawData = dataLine.slice(5).trim();
  if (!rawData || rawData === "{}") {
    return { event: eventLine ? eventLine.slice(6).trim() : "message", data: {} };
  }

  return {
    event: eventLine ? eventLine.slice(6).trim() : "message",
    data: JSON.parse(rawData),
  };
}

function renderDrafts() {
  const container = document.getElementById("drafts-list");
  container.innerHTML = "";

  drafts.forEach((draft, idx) => {
    const card = document.createElement("div");
    card.className = "draft-card" + (idx === selectedDraftIndex ? " selected" : "");
    card.innerHTML =
      '<div class="angle">' + ((draft.angle || "").replace(/_/g, " ")) + "</div>" +
      '<div class="text">' + escapeHtml(draft.text) + "</div>";
    card.addEventListener("click", () => selectDraft(idx));
    container.appendChild(card);
  });

  document.getElementById("drafts-container").classList.remove("hidden");
  document.getElementById("action-buttons").classList.remove("hidden");
}

function selectDraft(index) {
  selectedDraftIndex = index;
  document.getElementById("type-btn").disabled = false;
  renderDrafts();
}

async function typeSelectedDraft() {
  if (selectedDraftIndex === null || !drafts[selectedDraftIndex]) return;

  const text = drafts[selectedDraftIndex].text;
  showStatus("Typing reply...", "loading");
  document.getElementById("type-btn").disabled = true;

  chrome.runtime.sendMessage(
    {
      type: "TYPE_REPLY",
      text,
      wpm: settings.wpm || 85,
      typoSimulation: settings.typoSimulation || false,
      autoSubmit: settings.autoSubmit || false,
      ...tabTarget,
    },
    (result) => {
      if (result && result.success !== false) {
        showStatus("Reply typed!", "success");
      } else {
        showStatus((result && result.error) || "Failed to type reply", "error");
      }
      document.getElementById("type-btn").disabled = false;
    }
  );
}

async function refreshBackendStatus(options = {}) {
  const summary = document.getElementById("backend-summary");
  const modelsSummary = document.getElementById("backend-models-summary");
  const detail = document.getElementById("backend-check-status");

  summary.textContent = "Checking backend...";
  modelsSummary.textContent = "";
  if (detail) {
    detail.textContent = "Checking backend...";
  }

  try {
    const baseUrl = getConfiguredBackendUrl();
    const [healthResponse, modelsResponse] = await Promise.all([
      fetch(baseUrl + "/api/health", { headers: buildBackendHeaders() }),
      fetch(baseUrl + "/api/models", { headers: buildBackendHeaders() }),
    ]);

    if (!healthResponse.ok) {
      throw new Error("Health check returned " + healthResponse.status);
    }
    if (!modelsResponse.ok) {
      throw new Error("Model list returned " + modelsResponse.status);
    }

    const health = await healthResponse.json();
    const modelData = await modelsResponse.json();
    const models = Array.isArray(modelData.models) ? modelData.models : [];
    populateModelOptions(models);

    summary.textContent = health.vllm_connected
      ? "Connected to backend + remote model endpoint"
      : "Backend reachable — remote model unavailable, demo mode still works";
    modelsSummary.textContent = models.length ? "Models: " + models.join(", ") : "No models reported";
    if (detail) {
      detail.textContent = health.vllm_connected
        ? "Backend healthy. Available models: " + models.join(", ")
        : "Backend reachable. You can still use demo:local for a full local walkthrough.";
    }

    if (options.announce) {
      showStatus("Backend check complete", "success");
    }
  } catch (error) {
    summary.textContent = "Backend check failed";
    modelsSummary.textContent = "";
    if (detail) {
      detail.textContent = error.message;
    }
    if (options.announce) {
      showStatus("Backend check failed: " + error.message, "error");
    }
  }
}

function getConfiguredBackendUrl() {
  const backendInput = document.getElementById("backend-url");
  const currentValue = backendInput && backendInput.value ? backendInput.value : settings.backendUrl;
  return (currentValue || DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

function buildBackendHeaders(options = {}) {
  const headers = {};
  if (options.includeJson) {
    headers["Content-Type"] = "application/json";
  }
  const apiKeyInput = document.getElementById("api-key");
  const apiKey = apiKeyInput && apiKeyInput.value ? apiKeyInput.value : settings.apiKey;
  if (apiKey) {
    headers["X-Model-Api-Key"] = apiKey;
  }
  return headers;
}

function populateModelOptions(models) {
  const datalist = document.getElementById("model-options");
  if (!datalist) return;
  datalist.innerHTML = "";
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    datalist.appendChild(option);
  });
}

function showStatus(message, type) {
  const el = document.getElementById("status");
  el.textContent = message;
  el.className = type;
  el.classList.remove("hidden");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
