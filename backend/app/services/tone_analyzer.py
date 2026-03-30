import re
from dataclasses import dataclass


EMOJI_PATTERN = re.compile(
    r"[\U0001f600-\U0001f64f\U0001f300-\U0001f5ff"
    r"\U0001f680-\U0001f6ff\U0001f1e0-\U0001f1ff"
    r"\u2600-\u26ff\u2700-\u27bf]+"
)

SLANG_WORDS = {
    "lol", "lmao", "bruh", "ngl", "fr", "imo", "tbh", "smh",
    "yo", "yooo", "gonna", "wanna", "gotta", "kinda", "sorta",
    "haha", "omg", "wtf", "tho", "rn", "idk", "ikr", "fwiw",
}


@dataclass
class CultureProfile:
    formality_score: float  # 0.0 (very casual) to 1.0 (very formal)
    avg_sentence_length: float
    emoji_frequency: float  # emojis per comment
    slang_frequency: float  # slang words per comment
    recommended_tone: str

    def to_prompt_fragment(self) -> str:
        return (
            f"Community culture profile:\n"
            f"- Tone: {self.recommended_tone}\n"
            f"- Formality: {self.formality_score:.1f}/1.0\n"
            f"- Average sentence length: {self.avg_sentence_length:.0f} words\n"
            f"- Emoji usage: {'common' if self.emoji_frequency > 0.3 else 'rare'}\n"
            f"- Slang usage: {'heavy' if self.slang_frequency > 1.0 else 'moderate' if self.slang_frequency > 0.3 else 'minimal'}\n"
            f"Match this community's communication style naturally."
        )


class ToneAnalyzer:
    def analyze(self, comments: list[str]) -> CultureProfile:
        if not comments:
            return CultureProfile(
                formality_score=0.5,
                avg_sentence_length=15,
                emoji_frequency=0,
                slang_frequency=0,
                recommended_tone="Casual",
            )

        total_emojis = 0
        total_slang = 0
        total_sentences = 0
        total_words = 0

        for comment in comments:
            total_emojis += len(EMOJI_PATTERN.findall(comment))
            words = comment.lower().split()
            total_words += len(words)
            total_slang += sum(1 for w in words if w.strip(".,!?") in SLANG_WORDS)
            # Split on sentence-ending punctuation followed by a space or end-of-string
            # to avoid over-splitting on abbreviations and mid-word periods
            sentences = [
                s.strip()
                for s in re.split(r"[.!?]+(?:\s|$)", comment)
                if s.strip()
            ]
            total_sentences += max(len(sentences), 1)

        n = len(comments)
        avg_sentence_length = total_words / max(total_sentences, 1)
        avg_words_per_comment = total_words / n
        emoji_freq = total_emojis / n
        slang_freq = total_slang / n

        # Formality heuristic: long comments + no slang + no emoji = formal
        formality = 0.5
        if avg_words_per_comment > 10:
            formality += 0.15
        if avg_words_per_comment > 15:
            formality += 0.1
        if avg_sentence_length > 12:
            formality += 0.1
        if slang_freq < 0.3:
            formality += 0.1
        if emoji_freq < 0.1:
            formality += 0.1
        if slang_freq > 1.0:
            formality -= 0.2
        if emoji_freq > 0.5:
            formality -= 0.1
        if avg_words_per_comment < 5:
            formality -= 0.2

        formality = max(0.0, min(1.0, formality))

        if formality > 0.7:
            tone = "Professional"
        elif formality > 0.4:
            tone = "Casual"
        elif emoji_freq > 0.3 or slang_freq >= 1.0:
            tone = "Meme-heavy"
        else:
            tone = "Concise"

        return CultureProfile(
            formality_score=formality,
            avg_sentence_length=avg_sentence_length,
            emoji_frequency=emoji_freq,
            slang_frequency=slang_freq,
            recommended_tone=tone,
        )
