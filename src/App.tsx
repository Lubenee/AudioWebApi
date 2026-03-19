import { AudioPlayer } from "./AudioPlayer/AudioPlayer";
import PrimaryButton from "./Common/PrimaryButton";
import AudioWaveform from "./AudioWaveform/AudioWaveform";
import { useRef, useState } from "react";
import { Checkbox } from "./Common/Checkbox";
import AudioUpload from "./Common/Uploader";
import { useSnackbar } from "notistack";

export default function App() {
  const { enqueueSnackbar } = useSnackbar();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
  const [userMarkers, setUserMarkers] = useState<number[]>([]);
  const playerRef = useRef<AudioPlayer>(new AudioPlayer());
  const [loop, setLoop] = useState(false);
  const [detune, setDetune] = useState(0);

  async function loadFile(file: File) {
    const buff = await playerRef.current.loadFile(file);
    setAudioBuffer(buff);
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
          <PrimaryButton onClick={() => playerRef.current.setDetuneSemitones(detune)}>Downtune</PrimaryButton>
          <PrimaryButton onClick={() => playerRef.current.setDetuneSemitones(detune)}>Uptune</PrimaryButton>
          <PrimaryButton onClick={resetMarkers}>Reset Markers</PrimaryButton>
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
        className="w-full h-[82vh]"
        userMarkers={userMarkers}
        setUserMarkers={setUserMarkers}
      />

    </div>
  );
}
