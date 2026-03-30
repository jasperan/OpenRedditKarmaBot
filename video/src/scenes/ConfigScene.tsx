import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { GridBackground } from '../components/GridBackground';
import { NeonText } from '../components/NeonText';
import { NeonCard } from '../components/NeonCard';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../styles/colors';

export const ConfigScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sliders = [
    { label: 'Typing Speed (WPM)', min: 40, max: 120, value: 85, color: COLORS.cyan },
    { label: 'Temperature', min: 0, max: 1, value: 0.7, color: COLORS.magenta },
    { label: 'Draft Count', min: 1, max: 10, value: 5, color: '#facc15' },
    { label: 'Typo Rate', min: 0, max: 0.1, value: 0.03, color: '#4ade80' },
    { label: 'Max Length (words)', min: 20, max: 200, value: 80, color: '#a78bfa' },
  ];

  const panelEntrance = spring({
    frame: frame - 10,
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
          Configuration
        </NeonText>

        <div
          style={{
            opacity: panelEntrance,
            transform: `translateY(${interpolate(panelEntrance, [0, 1], [40, 0])}px)`,
          }}
        >
          <NeonCard width={700} glowColor={COLORS.cyan}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.white,
                marginBottom: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>⚙️</span> Settings Panel
            </div>

            {sliders.map((slider, i) => {
              const sliderProgress = interpolate(
                frame,
                [30 + i * 15, 50 + i * 15],
                [0, 1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
              );

              const normalizedValue = (slider.value - slider.min) / (slider.max - slider.min);
              const fillWidth = normalizedValue * sliderProgress * 100;

              return (
                <div key={i} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 16,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {slider.label}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 16,
                        color: slider.color,
                        fontWeight: 700,
                      }}
                    >
                      {slider.value}
                    </span>
                  </div>

                  {/* Slider track */}
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 3,
                      position: 'relative',
                    }}
                  >
                    {/* Fill */}
                    <div
                      style={{
                        width: `${fillWidth}%`,
                        height: '100%',
                        background: slider.color,
                        borderRadius: 3,
                        boxShadow: `0 0 8px ${slider.color}40`,
                      }}
                    />
                    {/* Thumb */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${fillWidth}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: slider.color,
                        border: `2px solid ${COLORS.white}`,
                        boxShadow: `0 0 10px ${slider.color}60`,
                        opacity: sliderProgress,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </NeonCard>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
