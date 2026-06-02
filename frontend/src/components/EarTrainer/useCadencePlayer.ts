'use client';

import { useCallback, useRef, useState } from 'react';
import type { AudioEngine } from './useAudioEngine';
import type { EarTrainerConfig } from './types';
import { CHORD_DEFS, tonicMidiNote } from './constants';

export interface CadencePlayer {
  playCadence: (config: EarTrainerConfig, onComplete?: () => void) => void;
  stopCadence: () => void;
  isPlaying: boolean;
}

export function useCadencePlayer(audio: AudioEngine): CadencePlayer {
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCadence = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playCadence = useCallback((config: EarTrainerConfig, onComplete?: () => void) => {
    const ctx = audio.getContext();
    // AudioContext created lazily; unlockContext must have been called first
    if (!ctx) return;

    stopCadence();
    setIsPlaying(true);

    const chordDefs = CHORD_DEFS[config.scaleMode] ?? CHORD_DEFS['major'];
    const beatDuration = 60 / config.cadenceTempo;   // seconds per beat
    const chordDuration = beatDuration * 2;            // 2 beats per chord
    const tonicBase = tonicMidiNote(config.tonicMidi, config.octave - 1); // one octave below for cadence bass

    let t = ctx.currentTime + 0.1;
    let totalDuration = 0;

    for (const symbol of config.cadencePattern) {
      const chord = chordDefs[symbol];
      if (!chord) continue;
      const midiNotes = chord.semitoneOffsets.map(offset => tonicBase + offset);
      audio.playChord(midiNotes, chordDuration, config.cadenceVolume, config.cadenceStyle, t);
      t += chordDuration;
      totalDuration += chordDuration;
    }

    timerRef.current = setTimeout(() => {
      setIsPlaying(false);
      onComplete?.();
    }, totalDuration * 1000 + 200);
  }, [audio, stopCadence]);

  return { playCadence, stopCadence, isPlaying };
}
