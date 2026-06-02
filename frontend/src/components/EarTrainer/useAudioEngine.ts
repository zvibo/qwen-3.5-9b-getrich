'use client';

import { useRef, useCallback } from 'react';
import { midiToFreq } from './constants';

export interface AudioEngine {
  playNote: (midiNote: number, duration: number, volume: number, startTime?: number) => void;
  playChord: (midiNotes: number[], duration: number, volume: number, style: 'block' | 'arpeggio', startTime?: number) => void;
  unlockContext: () => void;
  getContext: () => AudioContext | null;
}

export function useAudioEngine(): AudioEngine {
  const ctxRef = useRef<AudioContext | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  const ensureContext = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 6;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressor.connect(ctx.destination);
      ctxRef.current = ctx;
      compressorRef.current = compressor;
    }
    return ctxRef.current;
  }, []);

  const unlockContext = useCallback(() => {
    const ctx = ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }, [ensureContext]);

  const playNote = useCallback((midiNote: number, duration: number, volume: number, startTime?: number) => {
    const ctx = ensureContext();
    if (ctx.state === 'suspended') ctx.resume();
    const compressor = compressorRef.current!;
    const t = startTime ?? (ctx.currentTime + 0.02);
    const freq = midiToFreq(midiNote);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq;
    // Slight detuning for warmth
    osc2.detune.value = 3;

    const gainEnv = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.7;

    const masterGain = ctx.createGain();
    masterGain.gain.value = volume * 0.35;

    osc1.connect(gainEnv);
    osc2.connect(gainEnv);
    gainEnv.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(compressor);

    // ADSR envelope
    gainEnv.gain.setValueAtTime(0, t);
    gainEnv.gain.linearRampToValueAtTime(1.0, t + 0.005);
    gainEnv.gain.exponentialRampToValueAtTime(0.4, t + 0.3);
    gainEnv.gain.setValueAtTime(0.4, t + Math.max(0.31, duration - 0.05));
    gainEnv.gain.exponentialRampToValueAtTime(0.001, t + duration + 1.2);

    const stopTime = t + duration + 1.25;
    osc1.start(t);
    osc1.stop(stopTime);
    osc2.start(t);
    osc2.stop(stopTime);
  }, [ensureContext]);

  const playChord = useCallback((
    midiNotes: number[],
    duration: number,
    volume: number,
    style: 'block' | 'arpeggio',
    startTime?: number,
  ) => {
    const ctx = ensureContext();
    const t = startTime ?? (ctx.currentTime + 0.02);
    const arpeggioStep = 0.06;

    midiNotes.forEach((midi, i) => {
      const noteStart = style === 'arpeggio' ? t + i * arpeggioStep : t;
      playNote(midi, duration, volume * 0.7, noteStart);
    });
  }, [ensureContext, playNote]);

  const getContext = useCallback(() => ctxRef.current, []);

  return { playNote, playChord, unlockContext, getContext };
}
