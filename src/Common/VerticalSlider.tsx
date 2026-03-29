export const VerticalSlider = ({ label, value, min, max, step, onChange }: any) => {
    return (
        <div className="flex flex-col items-center gap-2 h-full justify-between">
            <span className="text-[10px] text-teal-400 font-bold">{value > 0 ? `+${value}` : value}</span>
            <div className="relative h-32 w-6 flex justify-center items-center">
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    step={step} 
                    value={value} 
                    onChange={(e) => onChange(parseFloat(e.target.value))} 
                    className="absolute w-32 h-2 accent-fuchsia-400 cursor-pointer bg-indigo-900 rounded-lg appearance-none origin-center -rotate-90"
                />
            </div>
            <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">{label}</span>
        </div>
    );
};
