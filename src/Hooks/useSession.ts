import { useEffect, useState } from "react";
import localforage from "localforage";
import { type AudioPlayer } from "../AudioPlayer/AudioPlayer";
import { type Chord } from "../ChordDisplay/ChordDisplay";

interface SessionState {
    filename: string;
    detune: number;
    speed: number;
    zoom: number;
    loop: boolean;
    showChords: boolean;
    showEffects: boolean;
    chords: Chord[] | null;
}

interface SessionSetters {
    setAudioBuffer: (b: AudioBuffer) => void;
    setFilename: (v: string) => void;
    setDetune: (v: number) => void;
    setSpeed: (v: number) => void;
    setZoom: (v: number) => void;
    setLoop: (v: boolean) => void;
    setShowChords: (v: boolean) => void;
    setShowEffects: (v: boolean) => void;
    setChords: (v: Chord[] | null) => void;
}

export function useSession(
    playerRef: React.MutableRefObject<AudioPlayer>,
    state: SessionState,
    setters: SessionSetters
) {
    const [isRestoring, setIsRestoring] = useState(true);

    // Load session on mount
    useEffect(() => {
        async function restoreSession() {
            try {
                const audioBuffer = await localforage.getItem<ArrayBuffer>("looper_audio_buffer");
                const settings = await localforage.getItem<any>("looper_settings");

                if (audioBuffer && settings) {
                    const buffer = await playerRef.current.loadArrayBuffer(audioBuffer);
                    setters.setAudioBuffer(buffer);

                    setters.setFilename(settings.filename || "");
                    setters.setDetune(settings.detune || 0);
                    setters.setSpeed(settings.speed || 1);
                    setters.setZoom(settings.zoom || 1);
                    setters.setLoop(settings.loop || false);
                    setters.setShowChords(settings.showChords ?? true);
                    setters.setShowEffects(settings.showEffects ?? false);
                    setters.setChords(settings.chords || null);

                    playerRef.current.setLoop(settings.loop || false);
                    playerRef.current.setDetuneSemitones(settings.detune || 0);
                    playerRef.current.setPlaybackRate(settings.speed || 1);

                    if (settings.volume !== undefined) playerRef.current.setVolume(settings.volume);
                    if (settings.pan !== undefined) playerRef.current.setPan(settings.pan);
                    if (settings.compressor) playerRef.current.setCompressor(settings.compressor.threshold, settings.compressor.ratio);
                    if (settings.eq) playerRef.current.setEq(settings.eq);

                    if (settings.startUserMarker !== undefined && settings.endUserMarker !== undefined) {
                        const p = playerRef.current;
                        const sr = p.getContext().sampleRate;
                        p.setUserStartMarker(settings.startUserMarker * sr);
                        p.setUserEndMarker(settings.endUserMarker * sr);
                    }
                }
            } catch (e) {
                console.error("Failed to restore session", e);
            } finally {
                setIsRestoring(false);
            }
        }
        restoreSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-save settings every second if filename exists
    useEffect(() => {
        if (!state.filename || isRestoring) return;
        const interval = setInterval(() => {
            const p = playerRef.current;
            const settingsToSave = {
                filename: state.filename,
                detune: state.detune,
                speed: state.speed,
                zoom: state.zoom,
                loop: state.loop,
                showChords: state.showChords,
                showEffects: state.showEffects,
                chords: state.chords,
                volume: p.getVolume(),
                pan: p.getPan(),
                compressor: p.getCompressor(),
                eq: p.getEq(),
                startUserMarker: p.getUserStartMarker(),
                endUserMarker: p.getUserEndMarker()
            };
            localforage.setItem("looper_settings", settingsToSave);
        }, 1000);
        return () => clearInterval(interval);
    }, [state, isRestoring, playerRef]);

    return { isRestoring };
}
