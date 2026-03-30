import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const InjectorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Reply box mockup animation
  const boxEntrance = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
  });

  // Arrow appears
  const arrowProgress = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Badge appears
  const badgeEntrance = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Text being typed into the box
  const replyText = "I've been using this approach for about 6 months...";
  const charsVisible = Math.floor(
    interpolate(frame, [60, 110], [0, replyText.length], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    })
  );

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <NeonText fontSize={48} color={COLORS.white}>
          Comment Injector
        </NeonText>

        <div style={{ position: 'relative' }}>
          {/* Reply box mockup */}
          <div
            style={{
              opacity: boxEntrance,
              transform: `scale(${interpolate(boxEntrance, [0, 1], [0.9, 1])})`,
            }}
          >
            <NeonCard width={700} glowColor={COLORS.cyan}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  marginBottom: 8,
                }}
              >
                Reddit Reply Box
              </div>
              <div
                style={{
                  padding: '20px',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 8,
                  border: `1px solid ${COLORS.cardBorder}`,
                  minHeight: 80,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 18,
                    color: COLORS.textPrimary,
                    lineHeight: 1.6,
                  }}
                >
                  {replyText.slice(0, charsVisible)}
                  <span
                    style={{
                      color: COLORS.cyan,
                      opacity: frame % 16 < 8 ? 1 : 0.3,
                    }}
                  >
                    |
                  </span>
                </div>
              </div>
            </NeonCard>
          </div>

          {/* Pointing arrow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: 80,
              opacity: arrowProgress,
              transform: `translateY(${interpolate(arrowProgress, [0, 1], [-20, 0])}px)`,
            }}
          >
            <svg width={60} height={60}>
              <path
                d="M 30 0 L 30 40 L 20 30 M 30 40 L 40 30"
                fill="none"
                stroke={COLORS.cyan}
                strokeWidth={3}
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Badge */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              right: -20,
              transform: `scale(${badgeEntrance})`,
            }}
          >
            <div
              style={{
                padding: '8px 20px',
                background: `${COLORS.cyan}20`,
                border: `2px solid ${COLORS.cyan}`,
                borderRadius: 20,
                fontFamily: FONT_MONO,
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.cyan,
                boxShadow: `0 0 15px ${COLORS.cyan}30`,
                whiteSpace: 'nowrap',
              }}
            >
              Reply box detected ✓
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
