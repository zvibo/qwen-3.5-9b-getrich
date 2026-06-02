import type { ScaleDegree, CadenceChord, EarTrainerConfig } from './types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function tonicMidiNote(tonicOffset: number, octave: number): number {
  return (octave + 1) * 12 + tonicOffset;
}

// Scale degree tables per mode
// keyShortcut: diatonic degrees use home row (a s d f g h j), chromatic uses top row (w e r t y u)
export const SCALE_DEGREES: Record<string, ScaleDegree[]> = {
  major: [
    { semitoneOffset: 0,  solfege: 'Do',  number: '1',   letter: 'C',  keyShortcut: 'a', isChromatic: false },
    { semitoneOffset: 1,  solfege: 'Di',  number: 'b2',  letter: 'C#', keyShortcut: 'w', isChromatic: true  },
    { semitoneOffset: 2,  solfege: 'Re',  number: '2',   letter: 'D',  keyShortcut: 's', isChromatic: false },
    { semitoneOffset: 3,  solfege: 'Ri',  number: 'b3',  letter: 'Eb', keyShortcut: 'e', isChromatic: true  },
    { semitoneOffset: 4,  solfege: 'Mi',  number: '3',   letter: 'E',  keyShortcut: 'd', isChromatic: false },
    { semitoneOffset: 5,  solfege: 'Fa',  number: '4',   letter: 'F',  keyShortcut: 'f', isChromatic: false },
    { semitoneOffset: 6,  solfege: 'Fi',  number: '#4',  letter: 'F#', keyShortcut: 'r', isChromatic: true  },
    { semitoneOffset: 7,  solfege: 'Sol', number: '5',   letter: 'G',  keyShortcut: 'g', isChromatic: false },
    { semitoneOffset: 8,  solfege: 'Si',  number: 'b6',  letter: 'Ab', keyShortcut: 't', isChromatic: true  },
    { semitoneOffset: 9,  solfege: 'La',  number: '6',   letter: 'A',  keyShortcut: 'h', isChromatic: false },
    { semitoneOffset: 10, solfege: 'Li',  number: 'b7',  letter: 'Bb', keyShortcut: 'y', isChromatic: true  },
    { semitoneOffset: 11, solfege: 'Ti',  number: '7',   letter: 'B',  keyShortcut: 'j', isChromatic: false },
  ],
  minor_natural: [
    { semitoneOffset: 0,  solfege: 'Do',  number: '1',   letter: 'C',  keyShortcut: 'a', isChromatic: false },
    { semitoneOffset: 1,  solfege: 'Di',  number: 'b2',  letter: 'C#', keyShortcut: 'w', isChromatic: true  },
    { semitoneOffset: 2,  solfege: 'Re',  number: '2',   letter: 'D',  keyShortcut: 's', isChromatic: false },
    { semitoneOffset: 3,  solfege: 'Me',  number: 'b3',  letter: 'Eb', keyShortcut: 'e', isChromatic: false },
    { semitoneOffset: 4,  solfege: 'Mi',  number: '3',   letter: 'E',  keyShortcut: 'd', isChromatic: true  },
    { semitoneOffset: 5,  solfege: 'Fa',  number: '4',   letter: 'F',  keyShortcut: 'f', isChromatic: false },
    { semitoneOffset: 6,  solfege: 'Fi',  number: '#4',  letter: 'F#', keyShortcut: 'r', isChromatic: true  },
    { semitoneOffset: 7,  solfege: 'Sol', number: '5',   letter: 'G',  keyShortcut: 'g', isChromatic: false },
    { semitoneOffset: 8,  solfege: 'Le',  number: 'b6',  letter: 'Ab', keyShortcut: 't', isChromatic: false },
    { semitoneOffset: 9,  solfege: 'La',  number: '6',   letter: 'A',  keyShortcut: 'h', isChromatic: true  },
    { semitoneOffset: 10, solfege: 'Te',  number: 'b7',  letter: 'Bb', keyShortcut: 'y', isChromatic: false },
    { semitoneOffset: 11, solfege: 'Ti',  number: '7',   letter: 'B',  keyShortcut: 'j', isChromatic: true  },
  ],
  minor_harmonic: [
    { semitoneOffset: 0,  solfege: 'Do',  number: '1',   letter: 'C',  keyShortcut: 'a', isChromatic: false },
    { semitoneOffset: 1,  solfege: 'Di',  number: 'b2',  letter: 'C#', keyShortcut: 'w', isChromatic: true  },
    { semitoneOffset: 2,  solfege: 'Re',  number: '2',   letter: 'D',  keyShortcut: 's', isChromatic: false },
    { semitoneOffset: 3,  solfege: 'Me',  number: 'b3',  letter: 'Eb', keyShortcut: 'e', isChromatic: false },
    { semitoneOffset: 4,  solfege: 'Mi',  number: '3',   letter: 'E',  keyShortcut: 'd', isChromatic: true  },
    { semitoneOffset: 5,  solfege: 'Fa',  number: '4',   letter: 'F',  keyShortcut: 'f', isChromatic: false },
    { semitoneOffset: 6,  solfege: 'Fi',  number: '#4',  letter: 'F#', keyShortcut: 'r', isChromatic: true  },
    { semitoneOffset: 7,  solfege: 'Sol', number: '5',   letter: 'G',  keyShortcut: 'g', isChromatic: false },
    { semitoneOffset: 8,  solfege: 'Le',  number: 'b6',  letter: 'Ab', keyShortcut: 't', isChromatic: false },
    { semitoneOffset: 9,  solfege: 'La',  number: '6',   letter: 'A',  keyShortcut: 'h', isChromatic: true  },
    { semitoneOffset: 10, solfege: 'Te',  number: 'b7',  letter: 'Bb', keyShortcut: 'y', isChromatic: true  },
    { semitoneOffset: 11, solfege: 'Ti',  number: '7',   letter: 'B',  keyShortcut: 'j', isChromatic: false },
  ],
};

