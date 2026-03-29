import React, { useState, useEffect } from "react";
import type { AudioPlayer } from "../AudioPlayer/AudioPlayer";
import { Slider } from "../Common/Slider";
import PrimaryButton from "../Common/PrimaryButton";
import { VerticalSlider } from "../Common/VerticalSlider";

interface Props {
    player: AudioPlayer;
}

const EffectsPanel: React.FC<Props> = ({ player }) => {
    const [volume, setVolume] = useState(player.getVolume());
    const [pan, setPan] = useState(player.getPan());
    const [compressor, setCompressor] = useState(player.getCompressor());
    const [eq, setEq] = useState<number[]>(player.getEq());

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
        player.setEq(eq);
    }, [eq, player]);

    return (
        <div className="flex flex-col gap-6 p-6 bg-indigo-950 rounded-lg border-2 border-indigo-700 shadow-panel w-full duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex-1"></div>
                <h2 className="text-fuchsia-400 font-bold uppercase tracking-widest text-sm text-center flex-1">Audio Processing Rack</h2>
                <div className="flex-1 flex justify-end">
                    <PrimaryButton className="text-xs px-3 py-1" onClick={() => {
                        setVolume(1);
                        setPan(0);
                        setCompressor({threshold: -24, ratio: 12});
                        setEq([0, 0, 0, 0, 0, 0, 0]);
                    }}>Reset Rack</PrimaryButton>
                </div>
            </div>

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
                <div className="flex flex-col gap-4 p-4 bg-looper-bg rounded-md border border-indigo-900 flex-[2] min-w-[350px]">
                    <h3 className="text-teal-400 text-xs font-bold uppercase mb-2 text-center border-b border-indigo-800 pb-2">7-Band Parametric EQ</h3>
                    <div className="flex gap-2 justify-between mt-2 h-44 px-4">
                        {eq.map((val, idx) => (
                            <VerticalSlider 
                                key={idx}
                                label={['63', '160', '400', '1k', '2.5k', '6.2k', '16k'][idx]} 
                                value={val} 
                                min={-40} max={40} step={1} 
                                onChange={(newVal: number) => {
                                    const newEq = [...eq];
                                    newEq[idx] = newVal;
                                    setEq(newEq);
                                }} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EffectsPanel;
