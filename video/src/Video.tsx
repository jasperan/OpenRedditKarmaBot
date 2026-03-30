import React from 'react';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

import { TitleScene } from './scenes/TitleScene';
import { ProblemScene } from './scenes/ProblemScene';
import { SolutionScene } from './scenes/SolutionScene';
import { ArchitectureScene } from './scenes/ArchitectureScene';
import { DataFlowScene } from './scenes/DataFlowScene';
import { ExtensionScene } from './scenes/ExtensionScene';
import { ScannerScene } from './scenes/ScannerScene';
import { ContextScene } from './scenes/ContextScene';
import { BackendScene } from './scenes/BackendScene';
import { VllmScene } from './scenes/VllmScene';
import { ToneScene } from './scenes/ToneScene';
import { AnglesScene } from './scenes/AnglesScene';
import { PromptScene } from './scenes/PromptScene';
import { TypingEngineScene } from './scenes/TypingEngineScene';
import { BigramScene } from './scenes/BigramScene';
import { VarianceScene } from './scenes/VarianceScene';
import { TypoScene } from './scenes/TypoScene';
import { AntiDetectionScene } from './scenes/AntiDetectionScene';
import { PopupScene } from './scenes/PopupScene';
import { InjectorScene } from './scenes/InjectorScene';
import { ConfigScene } from './scenes/ConfigScene';
import { TechStackScene } from './scenes/TechStackScene';
import { TestingScene } from './scenes/TestingScene';
import { QuickStartScene } from './scenes/QuickStartScene';
import { OpenSourceScene } from './scenes/OpenSourceScene';
import { OutroScene } from './scenes/OutroScene';

// 30fps. Each scene's duration in frames:
// ~4-8 seconds each = 120-240 frames per scene
const FPS = 30;

// Scene definitions with durations (frames)
const scenes = [
  { component: TitleScene, duration: 150 },        // 5s  - Intro/Title
  { component: ProblemScene, duration: 150 },       // 5s  - Problem Statement
  { component: SolutionScene, duration: 150 },      // 5s  - Solution Reveal
  { component: ArchitectureScene, duration: 180 },  // 6s  - Architecture
  { component: DataFlowScene, duration: 240 },      // 8s  - Data Flow
  { component: ExtensionScene, duration: 150 },     // 5s  - Chrome Extension
  { component: ScannerScene, duration: 150 },       // 5s  - DOM Scanner
  { component: ContextScene, duration: 150 },       // 5s  - Context Extraction
  { component: BackendScene, duration: 180 },       // 6s  - FastAPI Backend
  { component: VllmScene, duration: 150 },          // 5s  - vLLM Integration
  { component: ToneScene, duration: 180 },          // 6s  - Tone Analyzer
  { component: AnglesScene, duration: 180 },        // 6s  - Multi-Angle Generation
  { component: PromptScene, duration: 150 },        // 5s  - Prompt Engineering
  { component: TypingEngineScene, duration: 240 },  // 8s  - HERO: Biometric Typing
  { component: BigramScene, duration: 150 },        // 5s  - Bigram Timing
  { component: VarianceScene, duration: 150 },      // 5s  - Typing Variance
  { component: TypoScene, duration: 150 },          // 5s  - Typo Simulation
  { component: AntiDetectionScene, duration: 150 }, // 5s  - Anti-Detection
  { component: PopupScene, duration: 180 },         // 6s  - Popup UI
  { component: InjectorScene, duration: 120 },      // 4s  - Comment Injector
  { component: ConfigScene, duration: 150 },        // 5s  - Configuration
  { component: TechStackScene, duration: 180 },     // 6s  - Tech Stack
  { component: TestingScene, duration: 120 },       // 4s  - Testing
  { component: QuickStartScene, duration: 180 },    // 6s  - Quick Start
  { component: OpenSourceScene, duration: 150 },    // 5s  - Open Source CTA
  { component: OutroScene, duration: 120 },         // 4s  - Outro
];

// Transition duration in frames
const TRANSITION_FRAMES = 15; // 0.5s transitions

export const Video: React.FC = () => {
  return (
    <TransitionSeries>
      {scenes.map((scene, i) => {
        const SceneComponent = scene.component;

        return (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={scene.duration}>
              <SceneComponent />
            </TransitionSeries.Sequence>

            {/* Add transition between scenes (not after the last one) */}
            {i < scenes.length - 1 && (
              <TransitionSeries.Transition
                presentation={i % 2 === 0 ? fade() : slide({ direction: 'from-right' })}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};

// Calculate total duration for the composition
// Total = sum of all scene durations - (number of transitions * transition duration)
const totalSceneDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
const numTransitions = scenes.length - 1;
export const TOTAL_DURATION = totalSceneDuration - numTransitions * TRANSITION_FRAMES;
// Expected: 4170 - (25 * 15) = 4170 - 375 = 3795 frames = ~126.5 seconds at 30fps
