from app.models.requests import ThreadContext
from app.services.reddit_context import RedditComment, RedditPost, RedditThread


def build_thread_from_context(context: ThreadContext) -> tuple[RedditThread, RedditComment | None]:
    post = RedditPost(
        title=context.post_title,
        selftext=context.post_body,
        subreddit=context.subreddit or "localdemo",
        author=context.post_author or "local_user",
        score=context.post_score,
        flair=context.post_flair,
        num_comments=len(context.comments),
    )

    comments = [
        RedditComment(
            author=comment.get("author", ""),
            body=comment.get("body", ""),
            score=comment.get("score", 0),
            depth=comment.get("depth", 0),
            created_utc=comment.get("created_utc", 0),
        )
        for comment in context.comments
        if comment.get("body")
    ]

    target_comment = None
    if context.target_comment:
        target_comment = RedditComment(
            author=context.target_comment.get("author", ""),
            body=context.target_comment.get("body", ""),
            score=context.target_comment.get("score", 0),
            depth=context.target_comment.get("depth", 0),
            created_utc=context.target_comment.get("created_utc", 0),
        )

    return RedditThread(post=post, comments=comments), target_comment
