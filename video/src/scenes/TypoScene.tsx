import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const TypoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typo simulation: "thr" -> pause -> backspace -> "e" -> "there"
  // Timeline:
  // 0-20: "t" appears
  // 20-28: "h" appears
  // 28-36: "r" appears (typo!)
  // 36-55: pause (realization)
  // 55-65: "r" disappears (backspace)
  // 65-75: "e" appears
  // 75-85: "r" appears
  // 85-95: "e" appears

  const steps = [
    { frame: 15, text: 't', annotation: '' },
    { frame: 23, text: 'th', annotation: '' },
    { frame: 31, text: 'thr', annotation: 'Typo! Adjacent key hit' },
    { frame: 50, text: 'thr', annotation: 'Pause... realizing mistake' },
    { frame: 58, text: 'th', annotation: 'Backspace pressed' },
    { frame: 68, text: 'the', annotation: '' },
    { frame: 78, text: 'ther', annotation: '' },
    { frame: 88, text: 'there', annotation: 'Correction complete' },
  ];

  // Find current step
  let currentStep = steps[0];
  for (const step of steps) {
    if (frame >= step.frame) currentStep = step;
  }

  // Annotation fade
  const annotationOpacity = currentStep.annotation
    ? interpolate(
        frame,
        [currentStep.frame, currentStep.frame + 5],
        [0, 1],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
      )
    : 0;

  // Error highlight on 'r' in 'thr'
  const isError = currentStep.text === 'thr' && frame < 55;

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
          Typo Simulation
        </NeonText>

        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            color: COLORS.textSecondary,
          }}
        >
          Humans make mistakes. So does the bot.
        </div>

        {/* Input field mockup */}
        <NeonCard width={700} glowColor={isError ? COLORS.magenta : COLORS.cyan}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: COLORS.textSecondary,
              marginBottom: 12,
            }}
          >
            Reply input:
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 40,
              color: COLORS.textPrimary,
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              border: `1px solid ${isError ? COLORS.magenta : COLORS.cardBorder}`,
              minHeight: 70,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {currentStep.text.split('').map((char, i) => {
              const isLastAndError = i === currentStep.text.length - 1 && isError;
              return (
                <span
                  key={i}
                  style={{
                    color: isLastAndError ? COLORS.magenta : COLORS.textPrimary,
                    textDecoration: isLastAndError ? 'underline' : 'none',
                    textDecorationColor: COLORS.magenta,
                    textShadow: isLastAndError ? `0 0 10px ${COLORS.magenta}` : 'none',
                  }}
                >
                  {char}
                </span>
              );
            })}
            <span
              style={{
                color: COLORS.cyan,
                opacity: frame % 16 < 8 ? 1 : 0.3,
                fontWeight: 700,
              }}
            >
              |
            </span>
          </div>
        </NeonCard>

        {/* Annotation */}
        <div
          style={{
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: annotationOpacity,
          }}
        >
          {isError && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: COLORS.magenta,
                boxShadow: `0 0 10px ${COLORS.magenta}`,
              }}
            />
          )}
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 20,
              color: isError ? COLORS.magenta : COLORS.cyan,
              textShadow: `0 0 10px ${isError ? COLORS.magenta : COLORS.cyan}30`,
            }}
          >
            {currentStep.annotation}
          </div>
        </div>

        {/* Process steps */}
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          {[
            { label: 'Type', icon: '⌨️', active: frame >= 15 && frame < 36 },
            { label: 'Mistake', icon: '❌', active: frame >= 31 && frame < 55 },
            { label: 'Pause', icon: '🤔', active: frame >= 36 && frame < 55 },
            { label: 'Backspace', icon: '⌫', active: frame >= 55 && frame < 65 },
            { label: 'Correct', icon: '✅', active: frame >= 65 },
          ].map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                opacity: spring({
                  frame: frame - 10 - i * 12,
                  fps,
                  config: { damping: 200 },
                }),
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  filter: step.active ? 'none' : 'grayscale(1)',
                  opacity: step.active ? 1 : 0.4,
                }}
              >
                {step.icon}
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  color: step.active ? COLORS.cyan : COLORS.textSecondary,
                }}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
