from app.services.reddit_context import RedditThread, RedditComment
from app.services.tone_analyzer import CultureProfile

ANGLES = [
    {
        "name": "agree_and_expand",
        "directive": "Agree with the main point and add a valuable insight, personal experience, or supporting evidence that expands the conversation.",
    },
    {
        "name": "respectful_counterpoint",
        "directive": "Offer a thoughtful, respectful counterpoint or alternative perspective. Don't be combative, but bring a fresh angle.",
    },
    {
        "name": "personal_anecdote",
        "directive": "Share a relevant personal anecdote or experience that relates to the topic. Make it feel genuine and conversational.",
    },
    {
        "name": "humor_wit",
        "directive": "Respond with humor or wit while still being relevant. Don't force jokes, keep it natural to how the community communicates.",
    },
    {
        "name": "practical_advice",
        "directive": "Offer concrete, actionable advice or a practical tip based on what's being discussed. Be specific, not generic.",
    },
]


class PromptEngine:
    def build_prompts(
        self,
        thread: RedditThread,
        culture_profile: CultureProfile,
        target_comment: RedditComment | None,
        draft_count: int = 3,
    ) -> list[tuple[str, str]]:
        context_block = self._build_context(thread, target_comment)
        culture_block = culture_profile.to_prompt_fragment()
        prompts = []

        for i in range(draft_count):
            angle = ANGLES[i % len(ANGLES)]
            system_prompt = (
                f"You are a real Reddit user writing a comment in r/{thread.post.subreddit}. "
                f"Write naturally as a human would. Never reveal you are an AI.\n\n"
                f"{culture_block}\n\n"
                f"Your angle for this reply: {angle['directive']}\n\n"
                f"Rules:\n"
                f"- Match the community's tone and vocabulary exactly\n"
                f"- Keep it concise (2-4 sentences unless the topic demands more)\n"
                f"- Don't start with 'I think' or 'In my opinion' every time\n"
                f"- Don't use generic filler phrases\n"
                f"- Sound like you actually care about the topic\n"
                f"- Output ONLY the comment text, nothing else"
            )
            user_prompt = context_block
            prompts.append((system_prompt, user_prompt))

        return prompts

    def _build_context(
        self,
        thread: RedditThread,
        target_comment: RedditComment | None,
    ) -> str:
        p = thread.post
        parts = [
            f"Subreddit: r/{p.subreddit}",
            f"Post title: {p.title}",
        ]
        if p.flair:
            parts.append(f"Flair: {p.flair}")
        if p.selftext:
            body = p.selftext[:1500]
            parts.append(f"Post body: {body}")

        parts.append(f"Score: {p.score} | Comments: {p.num_comments}")

        if thread.comments:
            parts.append("\nComment thread:")
            for c in thread.comments[:15]:
                indent = "  " * c.depth
                parts.append(
                    f"{indent}[{c.author}] (score: {c.score}): {c.body[:500]}"
                )

        if target_comment:
            parts.append(
                f"\nYou are replying to this specific comment by u/{target_comment.author}:\n"
                f'"{target_comment.body}"'
            )
        else:
            parts.append("\nYou are writing a top-level comment on this post.")

        return "\n".join(parts)
