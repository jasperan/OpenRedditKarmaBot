import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { FadeIn } from '../components/FadeIn';
import { COLORS, FONT_DISPLAY } from '../styles/colors';

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = [
    { text: 'Reddit karma = manual grind.', delay: 10 },
    { text: 'Bots get detected.', delay: 35 },
    { text: 'You need something smarter.', delay: 60 },
  ];

  // Strikethrough animation on "manual grind"
  const strikeProgress = interpolate(frame, [50, 65], [0, 100], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Red warning icon pulse
  const warningScale = interpolate(frame % 30, [0, 15, 30], [1, 1.15, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: '0 120px',
        }}
      >
        {/* Section label */}
        <FadeIn delay={0}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              color: COLORS.magenta,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 40,
            }}
          >
            The Problem
          </div>
        </FadeIn>

        {/* Lines reveal one by one */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {lines.map((line, i) => {
            const progress = spring({
              frame: frame - line.delay,
              fps,
              config: { damping: 200 },
            });

            return (
              <div
                key={i}
                style={{
                  opacity: progress,
                  transform: `translateX(${interpolate(progress, [0, 1], [-60, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: i === 2 ? 52 : 44,
                    color: i === 2 ? COLORS.cyan : COLORS.textPrimary,
                    fontWeight: i === 2 ? 700 : 400,
                    textShadow: i === 2 ? `0 0 30px ${COLORS.cyan}40` : 'none',
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  {line.text}
                  {/* Strikethrough on first line */}
                  {i === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '55%',
                        left: '60%',
                        width: `${strikeProgress * 0.4}%`,
                        height: 3,
                        background: COLORS.magenta,
                        boxShadow: `0 0 8px ${COLORS.magenta}`,
                      }}
                    />
                  )}
                </div>

                {/* Warning icon for "detected" line */}
                {i === 1 && progress > 0.5 && (
                  <span
                    style={{
                      marginLeft: 16,
                      fontSize: 36,
                      display: 'inline-block',
                      transform: `scale(${warningScale})`,
                      filter: `drop-shadow(0 0 8px ${COLORS.magenta})`,
                    }}
                  >
                    ⚠
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
