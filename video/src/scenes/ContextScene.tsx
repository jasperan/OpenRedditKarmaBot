import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const ContextScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Left side: raw thread mockup
  const rawFade = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
  });

  // Right side: structured data
  const structuredFade = spring({
    frame: frame - 40,
    fps,
    config: { damping: 200 },
  });

  // Arrow between them
  const arrowProgress = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const threadLines = [
    { author: 'u/techguy42', text: 'Has anyone tried the new M4 MacBook for dev work?', upvotes: '2.3k' },
    { author: 'u/devfan', text: 'Been using it for 3 weeks. The RAM management is insane.', upvotes: '847' },
    { author: 'u/linux_lord', text: 'Still prefer my ThinkPad with Arch btw', upvotes: '312' },
  ];

  const structuredFields = [
    { key: 'subreddit', value: 'r/programming' },
    { key: 'post_title', value: '"M4 MacBook for dev work?"' },
    { key: 'sentiment', value: 'positive / debate' },
    { key: 'top_comments', value: '3 extracted' },
    { key: 'tone', value: 'casual-technical' },
  ];

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <NeonText fontSize={48} color={COLORS.white}>
            Context Extraction
          </NeonText>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          {/* Raw thread */}
          <div style={{ opacity: rawFade }}>
            <NeonCard width={520} glowColor={COLORS.textSecondary}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 16,
                  color: COLORS.textSecondary,
                  marginBottom: 16,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Raw Reddit Thread
              </div>
              {threadLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderLeft: `3px solid ${i === 0 ? COLORS.cyan : COLORS.cardBorder}`,
                    marginBottom: 10,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '0 6px 6px 0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.cyan }}>
                      {line.author}
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.magenta }}>
                      ▲ {line.upvotes}
                    </span>
                  </div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.textPrimary, lineHeight: 1.4 }}>
                    {line.text}
                  </div>
                </div>
              ))}
            </NeonCard>
          </div>

          {/* Arrow */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              opacity: arrowProgress,
            }}
          >
            <svg width={80} height={40}>
              <line x1={0} y1={20} x2={60} y2={20} stroke={COLORS.cyan} strokeWidth={2} />
              <polygon points="60,12 60,28 76,20" fill={COLORS.cyan} />
            </svg>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.textSecondary }}>
              parse
            </div>
          </div>

          {/* Structured output */}
          <div style={{ opacity: structuredFade }}>
            <NeonCard width={440} glowColor={COLORS.cyan}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 16,
                  color: COLORS.cyan,
                  marginBottom: 16,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Structured Context
              </div>
              {structuredFields.map((field, i) => {
                const fieldProgress = spring({
                  frame: frame - 50 - i * 8,
                  fps,
                  config: { damping: 200 },
                });
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: `1px solid ${COLORS.cardBorder}`,
                      opacity: fieldProgress,
                    }}
                  >
                    <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: COLORS.magenta }}>
                      {field.key}:
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: COLORS.textPrimary }}>
                      {field.value}
                    </span>
                  </div>
                );
              })}
            </NeonCard>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
