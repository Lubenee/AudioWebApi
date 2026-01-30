import { AudioPlayer } from "./AudioPlayer/AudioPlayer";
import PrimaryButton from "./Common/PrimaryButton";
import AudioWaveform from "./AudioWaveform/AudioWaveform";
import { useState } from "react";
import { Checkbox } from "./Common/Checkbox";
import AudioUpload from "./Common/Uploader";
import { useSnackbar } from "notistack";

export default function App() {
  const player = new AudioPlayer();
  const { enqueueSnackbar } = useSnackbar();
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();

  async function loadFile(file: File) {
    const buff = await player.loadFile(file);
    setAudioBuffer(buff);
  }
  function detuneSemitoneDown() {
    player.detuneSemitoneDown();
  }
  function detuneSemitoneUp() {
    player.detuneSemitoneUp();
  }
  function playFile() {
    try {
      player.start();
    }
    catch {
      enqueueSnackbar("error");
    }
  }
  function stopPlayback() {
    player.stop();
  }
  function resumePlayback() {
    player.resume();
  }
  function whiteNoise() {
    player.playWhiteNoise();
  }
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await loadFile(file);
  };

  return (
    <div className="bg-indigo-900 p-4 space-y-4 text-fuchsia-400">
      <div className="flex flex-row justify-between items-center p-2 gap-4 h-24 bg-amber-700 shadow-amber-800 shadow-[4px_4px_0_0_#4c1d95]">
        <div>
          <AudioUpload onChange={handleFileChange} />
        </div>

        <div className="flex flex-row justify-center items-center gap-3">
          <PrimaryButton onClick={playFile}>Play</PrimaryButton>
          <PrimaryButton onClick={stopPlayback}>Stop</PrimaryButton>
          <PrimaryButton onClick={resumePlayback}>Resume</PrimaryButton>
          <PrimaryButton onClick={detuneSemitoneDown}>Downtune</PrimaryButton>
          <PrimaryButton onClick={detuneSemitoneUp}>Uptune</PrimaryButton>
          <PrimaryButton onClick={whiteNoise}>White Noise</PrimaryButton>
        </div>

        <div>
          <Checkbox label="Enable loop" />
        </div>
      </div>

      <AudioWaveform
        player={player}
        audioBuffer={audioBuffer}
        className="w-full h-[82vh]"
      />

    </div>
  );
}
