import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { GlitchText } from '../components/GlitchText';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance
  const logoEntrance = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15 },
  });

  // URL fade
  const urlFade = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Fade out at the end
  const fadeOut = interpolate(frame, [90, 120], [1, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Particles (from title scene, for bookending)
  const particles = Array.from({ length: 20 }).map((_, i) => {
    const x = ((i * 137 + 50) % 100);
    const y = ((i * 73 + 30) % 100);
    const size = 2 + (i % 3);
    const speed = 0.2 + (i % 5) * 0.1;
    const yOffset = interpolate(frame, [0, 200], [0, -40 * speed], {
      extrapolateRight: 'extend',
    });
    return { x, y, size, yOffset, i };
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
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
            opacity: 0.3,
            boxShadow: `0 0 ${p.size * 3}px ${p.i % 3 === 0 ? COLORS.magenta : COLORS.cyan}`,
          }}
        />
      ))}

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 30,
        }}
      >
        {/* Logo text */}
        <div
          style={{
            opacity: logoEntrance,
            transform: `scale(${interpolate(logoEntrance, [0, 1], [0.8, 1])})`,
          }}
        >
          <GlitchText text="OpenRedditKarmaBot" fontSize={72} startFrame={5} />
        </div>

        {/* Divider */}
        <div
          style={{
            width: interpolate(logoEntrance, [0, 1], [0, 300]),
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
          }}
        />

        {/* URL */}
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 22,
            color: COLORS.cyan,
            opacity: urlFade,
            textShadow: `0 0 15px ${COLORS.cyan}40`,
            letterSpacing: '0.05em',
          }}
        >
          github.com/jasperan/OpenRedditKarmaBot
        </div>

        {/* Social badges */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            opacity: urlFade,
            marginTop: 10,
          }}
        >
          {['Star', 'Fork', 'Watch'].map((action, i) => (
            <div
              key={i}
              style={{
                padding: '8px 20px',
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                fontFamily: FONT_DISPLAY,
                fontSize: 15,
                color: COLORS.textSecondary,
              }}
            >
              {action}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
