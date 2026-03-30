import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxes = [
    { label: 'Chrome Extension', sub: 'Manifest V3', x: 200, delay: 10, color: COLORS.cyan },
    { label: 'FastAPI Backend', sub: 'Python 3.11+', x: 760, delay: 30, color: COLORS.magenta },
    { label: 'vLLM / LLM', sub: 'OpenAI-compatible', x: 1320, delay: 50, color: COLORS.cyan },
  ];

  // Animated connection lines
  const line1Progress = interpolate(frame, [40, 65], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const line2Progress = interpolate(frame, [65, 90], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Data packet dot animation
  const dot1X = interpolate(frame % 60, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const dot2X = interpolate((frame + 30) % 60, [0, 60], [0, 1], {
    extrapolateRight: 'clamp',
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
        {/* Title */}
        <div style={{ marginBottom: 60 }}>
          <NeonText fontSize={48} color={COLORS.white}>
            Architecture
          </NeonText>
        </div>

        {/* Boxes and connections */}
        <div style={{ position: 'relative', width: 1600, height: 300 }}>
          {/* Connection line 1: Extension -> FastAPI */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0 }}
            width={1600}
            height={300}
          >
            {/* Line 1 */}
            <line
              x1={420}
              y1={130}
              x2={420 + (340 * line1Progress)}
              y2={130}
              stroke={COLORS.cyan}
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={0.8}
            />
            {/* Arrow 1 */}
            {line1Progress > 0.9 && (
              <polygon
                points={`${755},${120} ${755},${140} ${770},${130}`}
                fill={COLORS.cyan}
                opacity={line1Progress}
              />
            )}

            {/* Line 2 */}
            <line
              x1={980}
              y1={130}
              x2={980 + (340 * line2Progress)}
              y2={130}
              stroke={COLORS.magenta}
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={0.8}
            />
            {/* Arrow 2 */}
            {line2Progress > 0.9 && (
              <polygon
                points={`${1315},${120} ${1315},${140} ${1330},${130}`}
                fill={COLORS.magenta}
                opacity={line2Progress}
              />
            )}

            {/* Traveling data dots */}
            {frame > 70 && (
              <>
                <circle
                  cx={420 + dot1X * 340}
                  cy={130}
                  r={4}
                  fill={COLORS.cyan}
                  opacity={0.9}
                >
                </circle>
                <circle
                  cx={980 + dot2X * 340}
                  cy={130}
                  r={4}
                  fill={COLORS.magenta}
                  opacity={0.9}
                >
                </circle>
              </>
            )}
          </svg>

          {/* Architecture boxes */}
          {boxes.map((box, i) => {
            const entrance = spring({
              frame: frame - box.delay,
              fps,
              config: { damping: 15, stiffness: 100 },
            });

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: box.x,
                  top: 50,
                  opacity: entrance,
                  transform: `scale(${interpolate(entrance, [0, 1], [0.7, 1])})`,
                }}
              >
                <NeonCard
                  width={220}
                  height={160}
                  glowColor={box.color}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 22,
                      fontWeight: 700,
                      color: box.color,
                      textAlign: 'center',
                    }}
                  >
                    {box.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {box.sub}
                  </div>
                </NeonCard>
              </div>
            );
          })}
        </div>

        {/* Protocol labels */}
        <div
          style={{
            display: 'flex',
            gap: 350,
            marginTop: 20,
          }}
        >
          {['HTTP / JSON', 'OpenAI API'].map((label, i) => {
            const labelOpacity = interpolate(
              frame,
              [i === 0 ? 55 : 80, i === 0 ? 70 : 95],
              [0, 1],
              { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
            );
            return (
              <div
                key={i}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 15,
                  color: COLORS.textSecondary,
                  opacity: labelOpacity,
                  padding: '4px 16px',
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 6,
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
