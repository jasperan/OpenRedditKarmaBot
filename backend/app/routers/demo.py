from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()


@router.get("/demo/thread", response_class=HTMLResponse)
async def demo_thread():
    return """
<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>OpenRedditKarmaBot Demo Thread</title>
  <style>
    body { margin: 0; background: #0f1113; color: #d7dadc; font-family: Inter, system-ui, sans-serif; }
    .page { max-width: 920px; margin: 0 auto; padding: 24px 16px 48px; }
    .banner { background: #1a1a1b; border: 1px solid #343536; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .banner strong { color: #ffb000; }
    .post, [data-testid=\"comment\"] { background: #1a1a1b; border: 1px solid #343536; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .meta { font-size: 12px; color: #818384; margin-bottom: 8px; }
    h1 { font-size: 28px; margin: 0 0 12px; }
    .body { line-height: 1.6; color: #d7dadc; }
    .comment-body { white-space: pre-wrap; line-height: 1.5; }
    [data-testid=\"comment-score\"] { color: #ffb000; font-size: 12px; }
    [data-testid=\"comment-composer\"] { margin-top: 20px; background: #1a1a1b; border: 1px solid #343536; border-radius: 12px; padding: 16px; }
    [contenteditable=\"true\"] { min-height: 110px; border: 1px solid #343536; border-radius: 10px; padding: 12px; background: #0f1113; outline: none; }
    [contenteditable=\"true\"]:empty::before { content: attr(data-placeholder); color: #818384; }
    button { margin-top: 12px; border: none; border-radius: 999px; background: #d93900; color: white; padding: 10px 18px; font-weight: 700; }
  </style>
</head>
<body>
  <div class=\"page\">
    <div class=\"banner\">
      <strong>Local demo page.</strong> This thread is served by the backend so you can test the extension without Reddit or an external LLM.
    </div>

    <article class=\"post\">
      <div class=\"meta\"><a href=\"/r/SideProject\" style=\"color: inherit; text-decoration: none;\">r/SideProject</a> · posted by <span data-testid=\"post-author\">u/demo_builder</span></div>
      <h1 data-testid=\"post-title\">How do you keep automated community workflows from sounding robotic?</h1>
      <div class=\"body\" data-testid=\"post-text-content\">I'm building a small tool to help draft replies for repetitive community support threads. The tricky part isn't generation quality by itself — it's making the workflow feel grounded, context-aware, and not obviously synthetic. Curious what habits or guardrails people use.</div>
    </article>

    <section>
      <div data-testid=\"comment\" depth=\"0\">
        <div class=\"meta\"><span data-testid=\"comment-author\">u/context_matters</span> · <span data-testid=\"comment-score\">128</span></div>
        <div class=\"comment-body\" data-testid=\"comment-text-content\">The thing that helps most is treating every draft like a first pass for a real human. Context and editing matter more than the raw model.</div>
      </div>
      <div data-testid=\"comment\" depth=\"0\">
        <div class=\"meta\"><span data-testid=\"comment-author\">u/shipping_wins</span> · <span data-testid=\"comment-score\">76</span></div>
        <div class=\"comment-body\" data-testid=\"comment-text-content\">Honestly I'd rather see a boring but reliable workflow than a clever setup that only works on perfect inputs.</div>
      </div>
      <div data-testid=\"comment\" depth=\"1\" style=\"margin-left: 32px;\">
        <div class=\"meta\"><span data-testid=\"comment-author\">u/demo_reply</span> · <span data-testid=\"comment-score\">31</span></div>
        <div class=\"comment-body\" data-testid=\"comment-text-content\">+1 to this. The best demo is one people can run locally in five minutes.</div>
      </div>
    </section>

    <form data-testid=\"comment-composer\">
      <label for=\"demo-composer\" class=\"meta\">Reply composer</label>
      <div id=\"demo-composer\" contenteditable=\"true\" data-placeholder=\"Write a comment\"></div>
      <button type=\"submit\">Comment</button>
    </form>
  </div>
</body>
</html>
"""
