import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { GlitchText } from '../components/GlitchText';
import { FadeIn } from '../components/FadeIn';
import { COLORS, FONT_DISPLAY } from '../styles/colors';

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Particle background (CSS dots)
  const particles = Array.from({ length: 30 }).map((_, i) => {
    const x = ((i * 137 + 50) % 100);
    const y = ((i * 73 + 30) % 100);
    const size = 2 + (i % 3);
    const speed = 0.3 + (i % 5) * 0.15;
    const yOffset = interpolate(frame, [0, 300], [0, -60 * speed], {
      extrapolateRight: 'extend',
    });
    const opacity = interpolate(frame, [0, 20], [0, 0.3 + (i % 3) * 0.15], {
      extrapolateRight: 'clamp',
    });
    return { x, y, size, yOffset, opacity, i };
  });

  // Subtitle fade in
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const subtitleY = interpolate(frame, [40, 60], [20, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Bottom tagline
  const taglineOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Horizontal line expand
  const lineWidth = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill>
      <GridBackground />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y + p.yOffset}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.i % 3 === 0 ? COLORS.magenta : COLORS.cyan,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px ${p.i % 3 === 0 ? COLORS.magenta : COLORS.cyan}`,
          }}
        />
      ))}

      {/* Center content */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <GlitchText text="OpenRedditKarmaBot" fontSize={92} startFrame={5} />

        {/* Decorative line */}
        <div
          style={{
            width: `${lineWidth * 400}px`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
            marginTop: 10,
            marginBottom: 10,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 32,
            color: COLORS.textSecondary,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Build Social Karma with Undetectable AI
        </div>

        {/* Version badge */}
        <FadeIn delay={60} direction="up">
          <div
            style={{
              marginTop: 20,
              padding: '8px 24px',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 20,
              fontFamily: FONT_DISPLAY,
              fontSize: 16,
              color: COLORS.cyan,
              opacity: taglineOpacity,
              letterSpacing: '0.1em',
            }}
          >
            Chrome Extension + FastAPI + vLLM
          </div>
        </FadeIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
