import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { COLORS, FONT_DISPLAY } from '../styles/colors';

export const DataFlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { icon: '🌐', label: 'Browse', desc: 'Visit any Reddit thread' },
    { icon: '📡', label: 'Scan', desc: 'DOM scanner detects context' },
    { icon: '📋', label: 'Extract', desc: 'Parse post + comments' },
    { icon: '🧠', label: 'Generate', desc: 'LLM crafts multi-angle replies' },
    { icon: '✅', label: 'Select', desc: 'Pick your best draft' },
    { icon: '⌨️', label: 'Type', desc: 'Biometric engine types it' },
    { icon: '🎯', label: 'Engage', desc: 'Natural comment posted' },
  ];

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: '0 80px',
        }}
      >
        <div style={{ marginBottom: 50 }}>
          <NeonText fontSize={48} color={COLORS.white}>
            Data Flow: 7 Steps
          </NeonText>
        </div>

        {/* Steps timeline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            position: 'relative',
          }}
        >
          {steps.map((step, i) => {
            const stepDelay = 15 + i * 20;
            const entrance = spring({
              frame: frame - stepDelay,
              fps,
              config: { damping: 20, stiffness: 150 },
            });

            const scale = interpolate(entrance, [0, 1], [0.5, 1]);
            const opacity = entrance;

            // Connection line to next step
            const lineProgress = i < steps.length - 1
              ? interpolate(frame, [stepDelay + 10, stepDelay + 25], [0, 1], {
                  extrapolateRight: 'clamp',
                  extrapolateLeft: 'clamp',
                })
              : 0;

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 180,
                    opacity,
                    transform: `scale(${scale})`,
                  }}
                >
                  {/* Step number badge */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: i % 2 === 0 ? COLORS.cyan : COLORS.magenta,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT_DISPLAY,
                      fontSize: 14,
                      fontWeight: 700,
                      color: COLORS.bgPrimary,
                      marginBottom: 12,
                      boxShadow: `0 0 12px ${i % 2 === 0 ? COLORS.cyan : COLORS.magenta}60`,
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Icon */}
                  <div style={{ fontSize: 44, marginBottom: 10 }}>{step.icon}</div>

                  {/* Label */}
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 20,
                      fontWeight: 700,
                      color: COLORS.white,
                      marginBottom: 6,
                    }}
                  >
                    {step.label}
                  </div>

                  {/* Description */}
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 14,
                      color: COLORS.textSecondary,
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}
                  >
                    {step.desc}
                  </div>
                </div>

                {/* Arrow connector */}
                {i < steps.length - 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: 50,
                      opacity: lineProgress,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 2,
                        background: `linear-gradient(90deg, ${COLORS.cyan}80, ${COLORS.magenta}80)`,
                      }}
                    />
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: `8px solid ${COLORS.cyan}`,
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
