import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const PromptScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const layers = [
    { label: 'System Prompt', content: '"You are a Reddit user..."', color: '#60a5fa', width: 800 },
    { label: 'Culture Layer', content: 'Subreddit norms, tone, vocabulary', color: '#a78bfa', width: 700 },
    { label: 'Angle Directive', content: '"Write a humorous counterpoint..."', color: COLORS.cyan, width: 600 },
    { label: 'Rules & Guardrails', content: 'Length limits, no self-reference, natural flow', color: COLORS.magenta, width: 500 },
  ];

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 30,
        }}
      >
        <NeonText fontSize={48} color={COLORS.white}>
          Prompt Engineering
        </NeonText>

        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            color: COLORS.textSecondary,
            marginBottom: 20,
          }}
        >
          Layered prompt architecture for natural output
        </div>

        {/* Stacked layers */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {layers.map((layer, i) => {
            const entrance = spring({
              frame: frame - 15 - i * 18,
              fps,
              config: { damping: 200 },
            });

            const y = interpolate(entrance, [0, 1], [-30, 0]);

            return (
              <div
                key={i}
                style={{
                  opacity: entrance,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div
                  style={{
                    width: layer.width,
                    padding: '18px 28px',
                    background: COLORS.bgCard,
                    border: `1px solid ${layer.color}40`,
                    borderLeft: `4px solid ${layer.color}`,
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: `0 0 15px ${layer.color}15`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 18,
                      fontWeight: 600,
                      color: layer.color,
                    }}
                  >
                    {layer.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 15,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {layer.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow pointing down */}
        <div
          style={{
            opacity: interpolate(frame, [90, 110], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
          }}
        >
          <svg width={30} height={40}>
            <line x1={15} y1={0} x2={15} y2={28} stroke={COLORS.cyan} strokeWidth={2} />
            <polygon points="8,28 22,28 15,40" fill={COLORS.cyan} />
          </svg>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 16,
              color: COLORS.cyan,
              textShadow: `0 0 10px ${COLORS.cyan}40`,
            }}
          >
            Natural, human-like output
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
