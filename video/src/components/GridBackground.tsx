import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../styles/colors';

export const GridBackground: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();

  const drift = interpolate(frame, [0, 300], [0, 20], {
    extrapolateRight: 'extend',
  });

  const pulse = interpolate(frame, [0, 60, 120], [0.03, 0.07, 0.03], {
    extrapolateRight: 'extend',
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bgPrimary,
        overflow: 'hidden',
        opacity,
      }}
    >
      {/* Radial gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${COLORS.bgSecondary} 0%, ${COLORS.bgPrimary} 70%)`,
        }}
      />

      {/* Horizontal grid lines */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(i * 100) / 25 + drift * 0.1}%`,
            height: 1,
            background: `rgba(0, 255, 204, ${pulse})`,
          }}
        />
      ))}

      {/* Vertical grid lines */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${(i * 100) / 40}%`,
            width: 1,
            background: `rgba(0, 255, 204, ${pulse})`,
          }}
        />
      ))}

      {/* Corner accent glow - top left */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.cyanDim} 0%, transparent 70%)`,
          opacity: 0.3,
        }}
      />

      {/* Corner accent glow - bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.magentaDim} 0%, transparent 70%)`,
          opacity: 0.3,
        }}
      />
    </AbsoluteFill>
  );
};
