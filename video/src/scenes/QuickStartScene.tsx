import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const QuickStartScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Terminal lines typed out one by one
  const commands = [
    { prompt: '$ ', text: 'git clone https://github.com/jasperan/OpenRedditKarmaBot.git', delay: 10 },
    { prompt: '$ ', text: 'cd OpenRedditKarmaBot && pip install -r backend/requirements.txt', delay: 45 },
    { prompt: '$ ', text: 'uvicorn backend.main:app --reload', delay: 80 },
    { prompt: '', text: 'INFO:     Application startup complete.', delay: 105, isOutput: true },
    { prompt: '# ', text: 'Load extension in chrome://extensions/', delay: 120 },
  ];

  const terminalEntrance = spring({
    frame: frame - 5,
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
          Quick Start
        </NeonText>

        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            color: COLORS.textSecondary,
          }}
        >
          Three commands to running
        </div>

        {/* Terminal mockup */}
        <div
          style={{
            opacity: terminalEntrance,
            transform: `scale(${interpolate(terminalEntrance, [0, 1], [0.95, 1])})`,
          }}
        >
          <div
            style={{
              width: 900,
              background: '#0d1117',
              borderRadius: 12,
              border: `1px solid ${COLORS.cardBorder}`,
              overflow: 'hidden',
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${COLORS.cyan}08`,
            }}
          >
            {/* Terminal header */}
            <div
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
              <div
                style={{
                  marginLeft: 'auto',
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                }}
              >
                bash
              </div>
            </div>

            {/* Terminal body */}
            <div style={{ padding: '20px 24px', minHeight: 250 }}>
              {commands.map((cmd, i) => {
                const lineChars = cmd.text.length;
                const charsVisible = Math.floor(
                  interpolate(
                    frame,
                    [cmd.delay, cmd.delay + lineChars * 0.6],
                    [0, lineChars],
                    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
                  )
                );

                const lineOpacity = frame >= cmd.delay ? 1 : 0;
                const isOutput = (cmd as any).isOutput;

                return (
                  <div
                    key={i}
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 16,
                      lineHeight: 2,
                      opacity: lineOpacity,
                    }}
                  >
                    <span style={{ color: isOutput ? '#4ade80' : COLORS.cyan }}>
                      {cmd.prompt}
                    </span>
                    <span style={{ color: isOutput ? '#4ade80' : COLORS.textPrimary }}>
                      {cmd.text.slice(0, charsVisible)}
                    </span>
                    {!isOutput && charsVisible < lineChars && charsVisible > 0 && (
                      <span
                        style={{
                          color: COLORS.cyan,
                          opacity: frame % 16 < 8 ? 1 : 0,
                        }}
                      >
                        █
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
