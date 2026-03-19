import { useEffect, useRef } from "react";
import type { AudioPlayer } from "../AudioPlayer/AudioPlayer";
import Canvas from "../Common/Canvas";
import { secondsToMinutes } from "../Utils/Time";
import { useSnackbar } from "notistack";

interface Props {
    player: AudioPlayer,
    audioBuffer: AudioBuffer | undefined,
    className?: string;
    userMarkers: number[];
    setUserMarkers: React.Dispatch<React.SetStateAction<number[]>>;
}

const AudioWaveform = ({ userMarkers, setUserMarkers, player, audioBuffer, className = '' }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { enqueueSnackbar } = useSnackbar();
    const barCount = 500;
    const drag = useRef({
        isDragging: false,
        dragStartX: 0,
    });

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
        const currentSample = Math.floor(sampleRate * currentOffset);
        const duration = player.getBufferDurationInSeconds();

        for (let i = 0; i < barCount; i++) {
            const start = i * samplesPerBar;
            const end = start + samplesPerBar;
            let max = 0;
            for (let j = start; j < end; j += 100) {
                const val = Math.abs(channelData[j]);
                if (val > max) max = val;
            }
            const height = max * rect.height;

            if (userMarkers.includes(i)) {
                ctx.fillStyle = "#DE1A58";
            } else if (end > currentSample) {
                ctx.fillStyle = "#51d6ca";
            } else {
                ctx.fillStyle = "#FFA000";
            }

            ctx.fillRect(i * barWidth, rect.height - height, barWidth - 2, height);
        }

        ctx.fillStyle = "#FFF"
        ctx.font = "28px Roboto";
        ctx.fillText(secondsToMinutes(currentOffset), 10, 40);
        ctx.fillText(secondsToMinutes(duration), 1590, 40);
    }

    useEffect(() => {
        const handleKeyUp = (ev: KeyboardEvent) => {
            if (ev.code === 'Space') {
                try {
                    if (!player.isPaused()) {
                        player.stop();
                    } else {
                        player.resume();
                    }
                }
                catch {
                    enqueueSnackbar("error");
                }
            }
        };
        
        window.addEventListener('keyup', handleKeyUp);
        return () => window.removeEventListener('keyup', handleKeyUp);
    }, [player, enqueueSnackbar])

    const handleClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
        if (drag.current.isDragging) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left; // x relative to canvas;
        const barWidth = rect.width / barCount;
        const clickedIndex = Math.floor(x / barWidth);
        setUserMarkers([clickedIndex]);

        if (!audioBuffer) return;
        // Calculate at which frame we're currently at
        const channelData = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const marker = clickedIndex * samplesPerBar;

        player.setUserStartMarker(marker);
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        drag.current.isDragging = false;
        drag.current.dragStartX = e.clientX;
    }
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const dx = e.clientX - drag.current.dragStartX;
        if (Math.abs(dx) > 3) {
            drag.current.isDragging = true;
        }
    }
    
    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drag.current.isDragging) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const barWidth = rect.width / barCount;
        const dragEndX = e.clientX;
        const dragStartX = drag.current.dragStartX;

        const startXBar = dragStartX - rect.left;
        const clickedIndex1 = Math.floor(startXBar / barWidth);

        const endXBar = dragEndX - rect.left;
        const clickedIndex2 = Math.floor(endXBar / barWidth);

        if (!audioBuffer) return;
        // Calculate at which frame we're currently at
        const channelData = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const startMarker = clickedIndex1 * samplesPerBar;
        const endMarker = clickedIndex2 * samplesPerBar;

        player.setUserEndMarker(endMarker > startMarker ? endMarker : startMarker);
        player.setUserStartMarker(startMarker < endMarker ? startMarker : endMarker);
        setUserMarkers([clickedIndex1, clickedIndex2 - 1]);
    }

    return (
        <Canvas 
            canvasRef={canvasRef} 
            className={className} 
            draw={audioBuffer ? drawAudioWaveform : drawCoolSineWave} 
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        />
    );
};

export default AudioWaveform;