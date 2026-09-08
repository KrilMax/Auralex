import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronDown,
} from 'lucide-react';

interface Props {
  visible: boolean;
  onClose: () => void;

  isPlaying: boolean;
  currentParagraphIndex: number;
  paragraphCount: number;

  speed: number;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;

  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeedChange: (speed: number) => void;
  onVoiceChange: (
    voice: SpeechSynthesisVoice
  ) => void;
}

const speeds = [0.75, 1, 1.25, 1.5, 2];

const TTSControlPanel: React.FC<Props> = ({
  visible,
  onClose,
  isPlaying,
  currentParagraphIndex,
  paragraphCount,
  speed,
  voices,
  selectedVoice,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onSpeedChange,
  onVoiceChange,
}) => {
  const [showVoices, setShowVoices] =
    useState(false);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 pb-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between gap-4">

            {/* Playback controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={
                  isPlaying
                    ? onPause
                    : onPlay
                }
                className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>

              <button
                onClick={onPrevious}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={onNext}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Current text indicator */}
            <div className="flex-1 min-w-0 hidden sm:block">
              <p className="text-xs text-muted-foreground truncate">
                {isPlaying
                  ? `Reading paragraph ${
                      currentParagraphIndex + 1
                    } of ${paragraphCount}...`
                  : 'Ready to read'}
              </p>

              <div className="w-full h-1 bg-secondary rounded-full mt-1.5">
                <div
                  className="h-full gradient-primary rounded-full transition-all"
                  style={{
                    width:
                      paragraphCount > 0
                        ? `${
                            ((currentParagraphIndex + 1) /
                              paragraphCount) *
                            100
                          }%`
                        : '0%',
                  }}
                />
              </div>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-1">
              {speeds.map(s => (
                <button
                  key={s}
                  onClick={() =>
                    onSpeedChange(s)
                  }
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    speed === s
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Voice selector */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowVoices(
                    !showVoices
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground hover:bg-surface-hover transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />

                {selectedVoice?.name ??
                  'Default'}

                <ChevronDown className="w-3 h-3" />
              </button>

              {showVoices && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() =>
                      setShowVoices(false)
                    }
                  />

                  <div className="absolute bottom-12 right-0 z-50 w-40 bg-card border border-border rounded-xl shadow-xl p-1 animate-fade-in">
                    {voices.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No voices available
                      </div>
                    ) : (
                      voices.map(
                        voiceOption => (
                          <button
                            key={`${voiceOption.name}-${voiceOption.lang}`}
                            onClick={() => {
                              onVoiceChange(
                                voiceOption
                              );
                              setShowVoices(
                                false
                              );
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              selectedVoice?.name ===
                              voiceOption.name
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-secondary'
                            }`}
                          >
                            {voiceOption.name}
                          </button>
                        )
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TTSControlPanel;