import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY } from '../styles/colors';

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillars = [
    { icon: '🔍', title: 'Context Extraction', desc: 'Reads the room before speaking', color: COLORS.cyan, delay: 15 },
    { icon: '🤖', title: 'AI Generation', desc: 'Multi-angle, tone-aware replies', color: COLORS.magenta, delay: 35 },
    { icon: '⌨️', title: 'Biometric Typing', desc: 'Types like a real human', color: COLORS.cyan, delay: 55 },
  ];

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: '0 100px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 60 }}>
          <NeonText fontSize={56} color={COLORS.white}>
            Three Pillars
          </NeonText>
        </div>

        {/* Pillars */}
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
          {pillars.map((pillar, i) => {
            const slideIn = spring({
              frame: frame - pillar.delay,
              fps,
              config: { damping: 15, stiffness: 120 },
            });

            const translateY = interpolate(slideIn, [0, 1], [120, 0]);
            const opacity = slideIn;

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                }}
              >
                <NeonCard
                  width={360}
                  height={280}
                  glowColor={pillar.color}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 56 }}>{pillar.icon}</div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 26,
                      fontWeight: 700,
                      color: pillar.color,
                      textShadow: `0 0 15px ${pillar.color}40`,
                    }}
                  >
                    {pillar.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 18,
                      color: COLORS.textSecondary,
                      lineHeight: 1.4,
                    }}
                  >
                    {pillar.desc}
                  </div>
                </NeonCard>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
