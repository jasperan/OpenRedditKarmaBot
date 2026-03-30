import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  style?: React.CSSProperties;
  useSpring?: boolean;
};

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 40,
  style,
  useSpring: useSpringAnim = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = useSpringAnim
    ? spring({
        frame: frame - delay,
        fps,
        config: { damping: 200 },
      })
    : interpolate(frame - delay, [0, 15], [0, 1], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
      });

  const directionMap = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const { x, y } = directionMap[direction];
  const translateX = interpolate(progress, [0, 1], [x, 0]);
  const translateY = interpolate(progress, [0, 1], [y, 0]);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translate(${translateX}px, ${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
