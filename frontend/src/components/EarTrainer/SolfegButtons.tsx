'use client';

import React from 'react';
import type { ScaleDegree, DegreeStats, EarTrainerConfig, QuizPhase, QuizAttempt } from './types';
import { getDegreeLabel } from './constants';

interface SolfegButtonsProps {
  degrees: ScaleDegree[];
  config: EarTrainerConfig;
  phase: QuizPhase;
  lastAttempt: QuizAttempt | null;
  feedbackVisible: boolean;
  onAnswer: (degree: ScaleDegree) => void;
  stats: Record<string, DegreeStats>;
}

export default function SolfegButtons({
  degrees,
  config,
  phase,
  lastAttempt,
  feedbackVisible,
  onAnswer,
  stats,
}: SolfegButtonsProps) {
  const disabled = phase !== 'awaiting_answer';

  const diatonic = degrees.filter(d => !d.isChromatic);
  const chromatic = degrees.filter(d => d.isChromatic);

  function getButtonStyle(degree: ScaleDegree): string {
    const base = 'relative flex flex-col items-center justify-center rounded-lg border-2 font-bold transition-all duration-150 py-2 px-3 min-w-[52px]';

    if (feedbackVisible && lastAttempt) {
      const isTarget = degree.solfege === lastAttempt.targetDegree.solfege;
      const isPicked = degree.solfege === lastAttempt.answeredDegree?.solfege;
      if (isTarget) return `${base} bg-green-500 border-green-400 text-white scale-105`;
      if (isPicked && !lastAttempt.correct) return `${base} bg-red-500 border-red-400 text-white`;
    }

    if (disabled) return `${base} bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed opacity-70`;
    return `${base} bg-gray-700 border-gray-500 text-white hover:bg-gray-600 hover:border-gray-400 hover:scale-105 cursor-pointer`;
  }

  function accuracy(degree: ScaleDegree): string | null {
    const s = stats[degree.solfege];
    if (!s || s.total < 3) return null;
    return `${Math.round((s.correct / s.total) * 100)}%`;
  }

  function renderButton(degree: ScaleDegree) {
    const label = getDegreeLabel(degree, config.labelSystem);
    const acc = accuracy(degree);
    return (
      <button
        key={degree.solfege}
        className={getButtonStyle(degree)}
        onClick={() => !disabled && onAnswer(degree)}
        disabled={disabled}
        title={`${degree.solfege} — press [${degree.keyShortcut.toUpperCase()}]`}
      >
        <span className="text-base leading-tight">{label}</span>
        <span className="text-xs text-gray-400 font-normal">[{degree.keyShortcut.toUpperCase()}]</span>
        {acc && <span className="text-xs text-emerald-400 font-normal">{acc}</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Diatonic row */}
      <div className="flex flex-wrap justify-center gap-2">
        {diatonic.map(renderButton)}
      </div>
      {/* Chromatic row (only in chromatic mode) */}
      {chromatic.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {chromatic.map(renderButton)}
        </div>
      )}
    </div>
  );
}
