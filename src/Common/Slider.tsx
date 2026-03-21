export const Slider = ({ label, value, min, max, step, onChange }: any) => (
    <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
        <div className="flex justify-between text-xs text-indigo-300 font-bold uppercase tracking-wider">
            <span>{label}</span>
            <span className="text-teal-400">{value}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))} 
            className="w-full accent-fuchsia-400 cursor-pointer h-2 bg-indigo-900 rounded-lg appearance-none"
        />
    </div>
);
