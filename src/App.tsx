import { AudioPlayer } from "./AudioPlayer/AudioPlayer";
import PrimaryButton from "./Common/PrimaryButton";
import AudioWaveform from "./AudioWaveform/AudioWaveform";
import { useRef, useState } from "react";
import { Checkbox } from "./Common/Checkbox";
import AudioUpload from "./Common/Uploader";
import { useSnackbar } from "notistack";
import { removeFileExtension } from "./Utils/File";

export default function App() {
  const { enqueueSnackbar } = useSnackbar();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
  const [userMarkers, setUserMarkers] = useState<number[]>([]);
  const playerRef = useRef<AudioPlayer>(new AudioPlayer());
  const [loop, setLoop] = useState(false);
  const [detune, setDetune] = useState(0);
  const [filename, setFilename] = useState<string>("");
  const [zoom, setZoom] = useState(1);

  async function loadFile(file: File) {
    const buff = await playerRef.current.loadFile(file);
    setAudioBuffer(buff);
    setFilename(removeFileExtension(file.name));
    setUserMarkers([]);
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

        <div>
          <Checkbox label="Enable loop" checked={loop} onChange={(checked) => {
            playerRef.current.setLoop(checked);
            setLoop(checked);
          }} />
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
