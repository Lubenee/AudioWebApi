export class AudioPlayer {
  private audioCtx = new AudioContext();
  private buffer?: AudioBuffer;
  private source?: AudioBufferSourceNode;

  private gainNode = this.audioCtx.createGain();
  private pannerNode = this.audioCtx.createStereoPanner();
  private compressorNode = this.audioCtx.createDynamicsCompressor();
  
  private eqNodes: BiquadFilterNode[] = [];

  constructor() {
    const frequencies = [63, 160, 400, 1000, 2500, 6250, 16000];
    
    for (let i = 0; i < 7; i++) {
        const node = this.audioCtx.createBiquadFilter();
        if (i === 0) node.type = 'lowshelf';
        else if (i === 6) node.type = 'highshelf';
        else node.type = 'peaking';
        
        node.frequency.value = frequencies[i];
        if (node.type === 'peaking') node.Q.value = 1.0;
        this.eqNodes.push(node);
    }
    
    for (let i = 0; i < 6; i++) {
        this.eqNodes[i].connect(this.eqNodes[i + 1]);
    }

    this.eqNodes[6].connect(this.compressorNode);
    this.compressorNode.connect(this.pannerNode);
    this.pannerNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  }

  private startTime: number = 0;
  private playbackOffset: number = 0;
  private paused = true;
  private loop = false;
  private detune = 0;
  private playbackRate = 1.0;

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
    src.playbackRate.value = this.playbackRate;

    src.connect(this.eqNodes[0]);
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
    const rate = Math.pow(2, this.detune / 1200) * this.playbackRate;
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

  getUserStartMarker(): number { return this.startUserMarker; }
  getUserEndMarker(): number { return this.endUserMarker; }

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

  setPlaybackRate(rate: number) {
    if (!this.paused && this.source) {
      this.playbackOffset = this.currentOffset();
      this.startTime = this.audioCtx.currentTime;
    }
    this.playbackRate = rate;
    if (this.source) {
      this.source.playbackRate.value = rate;
    }
  }
  getPlaybackRate() { return this.playbackRate; }

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

  setEq(gains: number[]) {
    for (let i = 0; i < 7; i++) {
      if (this.eqNodes[i] && gains[i] !== undefined) {
        this.eqNodes[i].gain.value = gains[i];
      }
    }
  }
  getEq(): number[] {
    return this.eqNodes.map(node => node.gain.value);
  }
}
