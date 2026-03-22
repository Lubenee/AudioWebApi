import { useRef } from "react";

interface RetroAudioUploadProps {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AudioUpload({ onChange }: RetroAudioUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex items-center gap-4">
            <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                onChange={onChange}
                className="sr-only"
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-48 h-16 bg-purple-600
                    text-purple-100
                    font-mono tracking-wide
                    border-4 border-purple-900
                    shadow-retro
                    transition-all
                    hover:bg-purple-500
                    active:translate-x-0.5
                    active:translate-y-0.5
                    active:shadow-none
                    cursor-pointer
                    select-none
                    flex items-center justify-center"           
            >
                LOAD AUDIO
            </button>
        </div>
    );
}
