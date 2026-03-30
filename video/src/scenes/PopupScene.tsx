import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const PopupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Popup entrance
  const popupScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  // Button highlights (sequential)
  const buttons = [
    { label: '📡  Scan Page', delay: 40, color: COLORS.cyan },
    { label: '🧠  Generate', delay: 70, color: COLORS.magenta },
    { label: '⌨️  Type It', delay: 100, color: COLORS.cyan },
  ];

  // Status indicators
  const statusItems = [
    { label: 'Connection', value: 'Connected', color: '#4ade80' },
    { label: 'Model', value: 'Qwen2.5-7B', color: COLORS.cyan },
    { label: 'Drafts', value: '3 ready', color: '#facc15' },
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
          Popup UI
        </NeonText>

        {/* Popup mockup */}
        <div
          style={{
            transform: `scale(${popupScale})`,
            width: 420,
            background: COLORS.bgSecondary,
            borderRadius: 16,
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${COLORS.cyan}10`,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${COLORS.cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: COLORS.cyan,
                boxShadow: `0 0 6px ${COLORS.cyan}`,
              }}
            />
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.white,
              }}
            >
              OpenRedditKarmaBot
            </div>
            <div
              style={{
                marginLeft: 'auto',
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.textSecondary,
                padding: '2px 8px',
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 4,
              }}
            >
              v1.0
            </div>
          </div>

          {/* Status indicators */}
          <div style={{ padding: '12px 20px', display: 'flex', gap: 16 }}>
            {statusItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 4px ${item.color}`,
                  }}
                />
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.textSecondary }}>
                  {item.label}:
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {buttons.map((btn, i) => {
              const isHighlighted = frame >= btn.delay && frame < btn.delay + 25;
              const highlightProgress = isHighlighted
                ? interpolate(frame, [btn.delay, btn.delay + 8, btn.delay + 20, btn.delay + 25], [0, 1, 1, 0.3], {
                    extrapolateRight: 'clamp',
                    extrapolateLeft: 'clamp',
                  })
                : 0;

              return (
                <div
                  key={i}
                  style={{
                    padding: '14px 20px',
                    background: isHighlighted
                      ? `${btn.color}20`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isHighlighted ? btn.color : COLORS.cardBorder}`,
                    borderRadius: 10,
                    fontFamily: FONT_DISPLAY,
                    fontSize: 16,
                    fontWeight: 600,
                    color: isHighlighted ? btn.color : COLORS.textPrimary,
                    textAlign: 'center',
                    boxShadow: isHighlighted
                      ? `0 0 15px ${btn.color}30`
                      : 'none',
                    transform: `scale(${1 + highlightProgress * 0.03})`,
                  }}
                >
                  {btn.label}
                </div>
              );
            })}
          </div>

          {/* Draft preview area */}
          <div
            style={{
              padding: '12px 20px 16px',
              borderTop: `1px solid ${COLORS.cardBorder}`,
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.textSecondary,
                marginBottom: 8,
              }}
            >
              Draft Preview:
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 13,
                color: COLORS.textPrimary,
                lineHeight: 1.5,
                padding: '10px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 6,
                border: `1px solid ${COLORS.cardBorder}`,
                opacity: interpolate(frame, [80, 95], [0, 1], {
                  extrapolateRight: 'clamp',
                  extrapolateLeft: 'clamp',
                }),
              }}
            >
              "I've been using this approach for about 6 months now and it's been solid..."
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
