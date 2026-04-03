from app.services.prompt_engine import ANGLES
from app.services.reddit_context import RedditComment, RedditThread
from app.services.tone_analyzer import CultureProfile

DEMO_LOCAL_MODEL = "demo:local"


class DemoGenerator:
    def generate(
        self,
        thread: RedditThread,
        culture_profile: CultureProfile,
        target_comment: RedditComment | None,
        draft_count: int,
    ) -> list[dict]:
        topic = self._topic_phrase(thread.post.title)
        audience = f"r/{thread.post.subreddit}"
        target_hint = ""
        context_hint = self._context_hint(thread, target_comment)
        if target_comment and target_comment.author:
            target_hint = f" replying to u/{target_comment.author}"

        drafts = []
        for index in range(draft_count):
            angle = ANGLES[index % len(ANGLES)]["name"]
            drafts.append(
                {
                    "index": index,
                    "angle": angle,
                    "text": self._draft_text(
                        angle=angle,
                        topic=topic,
                        audience=audience,
                        target_comment=target_comment,
                        tone=culture_profile.recommended_tone,
                        target_hint=target_hint,
                        context_hint=context_hint,
                    ),
                    "done": True,
                    "source": DEMO_LOCAL_MODEL,
                }
            )
        return drafts

    def _draft_text(
        self,
        *,
        angle: str,
        topic: str,
        audience: str,
        target_comment: RedditComment | None,
        tone: str,
        target_hint: str,
        context_hint: str,
    ) -> str:
        tone_prefix = {
            "Professional": "Measured take:",
            "Concise": "Short version:",
            "Meme-heavy": "Low-key:",
            "Casual": "Honestly,",
        }.get(tone, "Honestly,")

        templates = {
            "agree_and_expand": f"{tone_prefix} the core point about {topic} makes sense for {audience}.{context_hint} The useful next move is to turn it into one repeatable habit instead of relying on willpower.",
            "respectful_counterpoint": f"{tone_prefix} I get why {topic} feels like the obvious play for {audience},{target_hint} but I'd push back a little: consistency usually beats the cleverest tactic when people can tell you're forcing it.{context_hint}",
            "personal_anecdote": f"{tone_prefix} I ran into something similar with {topic} and the biggest difference was simplifying the workflow until it was boring to repeat. That made the results look way more natural.{context_hint}",
            "humor_wit": f"{tone_prefix} every thread about {topic} eventually turns into free consulting for {audience}, and honestly that's not the worst corner of the internet.{context_hint}",
            "practical_advice": f"{tone_prefix} if you want a practical win on {topic}, write down the tone you want, keep one concrete example open, and trim anything that sounds like it came from a template.{context_hint}",
        }
        return templates.get(angle, templates["agree_and_expand"])

    def _context_hint(
        self,
        thread: RedditThread,
        target_comment: RedditComment | None,
    ) -> str:
        if target_comment and target_comment.body:
            return f" The bit about \"{self._clip(target_comment.body, 72)}\" is the part I'd build on."
        if thread.comments:
            top_comment = max(thread.comments, key=lambda comment: comment.score)
            return f" The comment \"{self._clip(top_comment.body, 72)}\" is the part I'd build on."
        if thread.post.selftext:
            return f" The line \"{self._clip(thread.post.selftext, 72)}\" gives you enough context to sound specific."
        return ""

    def _topic_phrase(self, title: str) -> str:
        cleaned = self._clip(title.strip().rstrip("?!."), 80)
        return cleaned[:1].lower() + cleaned[1:] if cleaned else "the thread"

    def _clip(self, text: str, limit: int) -> str:
        if len(text) <= limit:
            return text
        return text[: limit - 1].rstrip() + "…"
