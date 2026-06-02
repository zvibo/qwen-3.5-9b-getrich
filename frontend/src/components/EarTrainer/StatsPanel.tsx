'use client';

import React, { useState } from 'react';
import type { DegreeStats, ScaleDegree, EarTrainerConfig } from './types';
import { getDegreeLabel } from './constants';

interface StatsPanelProps {
  stats: Record<string, DegreeStats>;
  degrees: ScaleDegree[];
  config: EarTrainerConfig;
  streak: number;
  totalAttempts: number;
  onReset: () => void;
}

export default function StatsPanel({ stats, degrees, config, streak, totalAttempts, onReset }: StatsPanelProps) {
  const [open, setOpen] = useState(false);

  const totalCorrect = Object.values(stats).reduce((s, d) => s + d.correct, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-700 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>Stats</span>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Streak: <span className="text-amber-400 font-bold">{streak}</span></span>
          <span>{totalCorrect}/{totalAttempts} ({overallAccuracy}%)</span>
          <span>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-700">
                <th className="text-left py-1">Degree</th>
                <th className="text-right py-1">Correct</th>
                <th className="text-right py-1">Total</th>
                <th className="text-right py-1">Accuracy</th>
                <th className="py-1 pl-2">Bar</th>
              </tr>
            </thead>
            <tbody>
              {degrees.map(deg => {
                const s = stats[deg.solfege] ?? { correct: 0, total: 0 };
                const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                const label = getDegreeLabel(deg, config.labelSystem);
                return (
                  <tr key={deg.solfege} className="border-b border-gray-700/50">
                    <td className="py-1.5 font-medium">{label} <span className="text-gray-500 text-xs">({deg.solfege})</span></td>
                    <td className="text-right text-green-400">{s.correct}</td>
                    <td className="text-right">{s.total}</td>
                    <td className="text-right">
                      {s.total >= 3
                        ? <span className={pct >= 75 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}>{pct}%</span>
                        : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="pl-2 py-1.5">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            className="mt-3 text-xs text-gray-500 hover:text-red-400 transition-colors"
            onClick={onReset}
          >
            Reset stats
          </button>
        </div>
      )}
    </div>
  );
}
