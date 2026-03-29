import { AudioPlayer } from "./AudioPlayer/AudioPlayer";
import PrimaryButton from "./Common/PrimaryButton";
import AudioWaveform from "./AudioWaveform/AudioWaveform";
import { useRef, useState, useEffect } from "react";
import { Checkbox } from "./Common/Checkbox";
import AudioUpload from "./Common/Uploader";
import { useSnackbar } from "notistack";
import { removeFileExtension } from "./Utils/File";
import ChordDisplay, { type Chord } from "./ChordDisplay/ChordDisplay";
import EffectsPanel from "./EffectsPanel/EffectsPanel";
export default function App() {
  const { enqueueSnackbar } = useSnackbar();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
  const playerRef = useRef<AudioPlayer>(new AudioPlayer());
  const [chords, setChords] = useState<Chord[] | null>(null);
  const [isAnalyzingChords, setIsAnalyzingChords] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [showEffects, setShowEffects] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const [loop, setLoop] = useState(false);
  const [detune, setDetune] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [filename, setFilename] = useState<string>("");
  const [zoom, setZoom] = useState(1);

  async function loadFile(file: File) {
    const buff = await playerRef.current.loadFile(file);
    setAudioBuffer(buff);
    setFilename(removeFileExtension(file.name));

    setChords(null);
    setIsAnalyzingChords(true);
    if (!workerRef.current) {
        workerRef.current = new Worker(new URL('./Utils/ChordWorker.ts', import.meta.url), { type: 'module' });
    }
    workerRef.current.onmessage = (e) => {
        setIsAnalyzingChords(false);
        if (e.data.success) {
            setChords(e.data.chords);
        } else {
            console.error("Chord analysis failed", e.data.error);
        }
    };
    workerRef.current.postMessage({
        channelData: buff.getChannelData(0),
        sampleRate: buff.sampleRate
    });
  }
  
  function playFile() {
    try {
      playerRef.current.start();
    }
    catch {
      enqueueSnackbar("No file is loaded.", { variant:'error' });
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await loadFile(file);
  };

  const resetMarkers = () => {
    playerRef.current.setUserStartMarker(0);
    playerRef.current.setUserEndMarker(0);
  }

  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.code === 'Space' && !(ev.target instanceof HTMLInputElement)) {
            ev.preventDefault();
        }
    };
    const handleKeyUp = (ev: KeyboardEvent) => {
        if (ev.target instanceof HTMLInputElement) return;
        switch (ev.code) {
            case 'Space':
                ev.preventDefault();
                if (playerRef.current.isPaused()) playerRef.current.resume();
                else playerRef.current.stop();
                break;
            case 'KeyL': setLoop(p => { playerRef.current.setLoop(!p); return !p; }); break;
            case 'KeyE': setShowEffects(p => !p); break;
            case 'KeyC': setShowChords(p => !p); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="bg-indigo-900 p-4 space-y-4 text-fuchsia-400">
      <div className="flex flex-row justify-between items-center p-2 gap-4 h-24 bg-amber-700 shadow-amber-800 shadow-retro">
        <div>
          <AudioUpload onChange={handleFileChange} />
        </div>

        <div className="flex flex-row justify-center items-center gap-3">
          <PrimaryButton onClick={playFile}>Play</PrimaryButton>
          <PrimaryButton onClick={() => playerRef.current.stop()}>Stop</PrimaryButton>
          <PrimaryButton onClick={() => playerRef.current.resume()}>Resume</PrimaryButton>
        </div>

        <div className="flex flex-row items-center gap-6 bg-amber-900/30 px-5 py-3 rounded-xl border-2 border-amber-900/50 shadow-inner">
          <Checkbox label="Enable loop" checked={loop} onChange={(checked) => {
            playerRef.current.setLoop(checked);
            setLoop(checked);
          }} />
          <Checkbox label="Show chords" checked={showChords} onChange={setShowChords} />
          <Checkbox label="Show rack" checked={showEffects} onChange={setShowEffects} />
        </div>
      </div>

      <AudioWaveform
        player={playerRef.current}
        audioBuffer={audioBuffer}
        className="w-full h-[65vh]"
        filename={filename}
        zoom={zoom}
      />

      {showChords && isAnalyzingChords && (
        <div className="flex justify-center items-center py-4 bg-indigo-950 rounded-lg border-2 border-indigo-700 text-teal-400 font-bold tracking-widest animate-pulse h-48">
          ANALYZING CHORDS...
        </div>
      )}

      {showChords && chords && <ChordDisplay player={playerRef.current!} chords={chords} />}

      {showEffects && <EffectsPanel player={playerRef.current!} />}


      {
        filename &&
        <div className="flex flex-row justify-center items-center p-2 gap-4 h-24 bg-teal-700 shadow-teal-800 shadow-retro">
          <div className="flex flex-row items-center gap-8 w-full justify-center">
            <div className="flex items-center gap-3">
              <PrimaryButton className="w-20 text-xs" onClick={() => {
                const newDetune = detune - 1;
                setDetune(newDetune);
                playerRef.current.setDetuneSemitones(newDetune);
              }}>- Pitch</PrimaryButton>
              <span className="font-mono text-teal-100 font-bold w-6 text-center">{detune > 0 ? `+${detune}` : detune}</span>
              <PrimaryButton className="w-20 text-xs" onClick={() => {
                const newDetune = detune + 1;
                setDetune(newDetune);
                playerRef.current.setDetuneSemitones(newDetune);
              }}>+ Pitch</PrimaryButton>
            </div>

            <div className="flex items-center gap-3">
              <PrimaryButton className="w-20 text-xs" onClick={() => {
                const newSpeed = Math.max(0.2, speed - 0.01);
                setSpeed(newSpeed);
                playerRef.current.setPlaybackRate(newSpeed);
              }}>- Speed</PrimaryButton>
              
              <div className="flex flex-col items-center justify-center gap-2 w-24">
                <span className="font-mono text-teal-100 font-bold text-center text-sm">{Math.round(speed * 100)}%</span>
                <input 
                  type="range" 
                  min={0.2} 
                  max={2.0} 
                  step={0.01} 
                  value={speed} 
                  onChange={(e) => {
                    const newSpeed = parseFloat(e.target.value);
                    setSpeed(newSpeed);
                    playerRef.current.setPlaybackRate(newSpeed);
                  }} 
                  className="w-full h-1.5 bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-fuchsia-400" 
                />
              </div>

              <PrimaryButton className="w-20 text-xs" onClick={() => {
                const newSpeed = Math.min(2.0, speed + 0.01);
                setSpeed(newSpeed);
                playerRef.current.setPlaybackRate(newSpeed);
              }}>+ Speed</PrimaryButton>
            </div>

            <div className="flex items-center gap-3">
              <PrimaryButton className="w-20 text-xs" onClick={() => setZoom(z => Math.max(1, z - .5))}>- Zoom</PrimaryButton>
              <span className="font-mono text-teal-100 font-bold w-8 text-center">{zoom}x</span>
              <PrimaryButton className="w-20 text-xs" onClick={() => setZoom(z => Math.min(20, z + .5))}>+ Zoom</PrimaryButton>
            </div>

            <div className="w-4"></div>
            <PrimaryButton className="w-28 text-xs" onClick={resetMarkers}>Reset Loop</PrimaryButton>
          </div>
        </div>
      }

    </div>
  );
}
