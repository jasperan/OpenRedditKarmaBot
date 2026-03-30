import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const BackendScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const endpoints = [
    { method: 'POST', path: '/generate', desc: 'Generate comment drafts', color: '#4ade80' },
    { method: 'POST', path: '/analyze-tone', desc: 'Analyze text formality', color: '#facc15' },
    { method: 'GET', path: '/health', desc: 'Service health check', color: '#60a5fa' },
    { method: 'GET', path: '/models', desc: 'List available models', color: '#c084fc' },
    { method: 'POST', path: '/settings', desc: 'Update configuration', color: '#f472b6' },
  ];

  return (
    <AbsoluteFill>
      <GridBackground />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: 50 }}>
          <NeonText fontSize={48} color={COLORS.white}>
            FastAPI Backend
          </NeonText>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', maxWidth: 1400 }}>
          {endpoints.map((ep, i) => {
            // Cards fly in from different directions
            const directions = [
              { x: -200, y: -100 },
              { x: 200, y: -100 },
              { x: -200, y: 100 },
              { x: 200, y: 100 },
              { x: 0, y: 200 },
            ];
            const dir = directions[i];
            const entrance = spring({
              frame: frame - 10 - i * 12,
              fps,
              config: { damping: 15, stiffness: 80 },
            });

            const x = interpolate(entrance, [0, 1], [dir.x, 0]);
            const y = interpolate(entrance, [0, 1], [dir.y, 0]);
            const rotation = interpolate(entrance, [0, 1], [(i % 2 === 0 ? -15 : 15), 0]);

            return (
              <div
                key={i}
                style={{
                  opacity: entrance,
                  transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                }}
              >
                <NeonCard width={380} glowColor={ep.color} style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    {/* Method badge */}
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        fontWeight: 700,
                        color: COLORS.bgPrimary,
                        background: ep.color,
                        padding: '3px 10px',
                        borderRadius: 4,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {ep.method}
                    </div>
                    {/* Path */}
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 20,
                        color: COLORS.white,
                        fontWeight: 600,
                      }}
                    >
                      {ep.path}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 16,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {ep.desc}
                  </div>
                </NeonCard>
              </div>
            );
          })}
        </div>

        {/* FastAPI badge */}
        <div
          style={{
            marginTop: 40,
            opacity: interpolate(frame, [80, 100], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }),
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 16,
              color: COLORS.cyan,
              padding: '8px 24px',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 8,
              background: COLORS.codeBg,
            }}
          >
            Python 3.11+ / Async / CORS-enabled
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
