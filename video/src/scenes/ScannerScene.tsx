import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const ScannerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 200 },
  });

  const rightProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200 },
  });

  const newRedditSelectors = [
    'shreddit-post',
    'shreddit-comment',
    'faceplate-richtext-container',
    'comment-body-header',
  ];

  const oldRedditSelectors = [
    '.thing.link',
    '.entry .usertext-body',
    '.commentarea .comment',
    '.md-container p',
  ];

  const vsScale = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12 },
  });

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
        <div style={{ marginBottom: 50 }}>
          <NeonText fontSize={48} color={COLORS.white}>
            DOM Scanner
          </NeonText>
        </div>

        <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
          {/* New Reddit */}
          <div
            style={{
              opacity: leftProgress,
              transform: `translateX(${interpolate(leftProgress, [0, 1], [-80, 0])}px)`,
            }}
          >
            <NeonCard width={480} glowColor={COLORS.cyan}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 24,
                  fontWeight: 700,
                  color: COLORS.cyan,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                New Reddit (sh.reddit.com)
              </div>
              {newRedditSelectors.map((sel, i) => {
                const itemProgress = spring({
                  frame: frame - 25 - i * 8,
                  fps,
                  config: { damping: 200 },
                });
                return (
                  <div
                    key={i}
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      padding: '8px 14px',
                      background: COLORS.codeBg,
                      borderRadius: 6,
                      marginBottom: 8,
                      border: `1px solid ${COLORS.cardBorder}`,
                      opacity: itemProgress,
                    }}
                  >
                    <span style={{ color: COLORS.cyan }}>&lt;</span>
                    {sel}
                    <span style={{ color: COLORS.cyan }}>&gt;</span>
                  </div>
                );
              })}
            </NeonCard>
          </div>

          {/* VS badge */}
          <div
            style={{
              transform: `scale(${vsScale})`,
              fontFamily: FONT_DISPLAY,
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.magenta,
              textShadow: `0 0 20px ${COLORS.magenta}60`,
            }}
          >
            VS
          </div>

          {/* Old Reddit */}
          <div
            style={{
              opacity: rightProgress,
              transform: `translateX(${interpolate(rightProgress, [0, 1], [80, 0])}px)`,
            }}
          >
            <NeonCard width={480} glowColor={COLORS.magenta}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 24,
                  fontWeight: 700,
                  color: COLORS.magenta,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                Old Reddit (old.reddit.com)
              </div>
              {oldRedditSelectors.map((sel, i) => {
                const itemProgress = spring({
                  frame: frame - 40 - i * 8,
                  fps,
                  config: { damping: 200 },
                });
                return (
                  <div
                    key={i}
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 17,
                      color: COLORS.textPrimary,
                      padding: '8px 14px',
                      background: COLORS.codeBg,
                      borderRadius: 6,
                      marginBottom: 8,
                      border: `1px solid ${COLORS.cardBorder}`,
                      opacity: itemProgress,
                    }}
                  >
                    {sel}
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
