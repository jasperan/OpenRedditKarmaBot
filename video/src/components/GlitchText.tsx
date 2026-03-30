import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, FONT_DISPLAY } from '../styles/colors';

type GlitchTextProps = {
  text: string;
  fontSize?: number;
  startFrame?: number;
};

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  fontSize = 96,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const relFrame = frame - startFrame;

  // Glitch intensity decreases over time (settles down)
  const glitchIntensity = interpolate(relFrame, [0, 15, 45, 90], [12, 8, 3, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Pseudo-random offset based on frame (deterministic for rendering)
  const seed = (relFrame * 7 + 13) % 100;
  const offsetX1 = Math.sin(seed * 0.3) * glitchIntensity;
  const offsetY1 = Math.cos(seed * 0.7) * glitchIntensity * 0.3;
  const offsetX2 = Math.cos(seed * 0.5) * glitchIntensity;
  const offsetY2 = Math.sin(seed * 0.9) * glitchIntensity * 0.3;

  // Main text opacity
  const opacity = interpolate(relFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Occasional glitch flash (every ~20 frames after settling)
  const flashFrame = relFrame > 60 ? (relFrame % 47 < 2 ? 1 : 0) : 0;
  const flashOffset = flashFrame * 4;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Cyan shadow layer */}
      <div
        style={{
          position: 'absolute',
          fontFamily: FONT_DISPLAY,
          fontSize,
          fontWeight: 700,
          color: COLORS.cyan,
          opacity: glitchIntensity > 0.5 ? 0.7 : flashFrame * 0.5,
          transform: `translate(${offsetX1 + flashOffset}px, ${offsetY1}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>

      {/* Magenta shadow layer */}
      <div
        style={{
          position: 'absolute',
          fontFamily: FONT_DISPLAY,
          fontSize,
          fontWeight: 700,
          color: COLORS.magenta,
          opacity: glitchIntensity > 0.5 ? 0.7 : flashFrame * 0.5,
          transform: `translate(${offsetX2 - flashOffset}px, ${offsetY2}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>

      {/* Main text */}
      <div
        style={{
          position: 'relative',
          fontFamily: FONT_DISPLAY,
          fontSize,
          fontWeight: 700,
          color: COLORS.white,
          opacity,
          textShadow: `0 0 20px ${COLORS.cyan}60, 0 0 40px ${COLORS.cyan}20`,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};
