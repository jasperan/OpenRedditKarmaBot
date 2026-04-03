const CommentInjector = {
  findReplyBox(targetCommentIndex) {
    if (targetCommentIndex === null || targetCommentIndex === undefined) {
      return this._findMainCommentBox();
    }
    return this._findReplyBoxForComment(targetCommentIndex);
  },

  _findMainCommentBox() {
    const newReddit =
      document.querySelector('[data-testid="comment-composer"] div[contenteditable]') ||
      document.querySelector('div[contenteditable="true"][data-placeholder]') ||
      document.querySelector('.Comment__commentInput div[contenteditable]') ||
      document.querySelector('shreddit-composer div[contenteditable]');
    if (newReddit) return newReddit;

    const textarea =
      document.querySelector('[data-testid="comment-composer"] textarea') ||
      document.querySelector('textarea[placeholder*="comment"]');
    if (textarea) return textarea;

    const oldReddit = document.querySelector(".usertext-edit textarea");
    if (oldReddit) return oldReddit;

    return null;
  },

  _findReplyBoxForComment(commentIndex) {
    const comments = document.querySelectorAll(
      '[data-testid="comment"], shreddit-comment, .comment .entry'
    );

    if (commentIndex >= comments.length) return null;
    const commentEl = comments[commentIndex];

    const replyBox =
      commentEl.querySelector('div[contenteditable="true"]') ||
      commentEl.querySelector("textarea");
    if (replyBox) return replyBox;

    const replyBtn =
      commentEl.querySelector('[data-testid="comment-reply-button"]') ||
      commentEl.querySelector('button[aria-label="Reply"]') ||
      commentEl.querySelector(".reply-button a") ||
      commentEl.querySelector('button:has(> span)');

    if (replyBtn) {
      replyBtn.click();
      return new Promise((resolve) => {
        setTimeout(() => {
          const box =
            commentEl.querySelector('div[contenteditable="true"]') ||
            commentEl.querySelector("textarea");
          resolve(box);
        }, 500);
      });
    }

    return null;
  },

  async typeReply(text, options = {}) {
    const targetIndex = options.targetCommentIndex;
    let replyBox = this.findReplyBox(targetIndex);

    if (replyBox instanceof Promise) {
      replyBox = await replyBox;
    }

    if (!replyBox) {
      return { success: false, error: "Could not find reply box" };
    }

    replyBox.focus();
    replyBox.click();

    await new Promise((r) => setTimeout(r, 200));

    await TypingEngine.typeText(replyBox, text, {
      wpm: options.wpm || 85,
      typoSimulation: options.typoSimulation || false,
      fastMode: options.fastMode || false,
    });

    if (options.autoSubmit) {
      await this._clickSubmit(replyBox);
    }

    return { success: true };
  },

  async _clickSubmit(replyBox) {
    await new Promise((r) => setTimeout(r, 500));

    const container = replyBox.closest("form") || replyBox.parentElement?.parentElement;
    if (!container) return;

    const submitBtn =
      container.querySelector('button[type="submit"]') ||
      container.querySelector('[data-testid="comment-submit-button"]') ||
      container.querySelector('button:not([aria-label="Reply"])');

    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
    }
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TYPE_REPLY") {
    CommentInjector.typeReply(message.text, {
      wpm: message.wpm,
      typoSimulation: message.typoSimulation,
      autoSubmit: message.autoSubmit,
      targetCommentIndex: message.targetCommentIndex,
    }).then((result) => {
      sendResponse(result);
    });
    return true;
  }
});
