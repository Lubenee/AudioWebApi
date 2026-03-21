export class AudioPlayer {
  private audioCtx = new AudioContext();
  private buffer?: AudioBuffer;
  private source?: AudioBufferSourceNode;

  private gainNode = this.audioCtx.createGain();
  private pannerNode = this.audioCtx.createStereoPanner();
  private compressorNode = this.audioCtx.createDynamicsCompressor();
  
  private lowEqNode = this.audioCtx.createBiquadFilter();
  private midEqNode = this.audioCtx.createBiquadFilter();
  private highEqNode = this.audioCtx.createBiquadFilter();

  constructor() {
    this.lowEqNode.type = 'lowshelf';
    this.lowEqNode.frequency.value = 320;

    this.midEqNode.type = 'peaking';
    this.midEqNode.frequency.value = 1000;
    this.midEqNode.Q.value = 0.5;

    this.highEqNode.type = 'highshelf';
    this.highEqNode.frequency.value = 3200;

    this.lowEqNode.connect(this.midEqNode);
    this.midEqNode.connect(this.highEqNode);
    this.highEqNode.connect(this.compressorNode);
    this.compressorNode.connect(this.pannerNode);
    this.pannerNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  }

  private startTime: number = 0;
  private playbackOffset: number = 0;
  private paused = true;
  private loop = false;
  private detune = 0;

  private startUserMarker: number = 0;
  private endUserMarker: number = 0;

  private createSource(offset: number) {
    if (!this.buffer) throw new Error("No buffer loaded");

    const src = this.audioCtx.createBufferSource();
    src.buffer = this.buffer;

    src.loop = this.loop;
    src.loopStart = this.startUserMarker;
    src.loopEnd = this.endUserMarker || this.buffer.duration;
    src.detune.value = this.detune;

    src.connect(this.lowEqNode);
    src.start(this.audioCtx.currentTime, offset);

    this.source = src;
    this.startTime = this.audioCtx.currentTime;
    this.playbackOffset = offset;
    this.paused = false;
  }

  currentOffset(): number {
    if (this.paused || !this.source) {
      return this.playbackOffset;
    }

    const now = this.audioCtx.currentTime;
    const realElapsed = now - this.startTime;
    const rate = Math.pow(2, this.detune / 1200);
    const audioElapsed = realElapsed * rate;

    const loopStart = this.source.loopStart;
    const loopEnd = this.source.loopEnd;
    const loopDuration = loopEnd - loopStart;

    const absolute = this.playbackOffset + audioElapsed;

    if (!this.loop || loopDuration <= 0) {
      return Math.min(absolute, this.getBufferDurationInSeconds());
    }

    if (absolute < loopEnd) {
      return absolute;
    }

    return loopStart + ((absolute - loopStart) % loopDuration);
  }

  start() {
    this.stop();
    this.createSource(this.startUserMarker);
  }

  resume() {
    if (!this.paused) return;
    this.createSource(this.playbackOffset);
  }

  stop() {
    if (!this.source || this.paused) return;

    this.playbackOffset = this.currentOffset();
    this.source.stop();
    this.source.disconnect();
    this.source = undefined;
    this.paused = true;
  }

  getBufferDurationInSeconds(): number {
    return this.buffer?.duration ?? 0;
  }

  setUserStartMarker(marker: number) {
    this.startUserMarker = marker / this.audioCtx.sampleRate;
    if (marker !== 0 && !this.paused) {
      this.start();
    }
  }

  setUserEndMarker(marker: number) {
    this.endUserMarker = marker / this.audioCtx.sampleRate;
    if (this.source) {
      this.source.loopEnd = this.endUserMarker || this.buffer?.duration || 0;
    }
  }

  async loadFile(file: File): Promise<AudioBuffer> {
    this.stop(); 
    this.playbackOffset = 0; 
    this.startTime = 0; 
    this.startUserMarker = 0;
    this.endUserMarker = 0;
    
    const arrBuffer = await file.arrayBuffer();
    // In case the context is suspended, we need to resume it on first user interaction
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    this.buffer = await this.audioCtx.decodeAudioData(arrBuffer);
    return this.buffer;
  }

  isPaused() { return this.paused; }
  
  setLoop(value: boolean) { 
    this.loop = value; 
    if (this.source) this.source.loop = value;
  }
  
  getLoop() { return this.loop; }
  getContext() { return this.audioCtx; }
  getAudioBuffer() { return this.buffer; }
  
  setDetuneSemitones(detune: number) {
    if (!this.paused && this.source) {
      this.playbackOffset = this.currentOffset();
      this.startTime = this.audioCtx.currentTime;
    }
    this.detune = 100 * detune;
    if (this.source) {
      this.source.detune.value = this.detune;
    }
  }

  setVolume(value: number) { this.gainNode.gain.value = value; }
  getVolume() { return this.gainNode.gain.value; }

  setPan(value: number) { this.pannerNode.pan.value = value; }
  getPan() { return this.pannerNode.pan.value; }

  setCompressor(threshold: number, ratio: number) {
    this.compressorNode.threshold.value = threshold;
    this.compressorNode.ratio.value = ratio;
  }
  getCompressor() { 
    return { threshold: this.compressorNode.threshold.value, ratio: this.compressorNode.ratio.value }; 
  }

  setEq(low: number, mid: number, high: number) {
    this.lowEqNode.gain.value = low;
    this.midEqNode.gain.value = mid;
    this.highEqNode.gain.value = high;
  }
  getEq() {
    return { low: this.lowEqNode.gain.value, mid: this.midEqNode.gain.value, high: this.highEqNode.gain.value };
  }
}
