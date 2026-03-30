import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const OpenSourceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // GitHub logo animation (using SVG)
  const logoScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Star counter
  const starCount = Math.floor(
    interpolate(frame, [30, 70], [0, 42], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    })
  );

  // Pulse on "Contribute" button
  const pulseScale = interpolate(frame % 30, [0, 15, 30], [1, 1.05, 1]);
  const pulseGlow = interpolate(frame % 30, [0, 15, 30], [0.3, 0.8, 0.3]);

  // License badge
  const licenseFade = spring({
    frame: frame - 40,
    fps,
    config: { damping: 200 },
  });

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
          Open Source
        </NeonText>

        {/* GitHub icon */}
        <div style={{ transform: `scale(${logoScale})` }}>
          <svg width={120} height={120} viewBox="0 0 98 96">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
              fill={COLORS.white}
            />
          </svg>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
          {/* License */}
          <div
            style={{
              opacity: licenseFade,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                padding: '8px 24px',
                border: `2px solid ${COLORS.cyan}`,
                borderRadius: 8,
                fontFamily: FONT_MONO,
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.cyan,
                textShadow: `0 0 15px ${COLORS.cyan}40`,
              }}
            >
              MIT License
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 14,
                color: COLORS.textSecondary,
              }}
            >
              Free to use and modify
            </div>
          </div>

          {/* Stars */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32 }}>⭐</span>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 48,
                  fontWeight: 700,
                  color: '#facc15',
                  textShadow: '0 0 20px rgba(250, 204, 21, 0.4)',
                }}
              >
                {starCount}
              </div>
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 14,
                color: COLORS.textSecondary,
              }}
            >
              GitHub Stars
            </div>
          </div>

          {/* Contribute button */}
          <div
            style={{
              transform: `scale(${pulseScale})`,
              padding: '16px 40px',
              background: `linear-gradient(135deg, ${COLORS.cyan}20, ${COLORS.magenta}20)`,
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: 12,
              fontFamily: FONT_DISPLAY,
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.cyan,
              boxShadow: `0 0 ${20 + pulseGlow * 20}px ${COLORS.cyan}${Math.round(pulseGlow * 100).toString(16).padStart(2, '0')}`,
              cursor: 'pointer',
            }}
          >
            Contribute
          </div>
        </div>

        {/* Repo URL */}
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 18,
            color: COLORS.textSecondary,
            opacity: interpolate(frame, [80, 100], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }),
          }}
        >
          github.com/jasperan/OpenRedditKarmaBot
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
