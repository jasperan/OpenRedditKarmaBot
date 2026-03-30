import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { FadeIn } from '../components/FadeIn';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const ExtensionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    'Content Scripts (DOM scanning)',
    'Background Service Worker',
    'Popup UI (settings + controls)',
    'Chrome Storage API',
    'Trusted KeyboardEvent dispatch',
  ];

  const badgeScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          padding: '0 120px',
          gap: 80,
        }}
      >
        {/* Left: MV3 badge */}
        <div
          style={{
            transform: `scale(${badgeScale})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Chrome icon (CSS) */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: `conic-gradient(${COLORS.cyan} 0deg, ${COLORS.magenta} 120deg, ${COLORS.cyan} 240deg, ${COLORS.cyan} 360deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 40px ${COLORS.cyan}40`,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: COLORS.bgPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_DISPLAY,
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.cyan,
              }}
            >
              V3
            </div>
          </div>

          <NeonText fontSize={32}>Manifest V3</NeonText>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: COLORS.textSecondary,
              padding: '4px 16px',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 6,
            }}
          >
            Latest Chrome Standard
          </div>
        </div>

        {/* Right: Feature list */}
        <NeonCard width={550} glowColor={COLORS.cyan}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.white,
              marginBottom: 24,
            }}
          >
            Extension Features
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {features.map((feature, i) => {
              const itemProgress = spring({
                frame: frame - 25 - i * 10,
                fps,
                config: { damping: 200 },
              });

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    opacity: itemProgress,
                    transform: `translateX(${interpolate(itemProgress, [0, 1], [30, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: COLORS.cyan,
                      boxShadow: `0 0 6px ${COLORS.cyan}`,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 18,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {feature}
                  </div>
                </div>
              );
            })}
          </div>
        </NeonCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