// Chord definitions relative to tonic (semitone offsets)
export const CHORD_DEFS: Record<string, Record<string, CadenceChord>> = {
  major: {
    I:   { romanNumeral: 'I',   semitoneOffsets: [0, 4, 7]  },
    ii:  { romanNumeral: 'ii',  semitoneOffsets: [2, 5, 9]  },
    iii: { romanNumeral: 'iii', semitoneOffsets: [4, 7, 11] },
    IV:  { romanNumeral: 'IV',  semitoneOffsets: [5, 9, 12] },
    V:   { romanNumeral: 'V',   semitoneOffsets: [7, 11, 14] },
    V7:  { romanNumeral: 'V7',  semitoneOffsets: [7, 11, 14, 17] },
    vi:  { romanNumeral: 'vi',  semitoneOffsets: [9, 12, 16] },
  },
  minor_natural: {
    i:   { romanNumeral: 'i',   semitoneOffsets: [0, 3, 7]  },
    iv:  { romanNumeral: 'iv',  semitoneOffsets: [5, 8, 12] },
    V:   { romanNumeral: 'V',   semitoneOffsets: [7, 11, 14] },
    V7:  { romanNumeral: 'V7',  semitoneOffsets: [7, 11, 14, 17] },
    bVI: { romanNumeral: 'bVI', semitoneOffsets: [8, 12, 15] },
    bVII:{ romanNumeral: 'bVII',semitoneOffsets: [10, 14, 17] },
  },
  minor_harmonic: {
    i:   { romanNumeral: 'i',   semitoneOffsets: [0, 3, 7]  },
    iv:  { romanNumeral: 'iv',  semitoneOffsets: [5, 8, 12] },
    V:   { romanNumeral: 'V',   semitoneOffsets: [7, 11, 14] },
    V7:  { romanNumeral: 'V7',  semitoneOffsets: [7, 11, 14, 17] },
    bVI: { romanNumeral: 'bVI', semitoneOffsets: [8, 12, 15] },
  },
};

export const CADENCE_PRESETS: Record<string, { label: string; major: string[]; minor: string[] }> = {
  simple:    { label: 'Simple (I–V–I)',         major: ['I','V','I'],         minor: ['i','V','i']         },
  standard:  { label: 'Standard (I–IV–V–I)',    major: ['I','IV','V','I'],    minor: ['i','iv','V','i']    },
  extended:  { label: 'Extended (I–IV–I–V–I)',  major: ['I','IV','I','V','I'],minor: ['i','iv','i','V','i'] },
  authentic: { label: 'Authentic (I–IV–V7–I)',  major: ['I','IV','V7','I'],   minor: ['i','iv','V7','i']   },
};

export const DEFAULT_CONFIG: EarTrainerConfig = {
  tonicMidi: 0,       // C
  octave: 4,
  scaleMode: 'major',
  difficultyLevel: 'full_diatonic',
  labelSystem: 'solfege',
  cadencePattern: ['I', 'IV', 'V', 'I'],
  cadenceStyle: 'block',
  cadenceTempo: 80,
  noteOctaveSpan: 1,
  cadenceVolume: 0.6,
  noteVolume: 0.8,
  autoAdvance: false,
};

export function getActiveDegrees(config: EarTrainerConfig): ScaleDegree[] {
  const all = SCALE_DEGREES[config.scaleMode];
  switch (config.difficultyLevel) {
    case 'half_scale':
      // Do Re Mi Sol (and minor equivalents at same offsets: 0 2 3/4 7)
      return all.filter(d => !d.isChromatic).slice(0, 4);
    case 'full_diatonic':
      return all.filter(d => !d.isChromatic);
    case 'full_chromatic':
      return all;
  }
}

export function getDegreeLabel(degree: ScaleDegree, labelSystem: EarTrainerConfig['labelSystem']): string {
  switch (labelSystem) {
    case 'solfege':  return degree.solfege;
    case 'numbers':  return degree.number;
    case 'letters':  return degree.letter;
  }
}
