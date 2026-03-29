import { useEffect, useRef, useMemo } from "react";
import type { AudioPlayer } from "../AudioPlayer/AudioPlayer";
import Canvas from "../Common/Canvas";
import { secondsToMinutes } from "../Utils/Time";
import { useSnackbar } from "notistack";

interface Props {
    player: AudioPlayer,
    audioBuffer: AudioBuffer | undefined,
    className?: string;
    filename?: string;
    zoom?: number;
}

const AudioWaveform = ({ player, audioBuffer, className = '', filename = '', zoom = 1 }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { enqueueSnackbar } = useSnackbar();
    const barCount = 500 * zoom;
    const currentTimeRef = useRef<HTMLSpanElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const viewportIndRef = useRef<HTMLDivElement>(null);
    const drag = useRef({
        isDragging: false,
        dragStartX: 0,
    });

    const drawCoolSineWave = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, frameCount: number) => {
        if (currentTimeRef.current) {
            currentTimeRef.current.innerText = "00:00";
        }
        if (progressBarRef.current) {
            progressBarRef.current.style.width = "0%";
        }
        const rect = canvas.getBoundingClientRect();
        // clear
        ctx.clearRect(0, 0, rect.width, rect.height);

        // background
        const style = getComputedStyle(document.documentElement);
        ctx.fillStyle = style.getPropertyValue('--color-looper-bg-elevated').trim();
        ctx.fillRect(0, 0, rect.width, rect.height);

        // waveform
        const barWidth = rect.width / barCount;

        const t = frameCount * 0.00011;
        const primaryColor = style.getPropertyValue('--color-looper-primary').trim();
        for (let i = 0; i < barCount; i++) {
            const height = rect.height * (Math.abs(Math.sin(i * t)));
            ctx.fillStyle = primaryColor;
            ctx.fillRect(i * barWidth, rect.height - height, barWidth - 2, height);
        }
    };

    const peaks = useMemo(() => {
        if (!audioBuffer) return null;
        console.log('here')
        const channelData = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const maxes = new Array(barCount).fill(0);
        for (let i = 0; i < barCount; i++) {
            const start = i * samplesPerBar;
            const end = start + samplesPerBar;
            let max = 0;
            // Scan linearly through the bar region
            for (let j = start; j < end; j += 100) {
                const val = Math.abs(channelData[j]);
                if (val > max) max = val;
            }
            maxes[i] = max;
        }
        return maxes;
    }, [audioBuffer, zoom]);

    const drawAudioWaveform = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!audioBuffer || !peaks) return null;
        const rect = canvas.getBoundingClientRect();
        const barWidth = rect.width / barCount;

        const style = getComputedStyle(document.documentElement);
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.fillStyle = style.getPropertyValue('--color-looper-bg-elevated').trim();
        ctx.fillRect(0, 0, rect.width, rect.height);

        const sampleRate = player.getContext().sampleRate;
        const currentOffset = player.currentOffset();
        const currentSample = Math.floor(sampleRate * currentOffset);
        
        const channelDataLength = audioBuffer.length;
        const samplesPerBar = Math.floor(channelDataLength / barCount);
        
        const startMarkerSample = Math.floor(player.getUserStartMarker() * sampleRate);
        let endMarkerSample = Math.floor(player.getUserEndMarker() * sampleRate);
        if (endMarkerSample === 0) endMarkerSample = startMarkerSample;

        for (let i = 0; i < barCount; i++) {
            const start = i * samplesPerBar;
            const end = start + samplesPerBar;
            
            const height = peaks[i] * rect.height;

            const markerColor = style.getPropertyValue('--color-looper-accent-marker').trim();
            const playedColor = style.getPropertyValue('--color-looper-accent-played').trim();
            const unplayedColor = style.getPropertyValue('--color-looper-accent-unplayed').trim();

            const isStartMarker = start <= startMarkerSample && end > startMarkerSample;
            const isEndMarker = Math.abs(startMarkerSample - endMarkerSample) > samplesPerBar 
                                && start <= endMarkerSample && end > endMarkerSample;

            if ((isStartMarker || isEndMarker) && player.getUserStartMarker() > 0) {
                ctx.fillStyle = markerColor;
            } else if (end > currentSample) {
                ctx.fillStyle = playedColor;
            } else {
                ctx.fillStyle = unplayedColor;
            }

            ctx.fillRect(i * barWidth, rect.height - height, barWidth - 2, height);
        }

        if (currentTimeRef.current) {
            currentTimeRef.current.innerText = secondsToMinutes(currentOffset);
        }
        if (progressBarRef.current) {
            const duration = player.getBufferDurationInSeconds();
            if (duration > 0) {
                progressBarRef.current.style.width = `${(currentOffset / duration) * 100}%`;
            }
        }
    }

    const handleScroll = () => {
        if (!scrollContainerRef.current || !viewportIndRef.current) return;
        const { scrollLeft, scrollWidth } = scrollContainerRef.current;
        if (scrollWidth === 0) return;
        // The thumb width represents the viewport scale: 1 / zoom.
        // It starts at left: 0% and ends at left: (1 - 1/zoom) * 100%.
        // The scrollLeft is proportional to the total overflow.
        const thumbLeftPercent = (scrollLeft / scrollWidth) * 100;
        viewportIndRef.current.style.left = `${thumbLeftPercent}%`;
    };

    useEffect(() => {
        if (viewportIndRef.current) {
            viewportIndRef.current.style.width = `${(1 / Math.max(1, zoom)) * 100}%`;
            handleScroll();
        }
    }, [zoom]);

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

        if (!audioBuffer) return;
        // Calculate at which frame we're currently at
        const channelData = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const marker = clickedIndex * samplesPerBar;

        player.setUserStartMarker(marker);
        player.setUserEndMarker(marker);
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
    }

    return (
        <div className={`flex flex-col bg-looper-bg rounded-lg overflow-hidden border-2 border-indigo-900 shadow-xl ${className}`}>
            <div className="flex flex-col bg-looper-bg-elevated border-b border-indigo-800 z-10 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center px-6 py-3">
                    <div className="font-bold text-fuchsia-400 tracking-wider text-lg">
                        {filename ? filename.toUpperCase() : 'NO TRACK LOADED'}
                    </div>
                    <div className="flex gap-2 font-mono text-lg text-teal-400 items-center">
                       <span ref={currentTimeRef} className="w-16 text-right">00:00</span>
                       <span className="text-indigo-400 text-sm">/</span>
                       <span className="w-16">{audioBuffer ? secondsToMinutes(player.getBufferDurationInSeconds()) : '00:00'}</span>
                    </div>
                </div>
                <div className="w-full h-1.5 bg-looper-bg">
                    <div ref={progressBarRef} className="h-full bg-gradient-to-r from-teal-400 to-emerald-400" style={{ width: '0%' }}></div>
                </div>

                <div className="w-full h-1 bg-looper-bg-dark relative overflow-visible z-20">
                    <div 
                        ref={viewportIndRef} 
                        className="absolute top-0 h-full bg-fuchsia-400 shadow-[0_0_10px_2px_rgba(232,121,249,0.7)] rounded-full transition-[width] duration-300 pointer-events-none"
                        style={{ width: '100%', left: '0%' }}
                    ></div>
                </div>
            </div>
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden bg-looper-bg-elevated"
                onScroll={handleScroll}
            >
                <Canvas 
                    canvasRef={canvasRef} 
                    className="h-full block min-w-full origin-left"
                    style={{ width: `${zoom * 100}%` }}
                    draw={audioBuffer ? drawAudioWaveform : drawCoolSineWave} 
                    onClick={handleClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />
            </div>
        </div>
    );
};

export default AudioWaveform;