'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { EarTrainerConfig } from './types';
import { DEFAULT_CONFIG, getActiveDegrees, NOTE_NAMES } from './constants';
import { useAudioEngine } from './useAudioEngine';
import { useCadencePlayer } from './useCadencePlayer';
import { useQuizEngine } from './useQuizEngine';
import PianoKeyboard from './PianoKeyboard';
import SolfegButtons from './SolfegButtons';
import StatsPanel from './StatsPanel';
import ConfigPanel from './ConfigPanel';

const CONFIG_KEY = 'ear-trainer-config';

function loadConfig(): EarTrainerConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(cfg: EarTrainerConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {}
}

export default function EarTrainerApp() {
  const [config, setConfig] = useState<EarTrainerConfig>(loadConfig);

  const updateConfig = useCallback((updates: Partial<EarTrainerConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      saveConfig(next);
      return next;
    });
  }, []);

  const audio = useAudioEngine();
  const cadence = useCadencePlayer(audio);
  const quiz = useQuizEngine(config, audio, cadence);

  const { state, startRound, replayNote, replayCadence, submitAnswer, resetStats } = quiz;
  const activeDegrees = getActiveDegrees(config);

  const phase = state.phase;
  const feedbackVisible = phase === 'feedback';

  const tonicName = NOTE_NAMES[config.tonicMidi];
  const modeName = config.scaleMode === 'major' ? 'Major' : config.scaleMode === 'minor_natural' ? 'Natural Minor' : 'Harmonic Minor';

  function phaseLabel(): string {
    switch (phase) {
      case 'idle':           return 'Press Start or [Space] to begin';
      case 'playing_cadence': return 'Listening to cadence…';
      case 'playing_note':   return 'Listen to the note…';
      case 'awaiting_answer': return 'Which scale degree?';
      case 'feedback':
        if (!state.lastAttempt) return '';
        return state.lastAttempt.correct ? '✓ Correct!' : `✗ That was ${state.lastAttempt.targetDegree.solfege}`;
    }
  }

  function phaseColor(): string {
    if (phase === 'feedback') {
      return state.lastAttempt?.correct ? 'text-green-400' : 'text-red-400';
    }
    return 'text-gray-400';
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="w-full max-w-3xl mb-6">
        <div className="flex items-center justify-between mb-1">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Dashboard</a>
          <span className="text-xs text-gray-600">
            [Space] next/replay note · [Q] replay cadence · answer keys shown on buttons
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Ear Trainer</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Key: <span className="text-blue-400 font-semibold">{tonicName} {modeName}</span>
          {' · '}
          <span className="text-gray-500">{activeDegrees.length} degrees active</span>
        </p>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-5">
        {/* Piano keyboard */}
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
          <PianoKeyboard
            config={config}
            activeDegrees={activeDegrees}
            playingMidi={state.currentTargetMidi ?? undefined}
            lastAttempt={state.lastAttempt}
            feedbackVisible={feedbackVisible}
          />
        </div>

        {/* Phase status */}
        <div className={`text-center text-lg font-semibold min-h-[28px] ${phaseColor()}`}>
          {phaseLabel()}
        </div>

        {/* Answer buttons */}
        <SolfegButtons
          degrees={activeDegrees}
          config={config}
          phase={phase}
          lastAttempt={state.lastAttempt}
          feedbackVisible={feedbackVisible}
          onAnswer={submitAnswer}
          stats={state.stats}
        />

        {/* Control buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={startRound}
            disabled={phase === 'playing_cadence' || phase === 'playing_note'}
          >
            {phase === 'idle' ? 'Start [Space]' : 'Next [Space]'}
          </button>

          <button
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={replayNote}
            disabled={phase !== 'awaiting_answer'}
          >
            Hear Note [Space]
          </button>

          <button
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={replayCadence}
            disabled={phase !== 'awaiting_answer'}
          >
            Hear Cadence [Q]
          </button>
        </div>

        {/* Stats */}
        <StatsPanel
          stats={state.stats}
          degrees={activeDegrees}
          config={config}
          streak={state.streak}
          totalAttempts={state.totalAttempts}
          onReset={resetStats}
        />

        {/* Config */}
        <ConfigPanel config={config} onChange={updateConfig} />
      </div>
    </main>
  );
}
