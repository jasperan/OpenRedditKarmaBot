import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const TechStackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const techs = [
    { name: 'Python', icon: '🐍', color: '#3776AB', desc: 'Backend runtime' },
    { name: 'FastAPI', icon: '⚡', color: '#009688', desc: 'API framework' },
    { name: 'Chrome', icon: '🌐', color: '#4285F4', desc: 'Extension platform' },
    { name: 'vLLM', icon: '🧠', color: '#FF6F00', desc: 'LLM inference' },
    { name: 'Vanilla JS', icon: '📜', color: '#F7DF1E', desc: 'Zero dependencies' },
  ];

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 50,
        }}
      >
        <NeonText fontSize={48} color={COLORS.white}>
          Tech Stack
        </NeonText>

        <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
          {techs.map((tech, i) => {
            // Bounce in from below
            const bounce = spring({
              frame: frame - 15 - i * 12,
              fps,
              config: { damping: 12, stiffness: 100 },
            });

            const translateY = interpolate(bounce, [0, 1], [150, 0]);
            const rotation = interpolate(bounce, [0, 0.5, 1], [15, -5, 0]);

            return (
              <div
                key={i}
                style={{
                  opacity: bounce,
                  transform: `translateY(${translateY}px) rotate(${rotation}deg)`,
                }}
              >
                <NeonCard
                  width={200}
                  height={240}
                  glowColor={tech.color}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 56 }}>{tech.icon}</div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 22,
                      fontWeight: 700,
                      color: tech.color,
                    }}
                  >
                    {tech.name}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {tech.desc}
                  </div>
                </NeonCard>
              </div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 20,
            color: COLORS.textSecondary,
            opacity: interpolate(frame, [90, 110], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }),
          }}
        >
          Minimal dependencies. Maximum capability.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
