'use client';

import React, { useState } from 'react';
import type { EarTrainerConfig, ScaleMode, DifficultyLevel, LabelSystem } from './types';
import { NOTE_NAMES, CADENCE_PRESETS } from './constants';

interface ConfigPanelProps {
  config: EarTrainerConfig;
  onChange: (updates: Partial<EarTrainerConfig>) => void;
}

export default function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const [open, setOpen] = useState(false);

  const isMinor = config.scaleMode !== 'major';

  function setCadencePreset(presetKey: string) {
    const preset = CADENCE_PRESETS[presetKey];
    if (!preset) return;
    const pattern = isMinor ? preset.minor : preset.major;
    onChange({ cadencePattern: pattern });
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-700 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>Settings</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-5 text-sm text-gray-300">

          {/* Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tonic / Key</label>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_NAMES.map((name, i) => (
                <button
                  key={i}
                  className={`w-10 h-8 rounded text-xs font-bold border transition-colors ${
                    config.tonicMidi === i
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => onChange({ tonicMidi: i })}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Scale mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scale Mode</label>
            <div className="flex gap-2">
              {(['major', 'minor_natural', 'minor_harmonic'] as ScaleMode[]).map(mode => (
                <button
                  key={mode}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    config.scaleMode === mode
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => onChange({ scaleMode: mode })}
                >
                  {mode === 'major' ? 'Major' : mode === 'minor_natural' ? 'Minor (Natural)' : 'Minor (Harmonic)'}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(['half_scale', 'full_diatonic', 'full_chromatic'] as DifficultyLevel[]).map(level => (
                <button
                  key={level}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    config.difficultyLevel === level
                      ? 'bg-emerald-700 border-emerald-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => onChange({ difficultyLevel: level })}
                >
                  {level === 'half_scale' ? 'Half Scale (4 notes)' : level === 'full_diatonic' ? 'Full Scale (7 notes)' : 'Chromatic (12 notes)'}
                </button>
              ))}
            </div>
          </div>

          {/* Octave span */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Note Range</label>
            <div className="flex gap-2">
              {([1, 2] as (1 | 2)[]).map(span => (
                <button
                  key={span}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    config.noteOctaveSpan === span
                      ? 'bg-teal-700 border-teal-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => onChange({ noteOctaveSpan: span })}
                >
                  {span === 1 ? '1 Octave' : '2 Octaves'}
                </button>
              ))}
            </div>
          </div>

          {/* Cadence */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cadence Pattern</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(CADENCE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className="px-3 py-1.5 rounded text-xs font-semibold border bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 transition-colors"
                  onClick={() => setCadencePreset(key)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Current: {config.cadencePattern.join(' → ')}
            </p>
          </div>

          {/* Cadence style */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cadence Style</label>
            <div className="flex gap-2">
              {(['block', 'arpeggio'] as const).map(style => (
                <button
                  key={style}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    config.cadenceStyle === style
                      ? 'bg-indigo-700 border-indigo-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => onChange({ cadenceStyle: style })}
                >
                  {style === 'block' ? 'Block Chords' : 'Arpeggio'}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Cadence Tempo: <span className="text-white">{config.cadenceTempo} BPM</span>
            </label>
            <input
              type="range" min={40} max={160} step={5}
              value={config.cadenceTempo}
              onChange={e => onChange({ cadenceTempo: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Label system */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Button Labels</label>
            <div className="flex gap-2">
              {(['solfege', 'numbers', 'letters'] as LabelSystem[]).map(ls => (
                <button
                  key={ls}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    config.labelSystem === ls
                      ? 'bg-rose-700 border-rose-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => onChange({ labelSystem: ls })}
                >
                  {ls === 'solfege' ? 'Solfège' : ls === 'numbers' ? 'Numbers' : 'Letters'}
                </button>
              ))}
            </div>
          </div>

          {/* Volumes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Cadence Volume: <span className="text-white">{Math.round(config.cadenceVolume * 100)}%</span>
              </label>
              <input
                type="range" min={0} max={1} step={0.05}
                value={config.cadenceVolume}
                onChange={e => onChange({ cadenceVolume: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Note Volume: <span className="text-white">{Math.round(config.noteVolume * 100)}%</span>
              </label>
              <input
                type="range" min={0} max={1} step={0.05}
                value={config.noteVolume}
                onChange={e => onChange({ noteVolume: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Auto-advance */}
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={config.autoAdvance}
              className={`relative w-10 h-5 rounded-full transition-colors ${config.autoAdvance ? 'bg-green-600' : 'bg-gray-600'}`}
              onClick={() => onChange({ autoAdvance: !config.autoAdvance })}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.autoAdvance ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm">Auto-advance to next question</span>
          </div>
        </div>
      )}
    </div>
  );
}
