import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const BigramScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fastBigrams = [
    { pair: 'th', multiplier: '0.65x', width: 65 },
    { pair: 'er', multiplier: '0.70x', width: 70 },
    { pair: 'in', multiplier: '0.72x', width: 72 },
    { pair: 'he', multiplier: '0.68x', width: 68 },
  ];

  const slowBigrams = [
    { pair: 'qx', multiplier: '1.50x', width: 100 },
    { pair: 'zp', multiplier: '1.45x', width: 97 },
    { pair: 'vb', multiplier: '1.35x', width: 90 },
    { pair: 'jk', multiplier: '1.40x', width: 93 },
  ];

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
          Bigram Timing Model
        </NeonText>

        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            color: COLORS.textSecondary,
          }}
        >
          Adjacent key pairs typed at realistic speeds
        </div>

        <div style={{ display: 'flex', gap: 80 }}>
          {/* Fast column */}
          <NeonCard width={460} glowColor={COLORS.cyan}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.cyan,
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>⚡</span> Fast Bigrams
            </div>

            {fastBigrams.map((bg, i) => {
              const barProgress = spring({
                frame: frame - 20 - i * 10,
                fps,
                config: { damping: 200 },
              });

              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 20,
                        color: COLORS.white,
                        fontWeight: 700,
                      }}
                    >
                      "{bg.pair}"
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 18,
                        color: COLORS.cyan,
                      }}
                    >
                      {bg.multiplier}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${bg.width * barProgress}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.cyan}80)`,
                        borderRadius: 4,
                        boxShadow: `0 0 8px ${COLORS.cyan}40`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </NeonCard>

          {/* Slow column */}
          <NeonCard width={460} glowColor={COLORS.magenta}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.magenta,
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>🐌</span> Slow Bigrams
            </div>

            {slowBigrams.map((bg, i) => {
              const barProgress = spring({
                frame: frame - 40 - i * 10,
                fps,
                config: { damping: 200 },
              });

              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 20,
                        color: COLORS.white,
                        fontWeight: 700,
                      }}
                    >
                      "{bg.pair}"
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 18,
                        color: COLORS.magenta,
                      }}
                    >
                      {bg.multiplier}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${bg.width * barProgress}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${COLORS.magenta}, ${COLORS.magenta}80)`,
                        borderRadius: 4,
                        boxShadow: `0 0 8px ${COLORS.magenta}40`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </NeonCard>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
