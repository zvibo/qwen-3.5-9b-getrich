'use client';

import React, { useMemo } from 'react';
import type { EarTrainerConfig, ScaleDegree, QuizAttempt } from './types';
import { SCALE_DEGREES, getDegreeLabel, tonicMidiNote } from './constants';

interface PianoKeyboardProps {
  config: EarTrainerConfig;
  activeDegrees: ScaleDegree[];
  playingMidi?: number | null;
  lastAttempt?: QuizAttempt | null;
  feedbackVisible?: boolean;
}

// White key semitone offsets within an octave (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
// Black key positions: [semitoneOffset, whiteIndexBefore]
const BLACK_KEYS = [
  { semitone: 1,  whiteAfter: 0 },  // C#
  { semitone: 3,  whiteAfter: 1 },  // D#
  { semitone: 6,  whiteAfter: 3 },  // F#
  { semitone: 8,  whiteAfter: 4 },  // G#
  { semitone: 10, whiteAfter: 5 },  // A#
];

const START_OCTAVE = 3;
const NUM_OCTAVES = 3;

export default function PianoKeyboard({
  config,
  activeDegrees,
  playingMidi,
  lastAttempt,
  feedbackVisible,
}: PianoKeyboardProps) {
  const allDegrees = SCALE_DEGREES[config.scaleMode];
  const tonicBase = tonicMidiNote(config.tonicMidi, START_OCTAVE);

  // Build a lookup: midiNote → degree info
  const degreeByMidi = useMemo(() => {
    const map = new Map<number, ScaleDegree>();
    for (let oct = 0; oct < NUM_OCTAVES + 1; oct++) {
      for (const deg of allDegrees) {
        const midi = tonicBase + deg.semitoneOffset + oct * 12;
        map.set(midi, deg);
      }
    }
    return map;
  }, [allDegrees, tonicBase]);

  // Active degree midi set
  const activeMidiSet = useMemo(() => {
    const s = new Set<number>();
    for (let oct = 0; oct < NUM_OCTAVES + 1; oct++) {
      for (const deg of activeDegrees) {
        s.add(tonicBase + deg.semitoneOffset + oct * 12);
      }
    }
    return s;
  }, [activeDegrees, tonicBase]);

  // Tonic midi notes
  const tonicMidis = useMemo(() => {
    const s = new Set<number>();
    for (let oct = 0; oct < NUM_OCTAVES + 1; oct++) {
      s.add(tonicBase + oct * 12);
    }
    return s;
  }, [tonicBase]);

  const totalWhiteKeys = NUM_OCTAVES * 7 + 1; // +1 for C at end

  // semitone offset of wrong answer relative to tonic, for red highlighting
  const wrongSemitone: number | null =
    feedbackVisible && lastAttempt && !lastAttempt.correct && lastAttempt.answeredDegree
      ? lastAttempt.answeredDegree.semitoneOffset
      : null;

  function getKeyColor(midi: number, isBlack: boolean): string {
    const isPlaying = midi === playingMidi;
    const isCorrectTarget = feedbackVisible && lastAttempt?.targetMidi === midi;
    const semitoneFromTonic = ((midi - tonicBase) % 12 + 12) % 12;
    const isWrongPick = wrongSemitone !== null && semitoneFromTonic === wrongSemitone;

    if (isPlaying) return 'bg-amber-400';
    if (isCorrectTarget) return 'bg-green-400';
    if (isWrongPick) return 'bg-red-400';
    if (tonicMidis.has(midi)) return isBlack ? 'bg-blue-700' : 'bg-blue-100 border-blue-400';
    return isBlack ? 'bg-gray-800' : 'bg-white';
  }

  function getLabel(midi: number): string | null {
    if (!activeMidiSet.has(midi)) return null;
    const deg = degreeByMidi.get(midi);
    if (!deg) return null;
    return getDegreeLabel(deg, config.labelSystem);
  }

  // Render octave group
  const octaves = Array.from({ length: NUM_OCTAVES }, (_, i) => START_OCTAVE + i);

  return (
    <div className="overflow-x-auto w-full">
      <div className="relative flex" style={{ minWidth: `${totalWhiteKeys * 36}px` }}>
        {octaves.map(oct => {
          const cMidi = (oct + 1) * 12; // absolute C of this octave

          return (
            <div key={oct} className="relative flex">
              {/* White keys */}
              {WHITE_OFFSETS.map((semitone, wi) => {
                const midi = cMidi + semitone;
                const isActive = activeMidiSet.has(midi);
                const label = getLabel(midi);
                const keyColor = getKeyColor(midi, false);

                return (
                  <div
                    key={wi}
                    className={`relative flex-shrink-0 border border-gray-300 rounded-b-md flex flex-col justify-end items-center pb-1 select-none ${keyColor}`}
                    style={{ width: 36, height: 140 }}
                  >
                    {label && (
                      <span className={`text-xs font-bold px-0.5 rounded ${isActive ? 'text-gray-700' : 'text-gray-300'}`}>
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Black keys — absolutely positioned */}
              {BLACK_KEYS.map(({ semitone, whiteAfter }) => {
                const midi = cMidi + semitone;
                const isActive = activeMidiSet.has(midi);
                const label = getLabel(midi);
                const keyColor = getKeyColor(midi, true);

                return (
                  <div
                    key={semitone}
                    className={`absolute top-0 z-10 rounded-b-sm flex flex-col justify-end items-center pb-1 select-none ${keyColor}`}
                    style={{
                      width: 22,
                      height: 88,
                      left: (whiteAfter + 1) * 36 - 11,
                    }}
                  >
                    {label && (
                      <span className="text-xs font-bold text-white leading-tight text-center px-0.5">
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Final C key */}
        {(() => {
          const lastOct = START_OCTAVE + NUM_OCTAVES;
          const midi = (lastOct + 1) * 12;
          const label = getLabel(midi);
          const keyColor = getKeyColor(midi, false);
          return (
            <div
              className={`relative flex-shrink-0 border border-gray-300 rounded-b-md flex flex-col justify-end items-center pb-1 select-none ${keyColor}`}
              style={{ width: 36, height: 140 }}
            >
              {label && <span className="text-xs font-bold text-gray-700 px-0.5 rounded">{label}</span>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
