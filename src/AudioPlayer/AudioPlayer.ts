/**
 * ================================
 * WEB AUDIO API – MENTAL MODEL
 * ================================
 *
 * Web Audio works like a signal graph:
 *
 *   Audio Source → Processing Nodes → Output
 *
 * Sound always flows forward through connected nodes.
 * Nodes do NOT own each other — they are connected with virtual “cables”.
 */

/**
 * AudioContext
 * ------------
 * The audio engine / runtime.
 *
 * - Owns the audio thread, timing, and sample rate
 * - All audio nodes must be created from ONE AudioContext
 * - If the context is suspended or closed, nothing can play
 *
 * Mental model:
 *   "If the AudioContext isn't running, my app is silent."
 *
 * Typical usage:
 * - Create once for the whole app
 * - Reuse for all sounds
 * - Optionally suspend/resume for global pause
 *
 * Docs:
 * * https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
 */

/**
 * AudioBuffer
 * -----------
 * Raw decoded audio data stored in memory.
 *
 * - Contains PCM samples (like a WAV file in RAM)
 * - Does NOT play sound
 * - Has no timing or playback state
 * - Can be reused infinitely
 *
 * Mental model:
 *   "This is audio data, not a player."
 *
 * Important:
 * - Multiple AudioBufferSourceNodes can read from the same AudioBuffer
 * - Buffers are safe to cache and reuse
 *
 * Docs:
 * * https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
 */

/**
 * AudioBufferSourceNode
 * --------------------
 * One-shot playback node.
 *
 * - Reads audio data from an AudioBuffer
 * - Pushes sound into the audio graph
 * - Controls playback rate and detune (pitch)
 *
 * VERY IMPORTANT RULES:
 * - Can only be started ONCE
 * - Cannot be paused
 * - Once stopped or finished, it is dead forever
 *
 * Mental model:
 *   "This is a disposable tape deck."
 *
 * Implications:
 * - You must create a NEW source node every time you play
 * - Detune / playbackRate must be reapplied for each new source
 *
 * Docs:
 * * https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
 */

/**
 * GainNode
 * --------
 * Volume and mute control.
 *
 * - Multiplies the audio signal
 * - Used for volume sliders, fades, and muting
 *
 * Mental model:
 *   "This is the volume knob."
 *
 * Why it matters:
 * - You should NOT use source.stop() to control volume
 * - GainNode allows smooth fades and fake pause
 *
 * Common patterns:
 * - Volume control
 * - Mute / unmute
 * - Fade in / fade out
 *
 * Docs:
 * * https://developer.mozilla.org/en-US/docs/Web/API/GainNode
 */

/**
 * AudioDestinationNode
 * -------------------
 * Final audio output (the speakers).
 *
 * - Usually audioContext.destination
 * - If sound does not reach this node, it is inaudible
 *
 * Mental model:
 *   "This is the speakers."
 *
 * Docs:
 * https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
 */

/**
 * ================================
 * CUSTOM AUDIO PLAYER ARCHITECTURE
 * ================================
 *
 * Required components:
 *
 * - AudioContext               → engine
 * - AudioBuffer                → audio data
 * - AudioBufferSourceNode      → playback (one-shot)
 * - GainNode                   → volume / mute
 *
 * Typical signal flow:
 *
 *   AudioBuffer
 *       ↓
 *   AudioBufferSourceNode (playback + pitch)
 *       ↓
 *   GainNode (volume / mute)
 *       ↓
 *   AudioContext.destination (speakers)
 *
 * Playback rules summary:
 * - Play: create a new source node
 * - Stop: stop and discard the source
 * - Replay: create a new source
 * - Pause: fake with GainNode OR rebuild source with offset
 * - Detune: set on the source node every time
 */

export class AudioPlayer {
  private audioCtx = new AudioContext();
  private buffer: AudioBuffer | undefined = undefined;
  private source: AudioBufferSourceNode = this.audioCtx.createBufferSource();

  private startTime: number = 0;
  private playbackOffset: number = 0;
  private paused = true;

  private startUserMarker: number = 0;
  // private endUserMarker: number = 0;

  /**  
   * EXPECTS THE MARKER TO BE THE CURRENT FRAME!
   */
  setUserStartMarker(marker: number) {
    // Transform current frame into seconds
    this.startUserMarker = marker / this.audioCtx.sampleRate;
    this.stop(); this.start();
  }

  isPaused() {
    return this.paused;
  }

  async loadFile(file: File): Promise<AudioBuffer> {
    this.stop(); this.playbackOffset = 0; this.startTime = 0; this.startUserMarker = 0;
    const arrBuffer = await file.arrayBuffer();
    this.buffer = await this.audioCtx.decodeAudioData(arrBuffer);
    return this.buffer;
  }

  currentOffset(): number {
    if (!this.paused)
      return this.audioCtx.currentTime - this.startTime + this.playbackOffset;
    return this.playbackOffset;
  }

  getBufferDurationInSeconds(): number {
    return this.buffer?.duration ?? 0;
  }

  start() {
    if (!this.buffer) throw new Error("No buffer can be loaded.");
    this.stop();

    this.playbackOffset = this.startUserMarker;
    this.startTime = this.audioCtx.currentTime;
    this.source = this.audioCtx.createBufferSource();
    this.paused = false;

    this.source.buffer = this.buffer;
    this.source.start(0, this.startUserMarker);
    this.source.connect(this.audioCtx.destination);
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
    if (!this.source) return;
    if (this.paused) return;

    this.source.stop();
    const elapsed = this.audioCtx.currentTime - this.startTime;

    this.playbackOffset += elapsed;
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

  getContext() { return this.audioCtx }
  getAudioBuffer() { return this.buffer }

  detuneSemitoneDown() { this.source.detune.value -= 100 }
  detuneSemitoneUp() { this.source.detune.value += 100 }
}

// az sym qkichka, da ne sym chasha i vrata
