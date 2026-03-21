import { detectChords } from 'chord-recognition';

self.onmessage = (e: MessageEvent) => {
  const { channelData, sampleRate } = e.data;
  try {
    const chords = detectChords(channelData as any, sampleRate, sampleRate);
    self.postMessage({ success: true, chords });
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message });
  }
};
