import React, { useEffect, useState } from "react";
import type { AudioPlayer } from "../AudioPlayer/AudioPlayer";

export type Chord = {
    rootNote: string;
    quality: number;
    interval: number;
};

interface Props {
    player: AudioPlayer;
    chords: Chord[];
}

function formatChord(chord?: Chord): string {
    if (!chord) return "-";
    let suffix = "";
    switch (chord.quality) {
        case 0: // Minor
            suffix = chord.interval === 7 ? "m7" : "m";
            break;
        case 1: // Major
            suffix = chord.interval === 7 ? "maj7" : "";
            break;
        case 2: // Suspended
            suffix = chord.interval === 2 ? "sus2" : "sus4";
            break;
        case 3: // Dominant
            suffix = "7";
            break;
        case 4: // Dimished5th
            suffix = "dim";
            break;
        case 5: // Augmented5th
            suffix = "aug";
            break;
    }
    // Replace verbose slash notations if preferred, or keep them as is.
    // e.g., "C#/Db" -> "C#" for aesthetic brevity
    return chord.rootNote.split("/")[0] + suffix;
}

const ChordDisplay: React.FC<Props> = ({ player, chords }) => {
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        let animationFrameId: number;

        const updateTime = () => {
            const currentOffset = player.currentOffset();
            setCurrentTime(currentOffset);
            animationFrameId = requestAnimationFrame(updateTime);
        };

        animationFrameId = requestAnimationFrame(updateTime);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [player]);

    if (!chords || chords.length === 0) return null;

    const currentSecond = Math.floor(currentTime);
    const previousChord = chords[Math.max(0, currentSecond - 1)];
    const currentChord = chords[Math.min(chords.length - 1, currentSecond)];
    const nextChord = chords[Math.min(chords.length - 1, currentSecond + 1)];

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-indigo-950 rounded-lg border-2 border-indigo-700 shadow-xl w-full h-48">
            <h2 className="text-teal-400 font-bold mb-4 uppercase tracking-widest text-sm">Detected Chords</h2>
            <div className="flex flex-row items-center gap-8 md:gap-16">
                <div className="flex flex-col items-center opacity-50 transition-all duration-300">
                    <span className="text-xs text-indigo-300 mb-1 uppercase tracking-wider">Previous</span>
                    <span className="text-2xl md:text-3xl font-mono text-fuchsia-300 drop-shadow-md">
                        {currentSecond > 0 ? formatChord(previousChord) : "-"}
                    </span>
                </div>
                
                <div className="flex flex-col items-center transform scale-125 transition-all duration-300">
                    <span className="text-xs text-teal-300 mb-1 uppercase tracking-wider font-bold">Current</span>
                    <span className="text-4xl md:text-6xl font-bold font-mono text-white drop-shadow-[0_0_15px_rgba(45,212,191,0.8)]">
                        {formatChord(currentChord)}
                    </span>
                </div>

                <div className="flex flex-col items-center opacity-50 transition-all duration-300">
                    <span className="text-xs text-indigo-300 mb-1 uppercase tracking-wider">Next</span>
                    <span className="text-2xl md:text-3xl font-mono text-fuchsia-300 drop-shadow-md">
                        {currentSecond < chords.length - 1 ? formatChord(nextChord) : "-"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChordDisplay;
