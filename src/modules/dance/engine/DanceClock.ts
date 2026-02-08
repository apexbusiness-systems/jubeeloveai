/**
 * BeeSync DanceClock
 *
 * Deterministic song clock driven by audio playback time with
 * performance.now() fallback anchored to the real audio start moment.
 */

type AudioClockSource = HTMLAudioElement | null;

export class DanceClock {
  private audio: AudioClockSource;
  private latencyOffsetMs = 0;
  private fallbackStartPerf: number | null = null;
  private fallbackStartSongMs = 0;
  private lastKnownAudioTimeMs = 0;
  private isPaused = true;
  private listenersAttached = false;

  private readonly handlePlay = () => {
    const now = this.now();
    const audioTimeMs = this.getAudioTimeMs();

    if (Number.isFinite(audioTimeMs)) {
      this.lastKnownAudioTimeMs = audioTimeMs;
      this.fallbackStartSongMs = audioTimeMs;
    }

    this.fallbackStartPerf = now;
    this.isPaused = false;
  };

  private readonly handlePause = () => {
    const audioTimeMs = this.getAudioTimeMs();
    const now = this.now();

    if (Number.isFinite(audioTimeMs)) {
      this.lastKnownAudioTimeMs = audioTimeMs;
      this.fallbackStartSongMs = audioTimeMs;
    } else if (this.fallbackStartPerf !== null) {
      this.fallbackStartSongMs += now - this.fallbackStartPerf;
    }

    this.fallbackStartPerf = null;
    this.isPaused = true;
  };

  private readonly handleSeeked = () => {
    const audioTimeMs = this.getAudioTimeMs();
    const now = this.now();

    if (Number.isFinite(audioTimeMs)) {
      this.lastKnownAudioTimeMs = audioTimeMs;
      this.fallbackStartSongMs = audioTimeMs;
    }

    if (!this.isPaused) {
      this.fallbackStartPerf = now;
    }
  };

  private readonly handleTimeUpdate = () => {
    const audioTimeMs = this.getAudioTimeMs();
    if (Number.isFinite(audioTimeMs)) {
      this.lastKnownAudioTimeMs = audioTimeMs;
    }
  };

  constructor(audio: AudioClockSource) {
    this.audio = audio;
    if (audio) {
      this.attachListeners(audio);
    }
  }

  private attachListeners(audio: HTMLAudioElement) {
    if (this.listenersAttached) return;
    audio.addEventListener('play', this.handlePlay);
    audio.addEventListener('pause', this.handlePause);
    audio.addEventListener('seeked', this.handleSeeked);
    audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.listenersAttached = true;
  }

  private detachListeners(audio: HTMLAudioElement) {
    if (!this.listenersAttached) return;
    audio.removeEventListener('play', this.handlePlay);
    audio.removeEventListener('pause', this.handlePause);
    audio.removeEventListener('seeked', this.handleSeeked);
    audio.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.listenersAttached = false;
  }

  dispose() {
    if (this.audio) {
      this.detachListeners(this.audio);
    }
  }

  now(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  getLatencyOffsetMs(): number {
    return this.latencyOffsetMs;
  }

  setLatencyOffsetMs(ms: number): void {
    this.latencyOffsetMs = Number.isFinite(ms) ? ms : 0;
  }

  private getAudioTimeMs(): number {
    if (!this.audio) return Number.NaN;
    const time = this.audio.currentTime;
    if (!Number.isFinite(time)) return Number.NaN;
    return Math.max(0, time * 1000);
  }

  private getFallbackSongTimeMs(): number {
    if (this.fallbackStartPerf === null) {
      return this.lastKnownAudioTimeMs;
    }

    if (this.isPaused) {
      return this.fallbackStartSongMs;
    }

    return this.fallbackStartSongMs + (this.now() - this.fallbackStartPerf);
  }

  getSongTimeMs(): number {
    const audioTimeMs = this.getAudioTimeMs();
    const baseTime = Number.isFinite(audioTimeMs) ? audioTimeMs : this.getFallbackSongTimeMs();
    return baseTime + this.latencyOffsetMs;
  }
}

export function createDanceClock(audio: AudioClockSource): DanceClock {
  return new DanceClock(audio);
}

