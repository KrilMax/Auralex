import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface TTSParagraph {
  id: string;
  text: string;
  chapterIndex: number;
  startOffset: number;
  endOffset: number;
}

export type TTSSegment = TTSParagraph;

export const useTTS = (
  paragraphs: TTSSegment[],
  initialParagraphIndex = 0,
  onComplete?: () => void
) => {
  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentParagraphIndex, setCurrentParagraphIndex] =
    useState(initialParagraphIndex);

  const [speed, setSpeed] =
    useState(1);

  const [voices, setVoices] =
    useState<SpeechSynthesisVoice[]>([]);

  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(
      null
    );

  const utteranceRef =
    useRef<SpeechSynthesisUtterance | null>(
      null
    );

  const currentIndexRef =
    useRef(initialParagraphIndex);

  const isPlayingRef =
    useRef(false);

  const speedRef =
    useRef(1);

  const selectedVoiceRef =
    useRef<SpeechSynthesisVoice | null>(
      null
    );

  const paragraphsRef =
    useRef<TTSParagraph[]>(paragraphs);

  const generationRef = useRef(0);

  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    paragraphsRef.current =
      paragraphs;
  }, [paragraphs]);

  useEffect(() => {
    if (
      initialParagraphIndex >= 0 &&
      initialParagraphIndex <
        paragraphs.length
    ) {
      currentIndexRef.current =
        initialParagraphIndex;

      setCurrentParagraphIndex(
        initialParagraphIndex
      );
    }
  }, [
    initialParagraphIndex,
    paragraphs.length,
  ]);

  useEffect(() => {
    isPlayingRef.current =
      isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current =
      speed;
  }, [speed]);

  useEffect(() => {
    selectedVoiceRef.current =
      selectedVoice;
  }, [selectedVoice]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const loadVoices = useCallback(() => {
    const availableVoices =
      window.speechSynthesis.getVoices();

    setVoices(availableVoices);

    if (
      availableVoices.length > 0 &&
      !selectedVoiceRef.current
    ) {
      setSelectedVoice(
        availableVoices[0]
      );
    }
  }, []);

  useEffect(() => {
    loadVoices();

    window.speechSynthesis.onvoiceschanged =
      loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged =
        null;
    };
  }, [loadVoices]);

  const speakSegment = useCallback(
    (
      index: number,
      cancelCurrent = true
    ) => {
      const currentParagraphs =
        paragraphsRef.current;

      if (
        index < 0 ||
        index >= currentParagraphs.length
      ) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        return;
      }

      const paragraph =
        currentParagraphs[index];

      if (!paragraph?.text.trim()) {
        const nextIndex =
          index + 1;

        if (nextIndex < currentParagraphs.length) {
          speakSegment(nextIndex, false);
        } else {
          isPlayingRef.current = false;
          setIsPlaying(false);
        }

        return;
      }

      const generation =
        generationRef.current;

      if (cancelCurrent) {
        window.speechSynthesis.cancel();
      }

      currentIndexRef.current =
        index;

      setCurrentParagraphIndex(
        index
      );

      const utterance =
        new SpeechSynthesisUtterance(
          paragraph.text
        );

      utterance.rate =
        speedRef.current;

      const voice =
        selectedVoiceRef.current;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (
          generation !==
          generationRef.current
        ) {
          return;
        }

        isPlayingRef.current = true;
        setIsPlaying(true);

        setCurrentParagraphIndex(
          index
        );
      };

      utterance.onend = () => {
        if (generationRef.current !== generation) {
          return;
        }

        if (!isPlayingRef.current) {
          return;
        }

        if (
          currentIndexRef.current <
          paragraphsRef.current.length - 1
        ) {
          const nextIndex =
            currentIndexRef.current + 1;

          setTimeout(() => {
            if (
              generationRef.current !== generation ||
              !isPlayingRef.current
            ) {
              return;
            }

            speakSegment(nextIndex, false);
          }, 50);

          return;
        }

        isPlayingRef.current = false;
        setIsPlaying(false);

        onCompleteRef.current?.();
      };

      utterance.onerror = event => {
        if (
          generation !==
          generationRef.current
        ) {
          return;
        }

        if (
          event.error ===
          'canceled'
        ) {
          return;
        }

        isPlayingRef.current = false;
        setIsPlaying(false);
      };

      utteranceRef.current =
        utterance;

      window.speechSynthesis.speak(
        utterance
      );
    },
    []
  );

  const play = useCallback(() => {
    if (
      paragraphsRef.current.length ===
      0
    ) {
      return;
    }

    if (
      window.speechSynthesis.paused
    ) {
      window.speechSynthesis.resume();

      isPlayingRef.current = true;
      setIsPlaying(true);

      return;
    }

    generationRef.current += 1;

    isPlayingRef.current = true;
    setIsPlaying(true);

    speakSegment(
      currentIndexRef.current
    );
  }, [speakSegment]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();

    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;

    window.speechSynthesis.cancel();

    utteranceRef.current = null;

    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const next = useCallback(() => {
    const nextIndex =
      currentIndexRef.current + 1;

    if (
      nextIndex >=
      paragraphsRef.current.length
    ) {
      return;
    }

    generationRef.current += 1;

    window.speechSynthesis.cancel();

    currentIndexRef.current =
      nextIndex;

    setCurrentParagraphIndex(
      nextIndex
    );

    isPlayingRef.current = true;
    setIsPlaying(true);

    speakSegment(nextIndex);
  }, [speakSegment]);

  const changeSpeed = useCallback(
    (nextSpeed: number) => {
      speedRef.current =
        nextSpeed;

      setSpeed(nextSpeed);

      if (
        utteranceRef.current
      ) {
        utteranceRef.current.rate =
          nextSpeed;
      }
    },
    []
  );

  const changeVoice = useCallback(
    (
      voice: SpeechSynthesisVoice
    ) => {
      selectedVoiceRef.current =
        voice;

      setSelectedVoice(voice);

      if (
        !isPlayingRef.current
      ) {
        return;
      }

      const index =
        currentIndexRef.current;

      generationRef.current += 1;

      window.speechSynthesis.cancel();

      setTimeout(() => {
        generationRef.current += 1;
        speakSegment(index);
      }, 0);
    },
    [speakSegment]
  );

    const setParagraphIndex = useCallback(
    (index: number) => {
      if (
        index < 0 ||
        index >= paragraphsRef.current.length
      ) {
        return;
      }

      generationRef.current += 1;

      window.speechSynthesis.cancel();

      currentIndexRef.current = index;

      setCurrentParagraphIndex(index);

      isPlayingRef.current = false;
      setIsPlaying(false);

      utteranceRef.current = null;
    },
    []
  );

  return {
    isPlaying,
    currentParagraphIndex,
    speed,
    voices,
    selectedVoice,
    play,
    pause,
    stop,
    next,
    changeSpeed,
    changeVoice,
    setParagraphIndex,
    };
};