const TypingEngine = {
  _isTyping: false,
  _abortController: null,

  async typeText(element, text, options = {}) {
    if (this._isTyping) {
      this.abort();
      await new Promise((r) => setTimeout(r, 100));
    }

    this._isTyping = true;
    this._abortController = new AbortController();

    const wpm = options.wpm || 85;
    const typoSimulation = options.typoSimulation || false;
    const fastMode = options.fastMode || false;
    const typoRate = 0.015;

    const baseInterval = 60000 / (wpm * 5);
    let charsSinceMicroPause = 0;
    let charsSinceThinkPause = 0;
    const microPauseInterval = fastMode ? Number.MAX_SAFE_INTEGER : this._randInt(15, 40);
    const thinkPauseInterval = fastMode ? Number.MAX_SAFE_INTEGER : this._randInt(80, 200);
    let prevChar = "";

    element.focus();

    for (let i = 0; i < text.length; i++) {
      if (this._abortController.signal.aborted) break;

      const char = text[i];

      if (
        !fastMode &&
        typoSimulation &&
        Math.random() < typoRate &&
        ADJACENT_KEYS[char.toLowerCase()]
      ) {
        const adjacent =
          ADJACENT_KEYS[char.toLowerCase()][
            this._randInt(0, ADJACENT_KEYS[char.toLowerCase()].length - 1)
          ];
        const wrongChar = char === char.toUpperCase() ? adjacent.toUpperCase() : adjacent;

        this._insertChar(element, wrongChar);
        await this._sleep(this._randInt(80, 200));
        await this._sleep(this._randInt(200, 500));
        this._deleteChar(element);
        await this._sleep(this._randInt(50, 120));
      }

      let delay = baseInterval;
      delay *= 1 + this._gaussianRandom() * 0.3;
      if (fastMode) {
        delay = 0;
      }

      if (prevChar) {
        const bigram = (prevChar + char).toLowerCase();
        if (BIGRAM_TIMINGS[bigram]) {
          delay *= BIGRAM_TIMINGS[bigram];
        }
      }

      if (char === " ") {
        delay += this._randInt(50, 150);
      }

      charsSinceMicroPause++;
      if (charsSinceMicroPause >= microPauseInterval) {
        await this._sleep(this._randInt(200, 800));
        charsSinceMicroPause = 0;
      }

      charsSinceThinkPause++;
      if (charsSinceThinkPause >= thinkPauseInterval) {
        await this._sleep(this._randInt(1000, 3000));
        charsSinceThinkPause = 0;
      }

      this._insertChar(element, char);
      prevChar = char;

      await this._sleep(fastMode ? 0 : Math.max(delay, 20));
    }

    this._isTyping = false;
  },

  _insertChar(element, char) {
    element.focus();
    if (this._isTextInput(element)) {
      const start = element.selectionStart ?? element.value.length;
      const end = element.selectionEnd ?? start;
      element.value = element.value.slice(0, start) + char + element.value.slice(end);
      const caret = start + char.length;
      if (element.setSelectionRange) {
        element.setSelectionRange(caret, caret);
      }
      element.dispatchEvent(new InputEvent("input", { bubbles: true, data: char, inputType: "insertText" }));
      return;
    }

    if (document.execCommand && document.execCommand("insertText", false, char)) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    range.insertNode(document.createTextNode(char));
    this._placeCaretAtEnd(element);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: char, inputType: "insertText" }));
  },

  _deleteChar(element) {
    element.focus();
    if (this._isTextInput(element)) {
      const start = element.selectionStart ?? element.value.length;
      const end = element.selectionEnd ?? start;
      if (start === 0 && end === 0) return;
      const deleteStart = start === end ? Math.max(0, start - 1) : start;
      element.value = element.value.slice(0, deleteStart) + element.value.slice(end);
      if (element.setSelectionRange) {
        element.setSelectionRange(deleteStart, deleteStart);
      }
      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
      return;
    }

    if (document.execCommand && document.execCommand("delete", false, null)) {
      return;
    }

    element.textContent = (element.textContent || "").slice(0, -1);
    this._placeCaretAtEnd(element);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
  },

  abort() {
    if (this._abortController) {
      this._abortController.abort();
    }
    this._isTyping = false;
  },

  isTyping() {
    return this._isTyping;
  },

  _sleep(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      if (this._abortController) {
        this._abortController.signal.addEventListener("abort", () => {
          clearTimeout(id);
          resolve();
        });
      }
    });
  },

  _gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  },

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  _isTextInput(element) {
    return element instanceof HTMLTextAreaElement ||
      (element instanceof HTMLInputElement && element.type === "text");
  },

  _placeCaretAtEnd(element) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  },
};
