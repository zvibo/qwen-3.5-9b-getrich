'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { EarTrainerConfig, QuizState, ScaleDegree, DegreeStats, QuizAttempt } from './types';
import { getActiveDegrees, tonicMidiNote } from './constants';
import type { AudioEngine } from './useAudioEngine';
import type { CadencePlayer } from './useCadencePlayer';

const NOTE_DURATION = 1.8; // seconds

function buildEmptyStats(degrees: ScaleDegree[]): Record<string, DegreeStats> {
  const s: Record<string, DegreeStats> = {};
  for (const d of degrees) s[d.solfege] = { correct: 0, total: 0 };
  return s;
}

function weightedRandom(degrees: ScaleDegree[], stats: Record<string, DegreeStats>): ScaleDegree {
  const weights = degrees.map(d => {
    const s = stats[d.solfege];
    const accuracy = s && s.total > 0 ? s.correct / s.total : 0.5;
    return 1 + (1 - accuracy) * 2;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < degrees.length; i++) {
    r -= weights[i];
    if (r <= 0) return degrees[i];
  }
  return degrees[degrees.length - 1];
}

type Action =
  | { type: 'START_CADENCE' }
  | { type: 'START_NOTE'; target: ScaleDegree; midi: number }
  | { type: 'AWAIT_ANSWER' }
  | { type: 'SUBMIT_ANSWER'; degree: ScaleDegree }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET_STATS'; degrees: ScaleDegree[] };

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case 'START_CADENCE':
      return { ...state, phase: 'playing_cadence' };

    case 'START_NOTE':
      return { ...state, phase: 'playing_note', currentTarget: action.target, currentTargetMidi: action.midi };

    case 'AWAIT_ANSWER':
      return { ...state, phase: 'awaiting_answer' };

    case 'SUBMIT_ANSWER': {
      const target = state.currentTarget!;
      const correct = action.degree.solfege === target.solfege;
      const prevStats = state.stats[target.solfege] ?? { correct: 0, total: 0 };
      const attempt: QuizAttempt = {
        targetDegree: target,
        targetMidi: state.currentTargetMidi!,
        answeredDegree: action.degree,
        correct,
      };
      return {
        ...state,
        phase: 'feedback',
        lastAttempt: attempt,
        streak: correct ? state.streak + 1 : 0,
        totalAttempts: state.totalAttempts + 1,
        stats: {
          ...state.stats,
          [target.solfege]: {
            correct: prevStats.correct + (correct ? 1 : 0),
            total: prevStats.total + 1,
          },
        },
      };
    }

    case 'NEXT_ROUND':
      return { ...state, phase: 'playing_cadence', lastAttempt: null };

    case 'RESET_STATS':
      return { ...state, stats: buildEmptyStats(action.degrees), streak: 0, totalAttempts: 0 };

    default:
      return state;
  }
}

function loadStats(config: EarTrainerConfig): Record<string, DegreeStats> {
  if (typeof window === 'undefined') return {};
  try {
    const key = `ear-trainer-stats-${config.scaleMode}-${config.tonicMidi}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStats(config: EarTrainerConfig, stats: Record<string, DegreeStats>) {
  if (typeof window === 'undefined') return;
  try {
    const key = `ear-trainer-stats-${config.scaleMode}-${config.tonicMidi}`;
    localStorage.setItem(key, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function useQuizEngine(
  config: EarTrainerConfig,
  audio: AudioEngine,
  cadence: CadencePlayer,
) {
  const degrees = getActiveDegrees(config);
  const savedStats = loadStats(config);
  const initialStats: Record<string, DegreeStats> = {};
  for (const d of degrees) {
    initialStats[d.solfege] = savedStats[d.solfege] ?? { correct: 0, total: 0 };
  }

  const [state, dispatch] = useReducer(reducer, {
    phase: 'idle',
    currentTarget: null,
    currentTargetMidi: null,
    lastAttempt: null,
    stats: initialStats,
    streak: 0,
    totalAttempts: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const configRef = useRef(config);
  configRef.current = config;

  // Persist stats whenever they change
  useEffect(() => {
    if (state.totalAttempts > 0) {
      saveStats(config, state.stats);
    }
  }, [state.stats, state.totalAttempts, config]);

  const playTargetNote = useCallback((target: ScaleDegree, midi: number) => {
    dispatch({ type: 'START_NOTE', target, midi });
    audio.playNote(midi, NOTE_DURATION, configRef.current.noteVolume);
    setTimeout(() => dispatch({ type: 'AWAIT_ANSWER' }), NOTE_DURATION * 1000 + 100);
  }, [audio]);

  const startRound = useCallback(() => {
    audio.unlockContext();
    const cfg = configRef.current;
    const activeDegrees = getActiveDegrees(cfg);
    const target = weightedRandom(activeDegrees, stateRef.current.stats);

    // Determine octave for the note
    let octaveShift = 0;
    if (cfg.noteOctaveSpan === 2 && Math.random() < 0.5) octaveShift = 1;
    const tonicBase = tonicMidiNote(cfg.tonicMidi, cfg.octave);
    const midi = tonicBase + target.semitoneOffset + octaveShift * 12;

    dispatch({ type: 'START_CADENCE' });
    cadence.playCadence(cfg, () => {
      playTargetNote(target, midi);
    });
  }, [audio, cadence, playTargetNote]);

  const replayNote = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentTarget || !s.currentTargetMidi) return;
    if (s.phase !== 'awaiting_answer') return;
    audio.playNote(s.currentTargetMidi, NOTE_DURATION, configRef.current.noteVolume);
  }, [audio]);

  const replayCadence = useCallback(() => {
    if (stateRef.current.phase !== 'awaiting_answer') return;
    const targetMidi = stateRef.current.currentTargetMidi;
    const cfg = configRef.current;
    cadence.playCadence(cfg, () => {
      if (targetMidi !== null) {
        audio.playNote(targetMidi, NOTE_DURATION, cfg.noteVolume);
      }
    });
  }, [audio, cadence]);

  const submitAnswer = useCallback((degree: ScaleDegree) => {
    if (stateRef.current.phase !== 'awaiting_answer') return;
    dispatch({ type: 'SUBMIT_ANSWER', degree });

    setTimeout(() => {
      if (configRef.current.autoAdvance) {
        dispatch({ type: 'NEXT_ROUND' });
        // Small gap before next round
        setTimeout(() => startRound(), 300);
      }
    }, 1200);
  }, [startRound]);

  const resetStats = useCallback(() => {
    const activeDegrees = getActiveDegrees(configRef.current);
    dispatch({ type: 'RESET_STATS', degrees: activeDegrees });
    saveStats(configRef.current, buildEmptyStats(activeDegrees));
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      const phase = stateRef.current.phase;
      const key = e.key.toLowerCase();

      if (key === ' ') {
        e.preventDefault();
        if (phase === 'idle' || phase === 'feedback') {
          startRound();
        } else if (phase === 'awaiting_answer') {
          replayNote();
        }
        return;
      }

      // 'q' = replay cadence (doesn't conflict with any degree shortcut)
      if (key === 'q' && phase === 'awaiting_answer') {
        replayCadence();
        return;
      }

      if (phase === 'awaiting_answer') {
        const activeDegrees = getActiveDegrees(configRef.current);
        const degree = activeDegrees.find(d => d.keyShortcut === key);
        if (degree) submitAnswer(degree);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [startRound, replayNote, replayCadence, submitAnswer]);

  return { state, startRound, replayNote, replayCadence, submitAnswer, resetStats };
}
