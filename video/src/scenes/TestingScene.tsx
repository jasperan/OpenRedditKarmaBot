import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const TestingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Counter animation: 0 to 22
  const targetCount = 22;
  const counterValue = Math.floor(
    interpolate(frame, [15, 60], [0, targetCount], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    })
  );

  // Checkmarks appearing
  const testCategories = [
    { name: 'Typing Engine', count: 8 },
    { name: 'API Endpoints', count: 6 },
    { name: 'Context Parser', count: 4 },
    { name: 'Integration', count: 4 },
  ];

  // Big green glow on completion
  const isComplete = counterValue >= targetCount;
  const completeGlow = isComplete
    ? interpolate(frame % 40, [0, 20, 40], [0.5, 1, 0.5])
    : 0;

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
          Test Suite
        </NeonText>

        {/* Counter display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 120,
              fontWeight: 700,
              color: '#4ade80',
              textShadow: `0 0 ${30 + completeGlow * 30}px #4ade8060, 0 0 ${60 + completeGlow * 40}px #4ade8030`,
              lineHeight: 1,
            }}
          >
            {counterValue}
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 32,
              color: COLORS.textSecondary,
            }}
          >
            Tests Passing
          </div>
        </div>

        {/* Test categories */}
        <div style={{ display: 'flex', gap: 24 }}>
          {testCategories.map((cat, i) => {
            const catEntrance = spring({
              frame: frame - 50 - i * 10,
              fps,
              config: { damping: 200 },
            });

            return (
              <div
                key={i}
                style={{
                  opacity: catEntrance,
                  transform: `translateY(${interpolate(catEntrance, [0, 1], [20, 0])}px)`,
                }}
              >
                <NeonCard width={220} glowColor="#4ade80" style={{ textAlign: 'center', padding: '20px' }}>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 36,
                      fontWeight: 700,
                      color: '#4ade80',
                      marginBottom: 8,
                    }}
                  >
                    {cat.count}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 16,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {cat.name}
                  </div>
                  {/* Green checkmarks */}
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {Array.from({ length: cat.count }).map((_, j) => {
                      const checkDelay = 60 + i * 10 + j * 3;
                      const checkOpacity = interpolate(frame, [checkDelay, checkDelay + 5], [0, 1], {
                        extrapolateRight: 'clamp',
                        extrapolateLeft: 'clamp',
                      });
                      return (
                        <div
                          key={j}
                          style={{
                            color: '#4ade80',
                            fontSize: 14,
                            opacity: checkOpacity,
                          }}
                        >
                          ✓
                        </div>
                      );
                    })}
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
