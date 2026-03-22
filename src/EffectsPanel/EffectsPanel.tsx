import React, { useState, useEffect } from "react";
import type { AudioPlayer } from "../AudioPlayer/AudioPlayer";
import { Slider } from "../Common/Slider";

interface Props {
    player: AudioPlayer;
}

const EffectsPanel: React.FC<Props> = ({ player }) => {
    const [volume, setVolume] = useState(player.getVolume());
    const [pan, setPan] = useState(player.getPan());
    const [compressor, setCompressor] = useState(player.getCompressor());
    const [eq, setEq] = useState(player.getEq());

    useEffect(() => {
        player.setVolume(volume);
    }, [volume, player]);

    useEffect(() => {
        player.setPan(pan);
    }, [pan, player]);

    useEffect(() => {
        player.setCompressor(compressor.threshold, compressor.ratio);
    }, [compressor, player]);

    useEffect(() => {
        player.setEq(eq.low, eq.mid, eq.high);
    }, [eq, player]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-indigo-950 rounded-lg border-2 border-indigo-700 shadow-panel w-full duration-300 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-fuchsia-400 font-bold uppercase tracking-widest text-sm text-center">Audio Processing Rack</h2>

            <div className="flex flex-wrap gap-6 justify-center">
                {/* General Controls */}
                <div className="flex flex-col gap-4 p-4 bg-looper-bg rounded-md border border-indigo-900 flex-1 min-w-[200px]">
                    <h3 className="text-teal-400 text-xs font-bold uppercase mb-2 text-center border-b border-indigo-800 pb-2">Master</h3>
                    <Slider label="Volume" value={volume} min={0} max={2} step={0.01} onChange={setVolume} />
                    <Slider label="Pan (L/R)" value={pan} min={-1} max={1} step={0.01} onChange={setPan} />
                </div>

                {/* Compressor */}
                <div className="flex flex-col gap-4 p-4 bg-looper-bg rounded-md border border-indigo-900 flex-1 min-w-[200px]">
                    <h3 className="text-teal-400 text-xs font-bold uppercase mb-2 text-center border-b border-indigo-800 pb-2">Dynamics Compressor</h3>
                    <Slider 
                        label="Threshold (dB)" 
                        value={compressor.threshold} 
                        min={-100} max={0} step={1} 
                        onChange={(val: number) => setCompressor({ ...compressor, threshold: val })} 
                    />
                    <Slider 
                        label="Ratio" 
                        value={compressor.ratio} 
                        min={1} max={20} step={0.5} 
                        onChange={(val: number) => setCompressor({ ...compressor, ratio: val })} 
                    />
                </div>

                {/* EQ */}
                <div className="flex flex-col gap-4 p-4 bg-looper-bg rounded-md border border-indigo-900 flex-1 min-w-[250px]">
                    <h3 className="text-teal-400 text-xs font-bold uppercase mb-2 text-center border-b border-indigo-800 pb-2">3-Band EQ</h3>
                    <Slider 
                        label="Low (dB)" 
                        value={eq.low} 
                        min={-40} max={40} step={1} 
                        onChange={(val: number) => setEq({ ...eq, low: val })} 
                    />
                    <Slider 
                        label="Mid (dB)" 
                        value={eq.mid} 
                        min={-40} max={40} step={1} 
                        onChange={(val: number) => setEq({ ...eq, mid: val })} 
                    />
                    <Slider 
                        label="High (dB)" 
                        value={eq.high} 
                        min={-40} max={40} step={1} 
                        onChange={(val: number) => setEq({ ...eq, high: val })} 
                    />
                </div>
            </div>
        </div>
    );
};

export default EffectsPanel;
