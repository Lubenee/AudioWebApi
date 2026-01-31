export class AudioPlayer {
  private audioCtx = new AudioContext();
  private buffer: AudioBuffer | undefined = undefined;
  private source: AudioBufferSourceNode = this.audioCtx.createBufferSource();

  private startTime: number = 0;
  private playbackOffset: number = 0;
  private paused = true;
  private loop = false;

  private startUserMarker: number = 0;
  private endUserMarker: number = 0;

  async loadFile(file: File): Promise<AudioBuffer> {
    this.stop(); this.playbackOffset = 0; this.startTime = 0; this.startUserMarker = 0;
    const arrBuffer = await file.arrayBuffer();
    this.buffer = await this.audioCtx.decodeAudioData(arrBuffer);
    return this.buffer;
  }

  currentOffset(): number {
    if (this.paused) {
      return this.playbackOffset;
    }

    const now = this.audioCtx.currentTime;
    const elapsed = now - this.startTime;

    const loopStart = this.source.loopStart;
    const loopEnd = this.source.loopEnd;
    const loopDuration = loopEnd - loopStart;

    const absolute = this.playbackOffset + elapsed;

    if (!this.loop || loopDuration <= 0) {
      return Math.min(absolute, this.getBufferDurationInSeconds());
    }

    if (absolute < loopEnd) {
      return absolute;
    }

    return loopStart + ((absolute - loopStart) % loopDuration);
  }

  start() {
    if (!this.buffer) throw new Error("No buffer loaded.");
    this.stop();

    const now = this.audioCtx.currentTime;

    if (this.startUserMarker >= this.buffer.duration) {
      throw new Error("loopStart must be < buffer duration");
    }

    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = this.buffer;

    this.source.loop = this.loop;
    this.source.loopStart = this.startUserMarker;
    this.source.loopEnd = this.endUserMarker === 0 ? this.buffer.duration : this.endUserMarker;

    this.source.connect(this.audioCtx.destination);
    this.source.start(now, this.startUserMarker);

    this.startTime = now;
    this.playbackOffset = this.startUserMarker;
    this.paused = false;
  }

  resume() {
    if (!this.buffer) throw new Error("No buffer could be loaded.");
    if (!this.paused) return;

    this.startTime = this.audioCtx.currentTime;
    this.paused = false;
    this.source = this.audioCtx.createBufferSource();

    this.source.buffer = this.buffer;
    this.source.connect(this.audioCtx.destination);
    this.source.start(0, this.playbackOffset);
  }

  stop() {
    if (!this.source || this.paused) return;

    this.playbackOffset = this.currentOffset();
    this.source.stop();
    this.paused = true;
  }

  playWhiteNoise() {
    // 44,100 frames per second
    // duration = frames / sampleRate
    //      = 132300 / 44100 (44.1 kHz)
    //      = 3 seconds
    const arrBuffer = this.audioCtx.createBuffer(
      2,
      this.audioCtx.sampleRate * 2,
      this.audioCtx.sampleRate,
    );

    // Fill the buffer with white noise;
    // just random values between -1.0 and 1.0
    for (let channel = 0; channel < arrBuffer.numberOfChannels; channel++) {
      // This gives us the actual array that contains the data
      const nowBuffering = arrBuffer.getChannelData(channel);
      const freq = channel === 0 ? 440 : 160; // A
      for (let i = 0; i < arrBuffer.length; i++) {
        const t = i / this.audioCtx.sampleRate;
        // Math.random() is in [0; 1.0]
        // audio needs to be in [-1.0; 1.0]
        // nowBuffering[i] = Math.random() * 2 - 1; //white noise
        nowBuffering[i] = Math.sin(2 * Math.PI * freq * t); //some note
      }
    }

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    const source: AudioBufferSourceNode = this.audioCtx.createBufferSource();

    // set the buffer in the AudioBufferSourceNode
    source.buffer = arrBuffer;

    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(this.audioCtx.destination);

    // start the source playing
    source.start();
  }

  getBufferDurationInSeconds(): number {
    return this.buffer?.duration ?? 0;
  }

  /**  
   * EXPECTS THE MARKER TO BE THE CURRENT FRAME!
   */
  setUserStartMarker(marker: number) {
    // Transform current frame into seconds
    this.startUserMarker = marker / this.audioCtx.sampleRate;
    if (marker !== 0) {
      this.stop(); this.start();
    }
  }

  setUserEndMarker(marker: number) {
    this.endUserMarker = marker / this.audioCtx.sampleRate;
  }

  isPaused() { return this.paused }
  setLoop(value: boolean) { this.loop = value }
  getLoop() { return this.loop }
  getContext() { return this.audioCtx }
  getAudioBuffer() { return this.buffer }
  detuneSemitoneDown() { this.source.detune.value -= 100 }
  detuneSemitoneUp() { this.source.detune.value += 100 }
}

// az sym qkichka, da ne sym chasha i vrata
