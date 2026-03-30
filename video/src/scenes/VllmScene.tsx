import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { FadeIn } from '../components/FadeIn';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const VllmScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Model name typewriter
  const modelName = 'Qwen/Qwen2.5-7B-Instruct';
  const charsVisible = Math.floor(interpolate(frame, [20, 70], [0, modelName.length], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  }));

  // Streaming tokens visualization
  const tokens = ['I', ' think', ' the', ' best', ' approach', ' would', ' be', ' to', ' start', ' with', '...'];
  const streamFrame = frame - 60;

  // Badge entrance
  const badgeEntrance = spring({
    frame: frame - 80,
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
          vLLM Integration
        </NeonText>

        {/* Model name display */}
        <NeonCard width={700} glowColor={COLORS.cyan}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: COLORS.textSecondary,
              marginBottom: 8,
            }}
          >
            Active Model:
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 28,
              color: COLORS.cyan,
              textShadow: `0 0 15px ${COLORS.cyan}40`,
            }}
          >
            {modelName.slice(0, charsVisible)}
            <span
              style={{
                opacity: frame % 20 < 10 ? 1 : 0,
                color: COLORS.cyan,
              }}
            >
              |
            </span>
          </div>
        </NeonCard>

        {/* Streaming visualization */}
        <NeonCard width={700} glowColor={COLORS.magenta}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: COLORS.textSecondary,
              marginBottom: 12,
            }}
          >
            Streaming Response:
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 22,
              color: COLORS.textPrimary,
              lineHeight: 1.6,
              minHeight: 36,
            }}
          >
            {tokens.map((token, i) => {
              const tokenDelay = i * 6;
              const tokenOpacity = interpolate(
                streamFrame,
                [tokenDelay, tokenDelay + 4],
                [0, 1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
              );
              return (
                <span
                  key={i}
                  style={{
                    opacity: tokenOpacity,
                    color: tokenOpacity > 0.5 ? COLORS.textPrimary : COLORS.cyan,
                    textShadow: tokenOpacity < 1 ? `0 0 8px ${COLORS.cyan}` : 'none',
                  }}
                >
                  {token}
                </span>
              );
            })}
          </div>
        </NeonCard>

        {/* Badge */}
        <div
          style={{
            opacity: badgeEntrance,
            transform: `scale(${badgeEntrance})`,
            padding: '12px 32px',
            border: `2px solid ${COLORS.cyan}`,
            borderRadius: 30,
            fontFamily: FONT_DISPLAY,
            fontSize: 20,
            fontWeight: 600,
            color: COLORS.cyan,
            textShadow: `0 0 15px ${COLORS.cyan}40`,
            boxShadow: `0 0 20px ${COLORS.cyan}20`,
          }}
        >
          Any OpenAI-compatible API
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
