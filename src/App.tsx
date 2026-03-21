import { AudioPlayer } from "./AudioPlayer/AudioPlayer";
import PrimaryButton from "./Common/PrimaryButton";
import AudioWaveform from "./AudioWaveform/AudioWaveform";
import { useRef, useState } from "react";
import { Checkbox } from "./Common/Checkbox";
import AudioUpload from "./Common/Uploader";
import { useSnackbar } from "notistack";
import { removeFileExtension } from "./Utils/File";
import ChordDisplay, { type Chord } from "./ChordDisplay/ChordDisplay";
import EffectsPanel from "./EffectsPanel/EffectsPanel";
export default function App() {
  const { enqueueSnackbar } = useSnackbar();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
  const [userMarkers, setUserMarkers] = useState<number[]>([]);
  const playerRef = useRef<AudioPlayer>(new AudioPlayer());
  const [chords, setChords] = useState<Chord[] | null>(null);
  const [isAnalyzingChords, setIsAnalyzingChords] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [showEffects, setShowEffects] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const [loop, setLoop] = useState(false);
  const [detune, setDetune] = useState(0);
  const [filename, setFilename] = useState<string>("");
  const [zoom, setZoom] = useState(1);

  async function loadFile(file: File) {
    const buff = await playerRef.current.loadFile(file);
    setAudioBuffer(buff);
    setFilename(removeFileExtension(file.name));
    setUserMarkers([]);

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
    if (userMarkers.length) {
      setUserMarkers([]);
    }
  }

  return (
    <div className="bg-indigo-900 p-4 space-y-4 text-fuchsia-400">
      <div className="flex flex-row justify-between items-center p-2 gap-4 h-24 bg-amber-700 shadow-amber-800 shadow-[4px_4px_0_0_#4c1d95]">
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
          <Checkbox label="Show effects" checked={showEffects} onChange={setShowEffects} />
        </div>
      </div>

      <AudioWaveform
        player={playerRef.current}
        audioBuffer={audioBuffer}
        className="w-full h-[65vh]"
        userMarkers={userMarkers}
        setUserMarkers={setUserMarkers}
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
        <div className="flex flex-row justify-center items-center p-2 gap-4 h-24 bg-teal-700 shadow-teal-800 shadow-[4px_4px_0_0_#4c1d95]">
          <div className="flex flex-row items-center gap-3">
            <PrimaryButton onClick={() => {
              const newDetune = detune - 1;
              setDetune(newDetune);
              playerRef.current.setDetuneSemitones(newDetune);
            }}>Downtune</PrimaryButton>
            <PrimaryButton onClick={() => {
              const newDetune = detune + 1;
              setDetune(newDetune);
              playerRef.current.setDetuneSemitones(newDetune);
            }}>Uptune</PrimaryButton>
            <PrimaryButton onClick={() => setZoom(z => Math.max(1, z - .5))}>Zoom Out</PrimaryButton>
            <PrimaryButton onClick={() => setZoom(z => Math.min(20, z + .5))}>Zoom In</PrimaryButton>
            <PrimaryButton onClick={resetMarkers}>Reset</PrimaryButton>
          </div>
        </div>
      }

    </div>
  );
}
