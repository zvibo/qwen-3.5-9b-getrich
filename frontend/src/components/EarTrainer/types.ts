export type ScaleMode = 'major' | 'minor_natural' | 'minor_harmonic';

export type DifficultyLevel = 'half_scale' | 'full_diatonic' | 'full_chromatic';

export type LabelSystem = 'solfege' | 'numbers' | 'letters';

export type CadenceStyle = 'block' | 'arpeggio';

export type QuizPhase =
  | 'idle'
  | 'playing_cadence'
  | 'playing_note'
  | 'awaiting_answer'
  | 'feedback';

export interface ScaleDegree {
  semitoneOffset: number;
  solfege: string;
  number: string;
  letter: string;
  keyShortcut: string;
  isChromatic: boolean;
}

export interface CadenceChord {
  romanNumeral: string;
  semitoneOffsets: number[];
}

export interface EarTrainerConfig {
  tonicMidi: number;
  octave: number;
  scaleMode: ScaleMode;
  difficultyLevel: DifficultyLevel;
  labelSystem: LabelSystem;
  cadencePattern: string[];
  cadenceStyle: CadenceStyle;
  cadenceTempo: number;
  noteOctaveSpan: 1 | 2;
  cadenceVolume: number;
  noteVolume: number;
  autoAdvance: boolean;
}

export interface DegreeStats {
  correct: number;
  total: number;
}

export interface QuizAttempt {
  targetDegree: ScaleDegree;
  targetMidi: number;
  answeredDegree: ScaleDegree | null;
  correct: boolean;
}

export interface QuizState {
  phase: QuizPhase;
  currentTarget: ScaleDegree | null;
  currentTargetMidi: number | null;
  lastAttempt: QuizAttempt | null;
  stats: Record<string, DegreeStats>;
  streak: number;
  totalAttempts: number;
}
