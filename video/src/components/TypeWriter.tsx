import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { COLORS, FONT_MONO } from '../styles/colors';

type TypeWriterProps = {
  text: string;
  fontSize?: number;
  startFrame?: number;
  charsPerSecond?: number;
  showCursor?: boolean;
  color?: string;
  fontFamily?: string;
};

export const TypeWriter: React.FC<TypeWriterProps> = ({
  text,
  fontSize = 28,
  startFrame = 0,
  charsPerSecond = 25,
  showCursor = true,
  color = COLORS.cyan,
  fontFamily = FONT_MONO,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);
  const framesPerChar = fps / charsPerSecond;
  const charsToShow = Math.floor(relFrame / framesPerChar);
  const visibleText = text.slice(0, Math.min(charsToShow, text.length));

  // Blinking cursor
  const cursorOpacity = showCursor
    ? Math.floor(frame / (fps * 0.4)) % 2 === 0
      ? 1
      : 0
    : 0;

  // Cursor disappears after typing is done + 1 second
  const typingDone = charsToShow >= text.length;
  const hideAfter = typingDone
    ? interpolate(relFrame - text.length * framesPerChar, [0, fps], [1, 0], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
      })
    : 1;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        color,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}
    >
      {visibleText}
      {showCursor && (
        <span
          style={{
            opacity: cursorOpacity * hideAfter,
            color: COLORS.cyan,
            fontWeight: 700,
          }}
        >
          |
        </span>
      )}
    </div>
  );
};
