import React from 'react';
import { COLORS, FONT_DISPLAY } from '../styles/colors';

type NeonTextProps = {
  children: React.ReactNode;
  fontSize?: number;
  color?: string;
  glowColor?: string;
  style?: React.CSSProperties;
};

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  fontSize = 64,
  color = COLORS.cyan,
  glowColor,
  style,
}) => {
  const glow = glowColor || color;

  return (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize,
        fontWeight: 700,
        color,
        textShadow: `0 0 10px ${glow}, 0 0 30px ${glow}, 0 0 60px ${glow}40`,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
