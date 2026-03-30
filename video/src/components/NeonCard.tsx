import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../styles/colors';

type NeonCardProps = {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  glowColor?: string;
  style?: React.CSSProperties;
  borderWidth?: number;
};

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  width = 'auto',
  height = 'auto',
  glowColor = COLORS.cyan,
  style,
  borderWidth = 1,
}) => {
  const frame = useCurrentFrame();

  // Subtle glow pulse
  const glowIntensity = interpolate(
    frame % 90,
    [0, 45, 90],
    [0.3, 0.6, 0.3],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        width,
        height,
        background: COLORS.bgCard,
        border: `${borderWidth}px solid ${COLORS.cardBorder}`,
        borderRadius: 12,
        padding: '24px 28px',
        boxShadow: `0 0 15px ${glowColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: 'blur(10px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
