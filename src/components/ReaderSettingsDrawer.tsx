import React, { useState } from 'react';
import { ReaderSettings } from '@/lib/types';
import { X, Type, AlignJustify, Maximize2, BookOpen } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onChange: (settings: ReaderSettings) => void;
}

const fonts = [
  { label: 'Crimson Pro', value: "'Crimson Pro', Georgia, serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Outfit', value: "'Outfit', sans-serif" },
  { label: 'System', value: 'system-ui, sans-serif' },
];

const themes: { label: string; value: ReaderSettings['theme']; bg: string; fg: string }[] = [
  { label: 'Dark', value: 'dark', bg: 'bg-background', fg: 'text-foreground' },
  { label: 'Light', value: 'light', bg: 'bg-amber-50', fg: 'text-gray-900' },
  { label: 'Sepia', value: 'sepia', bg: 'bg-amber-100', fg: 'text-amber-900' },
];

const SliderRow: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  displayValue?: string;
}> = ({ label, icon, value, min, max, step, onChange, displayValue }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-foreground font-medium">{displayValue || value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
    />
  </div>
);

const ReaderSettingsDrawer: React.FC<Props> = ({ open, onClose, settings, onChange }) => {
  const update = (partial: Partial<ReaderSettings>) => onChange({ ...settings, ...partial });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold font-display text-foreground">Reader Settings</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Theme */}
          <div className="mb-8">
            <label className="text-sm text-muted-foreground mb-3 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(t => (
                <button
                  key={t.value}
                  onClick={() => update({ theme: t.value })}
                  className={`h-12 rounded-lg border-2 transition-colors flex items-center justify-center text-sm font-medium ${
                    settings.theme === t.value
                      ? 'border-primary'
                      : 'border-border hover:border-muted-foreground/30'
                  } ${t.bg} ${t.fg}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div className="mb-8">
            <label className="text-sm text-muted-foreground mb-3 block">Font Family</label>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map(f => (
                <button
                  key={f.value}
                  onClick={() => update({ fontFamily: f.value })}
                  className={`h-10 rounded-lg border text-sm transition-colors ${
                    settings.fontFamily === f.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-6 mb-8">
            <SliderRow
              label="Font Size"
              icon={<Type className="w-4 h-4" />}
              value={settings.fontSize}
              min={14}
              max={28}
              step={1}
              onChange={v => update({ fontSize: v })}
              displayValue={`${settings.fontSize}px`}
            />
            <SliderRow
              label="Line Height"
              icon={<AlignJustify className="w-4 h-4" />}
              value={settings.lineHeight}
              min={1.2}
              max={2.4}
              step={0.1}
              onChange={v => update({ lineHeight: v })}
              displayValue={`${settings.lineHeight.toFixed(1)}`}
            />
            <SliderRow
              label="Content Width"
              icon={<Maximize2 className="w-4 h-4" />}
              value={settings.contentWidth}
              min={500}
              max={900}
              step={50}
              onChange={v => update({ contentWidth: v })}
              displayValue={`${settings.contentWidth}px`}
            />
            <SliderRow
              label="Paragraph Spacing"
              icon={<BookOpen className="w-4 h-4" />}
              value={settings.paragraphSpacing}
              min={0.5}
              max={3}
              step={0.25}
              onChange={v => update({ paragraphSpacing: v })}
              displayValue={`${settings.paragraphSpacing.toFixed(2)}em`}
            />
          </div>

          {/* Reading Mode */}
          <div>
            <label className="text-sm text-muted-foreground mb-3 block">Reading Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {(['scroll', 'paginate'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => update({ readingMode: mode })}
                  className={`h-10 rounded-lg border text-sm capitalize transition-colors ${
                    settings.readingMode === mode
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {mode === 'scroll' ? 'Infinite Scroll' : 'Pagination'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReaderSettingsDrawer;
