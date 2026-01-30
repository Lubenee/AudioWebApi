import { useEffect, useRef, useState } from "react";
import type { AudioPlayer } from "../AudioPlayer/AudioPlayer";
import Canvas from "../Common/Canvas";
import { secondsToMinutes } from "../Utils/Time";

interface Props {
    player: AudioPlayer,
    audioBuffer: AudioBuffer | undefined,
    className?: string;
}

const AudioWaveform = ({ player, audioBuffer, className = '' }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [clicked, setClicked] = useState<number[]>([]);
    const barCount = 500;

    const drawCoolSineWave = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, frameCount: number) => {
        const rect = canvas.getBoundingClientRect();
        // clear
        ctx.clearRect(0, 0, rect.width, rect.height);

        // background
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(0, 0, rect.width, rect.height);

        // waveform
        const barWidth = rect.width / barCount;

        const t = frameCount * 0.00011;
        for (let i = 0; i < barCount; i++) {
            const height = rect.height * (Math.abs(Math.sin(i * t)));
            ctx.fillStyle = "#9810fa";
            ctx.fillRect(i * barWidth, rect.height - height, barWidth - 2, height);
        }
    };

    const drawAudioWaveform = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!audioBuffer) return null;
        const rect = canvas.getBoundingClientRect();
        const barWidth = rect.width / barCount;

        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(0, 0, rect.width, rect.height);

        const channelData = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const sampleRate = player.getContext().sampleRate;
        const currentOffset = player.currentOffset();
        const kydeSym = sampleRate * currentOffset;
        const duration = player.getBufferDurationInSeconds();

        for (let i = 0; i < barCount; i++) {
            const start = i * samplesPerBar;
            const end = start + samplesPerBar;
            let max = 0;
            for (let j = start; j < end; j += 2) {
                const val = Math.abs(channelData[j]);
                if (val > max) max = val;
            }
            const height = max * rect.height;

            if (clicked.includes(i)) {
                ctx.fillStyle = "#DE1A58";
            } else if (end > kydeSym) {
                ctx.fillStyle = "#51d6ca";
            } else {
                ctx.fillStyle = "#FFA000";
            }

            ctx.fillRect(i * barWidth, rect.height - height, barWidth - 2, height);
        }

        ctx.fillStyle = "#FFF"
        ctx.font = "32px Roboto";
        ctx.fillText(secondsToMinutes(currentOffset), 10, 40);
        ctx.fillText(secondsToMinutes(duration), 1368, 40);
    }

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const handleClick = (ev: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = ev.clientX - rect.left; // x relative to canvas;
            const barWidth = rect.width / barCount;
            const clickedIndex = Math.floor(x / barWidth);
            
            // Allow a maximum of 2 elements. If 2 are present, remove the first one
            const newMarkers = clicked.slice(-1)
            newMarkers.push(clickedIndex);
            setClicked(newMarkers);

            if (!audioBuffer) return null;
            // Calculate at which frame we're currently at
            const channelData = audioBuffer.getChannelData(0);
            const samplesPerBar = Math.floor(channelData.length / barCount);
            const marker = clickedIndex * samplesPerBar;
            player.setUserStartMarker(marker);
        }

        canvas.addEventListener('click', handleClick);
        return () => canvas.removeEventListener('click', handleClick);
    }, [audioBuffer, clicked, player])

    return <Canvas canvasRef={canvasRef} className={className} draw={audioBuffer ? drawAudioWaveform : drawCoolSineWave} />;
};

export default AudioWaveform;


// const height = (Math.sin(Date.now() * 0.002 + i) * 0.5 + 0.5) * rect.height;

// sin(x) ∈ [−1,1]
// Multiply by 0.5 -> [-0.5, 0.5]
// + 0.5 -> [0, 1]
// we get a smooth map from [-1, 1] to [0, 1];