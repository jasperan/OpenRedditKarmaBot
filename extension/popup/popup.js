let settings = {};
let scannedContext = null;
let selectedDraftIndex = null;
let drafts = [];

document.addEventListener("DOMContentLoaded", async () => {
  settings = await getSettings();
  applySettings();
  bindEvents();
});

async function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (resp) => {
      resolve(resp || {});
    });
  });
}

function applySettings() {
  document.getElementById("backend-url").value = settings.backendUrl || "http://localhost:8000";
  document.getElementById("api-key").value = settings.apiKey || "";
  document.getElementById("wpm").value = settings.wpm || 85;
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
    backendUrl: document.getElementById("backend-url").value.replace(/\/$/, ""),
    apiKey: document.getElementById("api-key").value,
    wpm: parseInt(document.getElementById("wpm").value, 10),
    autoSubmit: document.getElementById("auto-submit").checked,
    typoSimulation: document.getElementById("typo-simulation").checked,
    tone: document.getElementById("tone-select").value,
    draftCount: parseInt(document.getElementById("draft-count").value, 10),
  };

  await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings }, resolve);
  });

  showStatus("Settings saved", "success");
  setTimeout(hideSettings, 800);
}

async function scanThread() {
  showStatus("Scanning thread...", "loading");
  scannedContext = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SCAN_PAGE" }, (result) => {
      resolve(result);
    });
  });

  if (!scannedContext || !scannedContext.post_title) {
    showStatus("No Reddit thread detected. Navigate to a post first.", "error");
    return;
  }

  document.getElementById("subreddit-badge").textContent = "r/" + scannedContext.subreddit;
  document.getElementById("post-title").textContent = scannedContext.post_title;
  document.getElementById("generate-btn").disabled = false;
  showStatus("Found " + scannedContext.comments.length + " comments", "success");
}

async function generateReplies() {
  if (!scannedContext) return;

  const draftCount = parseInt(document.getElementById("draft-count").value, 10);
  const tone = document.getElementById("tone-select").value;

  showStatus("Generating replies...", "loading");
  document.getElementById("generate-btn").disabled = true;
  document.getElementById("drafts-container").classList.add("hidden");
  document.getElementById("action-buttons").classList.add("hidden");
  drafts = [];
  selectedDraftIndex = null;

  try {
    const backendUrl = settings.backendUrl || "http://localhost:8000";
    const response = await fetch(backendUrl + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: scannedContext,
        tone: tone,
        draft_count: draftCount,
        temperature: settings.temperature || 0.8,
        max_tokens: settings.maxTokens || 300,
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
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === "{}") continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.text) {
              drafts.push(data);
              renderDrafts();
            }
          } catch (e) {
            // skip malformed SSE data
          }
        }
      }
    }

    if (drafts.length > 0) {
      showStatus("Generated " + drafts.length + " drafts", "success");
    } else {
      showStatus("No drafts generated. Check backend connection.", "error");
    }
  } catch (err) {
    showStatus("Error: " + err.message, "error");
  }

  document.getElementById("generate-btn").disabled = false;
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
      text: text,
      wpm: settings.wpm || 85,
      typoSimulation: settings.typoSimulation || false,
      autoSubmit: settings.autoSubmit || false,
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
