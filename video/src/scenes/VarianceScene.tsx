import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const VarianceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timeline segments
  const segments = [
    { label: 'Base Delay', duration: 120, color: COLORS.cyan, desc: '~70ms per keystroke' },
    { label: 'Jitter', duration: 40, color: '#facc15', desc: '±15ms random variance' },
    { label: 'Micro-pause', duration: 60, color: COLORS.magenta, desc: '100-200ms between words' },
    { label: 'Thinking Pause', duration: 100, color: '#a78bfa', desc: '500-2000ms for "thought"' },
  ];

  const totalWidth = 1200;
  const totalDuration = segments.reduce((a, s) => a + s.duration, 0);

  // Timeline sweep animation
  const sweepProgress = interpolate(frame, [30, 120], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 50,
        }}
      >
        <NeonText fontSize={48} color={COLORS.white}>
          Typing Variance
        </NeonText>

        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            color: COLORS.textSecondary,
          }}
        >
          Four layers of timing randomization
        </div>

        {/* Timeline bar */}
        <div style={{ position: 'relative', width: totalWidth, height: 200 }}>
          {/* Background track */}
          <div
            style={{
              position: 'absolute',
              top: 60,
              left: 0,
              width: totalWidth,
              height: 40,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            {/* Segments */}
            {(() => {
              let offset = 0;
              return segments.map((seg, i) => {
                const segWidth = (seg.duration / totalDuration) * totalWidth;
                const segLeft = offset;
                offset += segWidth;

                const segProgress = interpolate(
                  sweepProgress,
                  [segLeft / totalWidth, (segLeft + segWidth) / totalWidth],
                  [0, 1],
                  { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
                );

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: segLeft,
                      top: 0,
                      width: segWidth * segProgress,
                      height: '100%',
                      background: `linear-gradient(90deg, ${seg.color}80, ${seg.color})`,
                      borderRight: segProgress >= 1 ? `2px solid ${seg.color}` : 'none',
                    }}
                  />
                );
              });
            })()}
          </div>

          {/* Sweep indicator */}
          <div
            style={{
              position: 'absolute',
              left: sweepProgress * totalWidth - 1,
              top: 50,
              width: 2,
              height: 60,
              background: COLORS.white,
              boxShadow: `0 0 10px ${COLORS.white}`,
            }}
          />

          {/* Labels below */}
          {(() => {
            let offset = 0;
            return segments.map((seg, i) => {
              const segWidth = (seg.duration / totalDuration) * totalWidth;
              const segCenter = offset + segWidth / 2;
              offset += segWidth;

              const labelProgress = spring({
                frame: frame - 20 - i * 20,
                fps,
                config: { damping: 200 },
              });

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: segCenter,
                    top: 120,
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    opacity: labelProgress,
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: seg.color,
                      margin: '0 auto 8px',
                      boxShadow: `0 0 8px ${seg.color}`,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 16,
                      fontWeight: 600,
                      color: seg.color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {seg.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 13,
                      color: COLORS.textSecondary,
                      whiteSpace: 'nowrap',
                      marginTop: 4,
                    }}
                  >
                    {seg.desc}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Summary */}
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 18,
            color: COLORS.cyan,
            padding: '12px 32px',
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 8,
            background: COLORS.codeBg,
            opacity: interpolate(frame, [100, 120], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }),
          }}
        >
          Result: Every keystroke is uniquely timed
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
