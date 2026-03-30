import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const ToneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Meter animation (0 to 0.72 formality score)
  const meterProgress = interpolate(frame, [20, 80], [0, 0.72], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Score counter
  const scoreDisplay = Math.round(meterProgress * 100);

  // Needle rotation (0 = professional, 180 = meme-heavy)
  const needleAngle = interpolate(meterProgress, [0, 1], [-90, 90]);

  // Labels
  const toneLabels = [
    { label: 'Professional', pos: 0, color: '#60a5fa' },
    { label: 'Casual', pos: 0.5, color: COLORS.cyan },
    { label: 'Meme-heavy', pos: 1, color: COLORS.magenta },
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
          Tone Analyzer
        </NeonText>

        {/* Gauge */}
        <div style={{ position: 'relative', width: 500, height: 280 }}>
          {/* Arc background */}
          <svg width={500} height={280} viewBox="0 0 500 280">
            {/* Background arc */}
            <path
              d="M 50 250 A 200 200 0 0 1 450 250"
              fill="none"
              stroke={COLORS.cardBorder}
              strokeWidth={20}
              strokeLinecap="round"
            />
            {/* Colored arc (progress) */}
            <path
              d="M 50 250 A 200 200 0 0 1 450 250"
              fill="none"
              stroke={`url(#gaugeGradient)`}
              strokeWidth={20}
              strokeLinecap="round"
              strokeDasharray={`${meterProgress * 628} 628`}
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor={COLORS.cyan} />
                <stop offset="100%" stopColor={COLORS.magenta} />
              </linearGradient>
            </defs>

            {/* Needle */}
            <g transform={`rotate(${needleAngle}, 250, 250)`}>
              <line
                x1={250}
                y1={250}
                x2={250}
                y2={80}
                stroke={COLORS.white}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle cx={250} cy={250} r={8} fill={COLORS.cyan} />
            </g>
          </svg>

          {/* Score display */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: FONT_MONO,
              fontSize: 48,
              fontWeight: 700,
              color: COLORS.cyan,
              textShadow: `0 0 20px ${COLORS.cyan}60`,
            }}
          >
            {scoreDisplay}%
          </div>
        </div>

        {/* Tone labels */}
        <div style={{ display: 'flex', gap: 80, justifyContent: 'center' }}>
          {toneLabels.map((tone, i) => {
            const labelEntrance = spring({
              frame: frame - 40 - i * 15,
              fps,
              config: { damping: 200 },
            });

            const isActive = Math.abs(meterProgress - tone.pos) < 0.25;

            return (
              <div
                key={i}
                style={{
                  opacity: labelEntrance,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: tone.color,
                    boxShadow: isActive ? `0 0 12px ${tone.color}` : 'none',
                  }}
                />
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 20,
                    color: isActive ? tone.color : COLORS.textSecondary,
                    fontWeight: isActive ? 700 : 400,
                    textShadow: isActive ? `0 0 10px ${tone.color}40` : 'none',
                  }}
                >
                  {tone.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            color: COLORS.textSecondary,
            opacity: interpolate(frame, [90, 110], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }),
          }}
        >
          Automatically matches the subreddit's vibe
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
