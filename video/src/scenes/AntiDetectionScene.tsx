import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { FadeIn } from '../components/FadeIn';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const AntiDetectionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { text: 'Trusted KeyboardEvents', desc: 'Browser-verified event dispatch' },
    { text: 'No clipboard paste', desc: 'Never triggers paste detection' },
    { text: 'Zero footprint', desc: 'No detectable DOM modifications' },
    { text: 'React-compatible', desc: 'Works with virtual DOM frameworks' },
  ];

  // Shield icon animation
  const shieldScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const shieldGlow = interpolate(frame % 60, [0, 30, 60], [0.4, 0.8, 0.4]);

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
          Anti-Detection
        </NeonText>

        <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
          {/* Shield */}
          <div
            style={{
              transform: `scale(${shieldScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <svg width={200} height={240} viewBox="0 0 200 240">
              {/* Shield shape */}
              <path
                d="M 100 10 L 180 50 L 180 140 C 180 190 100 230 100 230 C 100 230 20 190 20 140 L 20 50 Z"
                fill="none"
                stroke={COLORS.cyan}
                strokeWidth={3}
                opacity={0.9}
                filter={`drop-shadow(0 0 ${10 * shieldGlow}px ${COLORS.cyan})`}
              />
              {/* Inner shield */}
              <path
                d="M 100 30 L 160 60 L 160 135 C 160 175 100 210 100 210 C 100 210 40 175 40 135 L 40 60 Z"
                fill={`${COLORS.cyan}10`}
                stroke={COLORS.cyan}
                strokeWidth={1}
                opacity={0.5}
              />
              {/* Checkmark */}
              <path
                d="M 70 120 L 90 145 L 135 95"
                fill="none"
                stroke={COLORS.cyan}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={100}
                strokeDashoffset={interpolate(frame, [20, 50], [100, 0], {
                  extrapolateRight: 'clamp',
                  extrapolateLeft: 'clamp',
                })}
              />
            </svg>
          </div>

          {/* Feature checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {features.map((feature, i) => {
              const entrance = spring({
                frame: frame - 25 - i * 15,
                fps,
                config: { damping: 200 },
              });

              const checkmarkProgress = interpolate(
                frame,
                [30 + i * 15, 40 + i * 15],
                [0, 1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
              );

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    opacity: entrance,
                    transform: `translateX(${interpolate(entrance, [0, 1], [40, 0])}px)`,
                  }}
                >
                  {/* Animated checkmark */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `2px solid ${COLORS.cyan}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: checkmarkProgress > 0.5 ? `${COLORS.cyan}20` : 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    <svg width={18} height={14} style={{ opacity: checkmarkProgress }}>
                      <path
                        d="M 2 7 L 7 12 L 16 2"
                        fill="none"
                        stroke={COLORS.cyan}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 22,
                        fontWeight: 600,
                        color: COLORS.white,
                      }}
                    >
                      {feature.text}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 14,
                        color: COLORS.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {feature.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
