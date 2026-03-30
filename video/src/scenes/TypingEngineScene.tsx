import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const TypingEngineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // HERO SCENE: biometric typing simulation
  const text = "I've been using this approach for about 6 months now and it's been solid.";

  // Variable timing per character (simulating bigram timing)
  const getCharDelay = (idx: number): number => {
    const char = text[idx];
    const prev = idx > 0 ? text[idx - 1] : '';
    const bigram = prev + char;

    // Fast bigrams
    if (['th', 'he', 'in', 'er', 'an', 'en', 'is', 'it'].includes(bigram)) return 2;
    // Slow bigrams (reaching far)
    if (['6 ', 'w ', ' m', 'pr'].includes(bigram)) return 5;
    // Space = slight pause
    if (char === ' ') return 4;
    // Punctuation = thinking pause
    if (["'", '.', ','].includes(char)) return 6;
    // Default
    return 3;
  };

  // Calculate cumulative frame for each character
  const charFrames: number[] = [];
  let cumulativeFrame = 30; // start after 1 second
  for (let i = 0; i < text.length; i++) {
    charFrames.push(cumulativeFrame);
    cumulativeFrame += getCharDelay(i);
  }

  // How many chars visible
  let charsVisible = 0;
  for (let i = 0; i < text.length; i++) {
    if (frame >= charFrames[i]) charsVisible = i + 1;
  }

  // WPM counter
  const elapsedSeconds = Math.max(0.1, (frame - 30) / fps);
  const wordsTyped = text.slice(0, charsVisible).split(' ').filter(w => w).length;
  const currentWPM = Math.round((wordsTyped / elapsedSeconds) * 60);

  // WPM glow effect
  const wpmScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 200 },
  });

  // "85 WPM" target display
  const targetWPM = 85;
  const wpmGlow = interpolate(frame % 40, [0, 20, 40], [0.5, 1, 0.5]);

  // Section title entrance
  const titleEntrance = spring({
    frame,
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
          gap: 30,
        }}
      >
        {/* HERO badge */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 14,
            color: COLORS.magenta,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: titleEntrance,
          }}
        >
          Core Innovation
        </div>

        <NeonText fontSize={56} color={COLORS.cyan} glowColor={COLORS.cyan}>
          Biometric Typing Engine
        </NeonText>

        {/* Typing area */}
        <NeonCard width={900} glowColor={COLORS.cyan} style={{ minHeight: 120 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: COLORS.textSecondary,
              marginBottom: 12,
            }}
          >
            {'>'} Typing simulation (variable timing per bigram):
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 26,
              color: COLORS.textPrimary,
              lineHeight: 1.6,
              minHeight: 40,
            }}
          >
            {text.split('').map((char, i) => {
              const isVisible = i < charsVisible;
              const isLatest = i === charsVisible - 1 && frame % 4 < 3;

              return (
                <span
                  key={i}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    color: isLatest ? COLORS.cyan : COLORS.textPrimary,
                    textShadow: isLatest ? `0 0 10px ${COLORS.cyan}` : 'none',
                    transition: 'none',
                  }}
                >
                  {char}
                </span>
              );
            })}
            {/* Cursor */}
            <span
              style={{
                color: COLORS.cyan,
                opacity: frame % 16 < 8 ? 1 : 0.3,
                fontWeight: 700,
                textShadow: `0 0 8px ${COLORS.cyan}`,
              }}
            >
              |
            </span>
          </div>
        </NeonCard>

        {/* WPM Display */}
        <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
          {/* Current WPM */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: wpmScale,
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 64,
                fontWeight: 700,
                color: COLORS.cyan,
                textShadow: `0 0 ${30 * wpmGlow}px ${COLORS.cyan}, 0 0 ${60 * wpmGlow}px ${COLORS.cyan}40`,
                lineHeight: 1,
              }}
            >
              {charsVisible > 5 ? currentWPM : '--'}
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                color: COLORS.textSecondary,
                marginTop: 8,
              }}
            >
              Current WPM
            </div>
          </div>

          {/* Target */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 64,
                fontWeight: 700,
                color: COLORS.magenta,
                textShadow: `0 0 ${30 * wpmGlow}px ${COLORS.magenta}, 0 0 ${60 * wpmGlow}px ${COLORS.magenta}40`,
                lineHeight: 1,
              }}
            >
              {targetWPM}
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                color: COLORS.textSecondary,
                marginTop: 8,
              }}
            >
              Target WPM
            </div>
          </div>
        </div>

        {/* Feature badges */}
        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
          {['Variable Delay', 'Bigram Timing', 'Jitter', 'Micro-pauses'].map((badge, i) => {
            const badgeProgress = spring({
              frame: frame - 100 - i * 10,
              fps,
              config: { damping: 200 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: badgeProgress,
                  padding: '6px 18px',
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 16,
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  color: COLORS.cyan,
                  background: COLORS.codeBg,
                }}
              >
                {badge}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
