const RedditScanner = {
  scan() {
    const url = window.location.href;
    const isOldReddit = url.includes("old.reddit.com");

    if (isOldReddit) {
      return this._scanOldReddit();
    }
    return this._scanNewReddit();
  },

  _scanNewReddit() {
    const result = {
      url: window.location.href,
      post_title: "",
      post_body: "",
      subreddit: "",
      post_author: "",
      post_score: 0,
      post_flair: "",
      comments: [],
      target_comment: null,
    };

    const subMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (subMatch) result.subreddit = subMatch[1];

    const titleEl =
      document.querySelector('[data-testid="post-title"]') ||
      document.querySelector("h1") ||
      document.querySelector('[slot="title"]');
    if (titleEl) result.post_title = titleEl.textContent.trim();

    const bodyEl =
      document.querySelector('[data-testid="post-text-content"]') ||
      document.querySelector('[slot="text-body"]') ||
      document.querySelector(".Post .RichTextJSON-root");
    if (bodyEl) result.post_body = bodyEl.textContent.trim();

    const authorEl =
      document.querySelector('[data-testid="post-author"]') ||
      document.querySelector('a[href*="/user/"]');
    if (authorEl) {
      const authorMatch = authorEl.textContent.match(/u\/(\S+)/);
      result.post_author = authorMatch ? authorMatch[1] : authorEl.textContent.trim();
    }

    const commentEls = document.querySelectorAll(
      '[data-testid="comment"], shreddit-comment, .Comment'
    );
    commentEls.forEach((el, idx) => {
      const authorNode =
        el.querySelector('[data-testid="comment-author"]') ||
        el.querySelector('a[href*="/user/"]');
      const bodyNode =
        el.querySelector('[data-testid="comment-text-content"]') ||
        el.querySelector(".RichTextJSON-root") ||
        el.querySelector('[slot="comment"]');
      const scoreNode = el.querySelector('[data-testid="comment-score"]');

      const depth = parseInt(el.getAttribute("depth") || "0", 10);

      if (bodyNode) {
        result.comments.push({
          author: authorNode ? authorNode.textContent.replace("u/", "").trim() : "",
          body: bodyNode.textContent.trim(),
          score: scoreNode ? parseInt(scoreNode.textContent, 10) || 0 : 0,
          depth: depth,
          index: idx,
        });
      }
    });

    return result;
  },

  _scanOldReddit() {
    const result = {
      url: window.location.href,
      post_title: "",
      post_body: "",
      subreddit: "",
      post_author: "",
      post_score: 0,
      post_flair: "",
      comments: [],
      target_comment: null,
    };

    const subMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (subMatch) result.subreddit = subMatch[1];

    const titleEl = document.querySelector("a.title");
    if (titleEl) result.post_title = titleEl.textContent.trim();

    const bodyEl = document.querySelector(".usertext-body .md");
    if (bodyEl) result.post_body = bodyEl.textContent.trim();

    const authorEl = document.querySelector(".top-matter .author");
    if (authorEl) result.post_author = authorEl.textContent.trim();

    const commentEls = document.querySelectorAll(".comment .entry");
    commentEls.forEach((el, idx) => {
      const authorNode = el.querySelector(".author");
      const bodyNode = el.querySelector(".usertext-body .md");
      const scoreNode = el.querySelector(".score.unvoted");

      const nestLevel = el.closest(".comment")
        ? (el.closest(".comment").className.match(/noncollapsed/g) || []).length
        : 0;

      if (bodyNode) {
        result.comments.push({
          author: authorNode ? authorNode.textContent.trim() : "",
          body: bodyNode.textContent.trim(),
          score: scoreNode ? parseInt(scoreNode.textContent, 10) || 0 : 0,
          depth: nestLevel,
          index: idx,
        });
      }
    });

    return result;
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCAN_PAGE") {
    const result = RedditScanner.scan();
    sendResponse(result);
  }
});
