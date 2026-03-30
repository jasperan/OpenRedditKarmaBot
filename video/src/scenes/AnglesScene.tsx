import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY } from '../styles/colors';

export const AnglesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const angles = [
    { icon: '🤝', title: 'Agree', desc: 'Build on the discussion', color: '#4ade80' },
    { icon: '⚡', title: 'Counterpoint', desc: 'Respectful pushback', color: '#f97316' },
    { icon: '📖', title: 'Anecdote', desc: 'Personal experience', color: '#a78bfa' },
    { icon: '😄', title: 'Humor', desc: 'Witty observation', color: '#facc15' },
    { icon: '🔧', title: 'Practical', desc: 'Actionable advice', color: '#22d3ee' },
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
          Multi-Angle Generation
        </NeonText>

        {/* Cards fanning out like playing cards */}
        <div style={{ position: 'relative', width: 1200, height: 400 }}>
          {angles.map((angle, i) => {
            const cardDelay = 15 + i * 15;
            const entrance = spring({
              frame: frame - cardDelay,
              fps,
              config: { damping: 15, stiffness: 80 },
            });

            // Fan out from center
            const centerX = 600;
            const spreadAngle = (i - 2) * 12; // -24, -12, 0, 12, 24 degrees
            const spreadX = (i - 2) * 200; // horizontal spread

            const rotation = interpolate(entrance, [0, 1], [0, spreadAngle]);
            const translateX = interpolate(entrance, [0, 1], [0, spreadX]);
            const translateY = interpolate(entrance, [0, 1], [200, Math.abs(i - 2) * 15]);

            // Hover effect on the center card
            const isCenter = i === 2;
            const hoverLift = isCenter
              ? interpolate(frame % 60, [0, 30, 60], [0, -8, 0])
              : 0;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: centerX - 110 + translateX,
                  top: 50 + translateY + hoverLift,
                  opacity: entrance,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'bottom center',
                  zIndex: isCenter ? 10 : 5 - Math.abs(i - 2),
                }}
              >
                <NeonCard
                  width={220}
                  height={300}
                  glowColor={angle.color}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 48 }}>{angle.icon}</div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 24,
                      fontWeight: 700,
                      color: angle.color,
                    }}
                  >
                    {angle.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 16,
                      color: COLORS.textSecondary,
                      lineHeight: 1.4,
                    }}
                  >
                    {angle.desc}
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
