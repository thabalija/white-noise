import { AmbientBackground } from "./components/AmbientBackground";
import { PlayButton } from "./components/PlayButton";
import { SleepTimer } from "./components/SleepTimer";
import { SoundPicker } from "./components/SoundPicker";
import { VolumeSlider } from "./components/VolumeSlider";
import { COPY } from "./copy";
import { usePlayer } from "./player/usePlayer";
import { getSoundById } from "./sounds";

function App() {
  const player = usePlayer();
  const sound = getSoundById(player.soundId);

  return (
    <div className="relative mx-auto flex min-h-full max-w-md flex-col px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <AmbientBackground soundId={player.soundId} />

      <header className="pt-4 text-center">
        <p className="text-xs tracking-[0.28em] text-(--color-text-muted) uppercase">
          {COPY.nowPlaying}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-end pb-6">
        <h1 className="text-center text-[1.75rem] leading-tight text-(--color-text)">
          {sound.label}
        </h1>
        <p className="mt-2 text-xs tracking-[0.22em] text-(--color-text-muted) uppercase">
          {COPY.appTitle}
        </p>
        <div className="mt-4 w-full">
          <PlayButton
            playing={player.playing}
            onToggle={() => void player.toggle()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SoundPicker
          soundId={player.soundId}
          onSelect={(id) => void player.setSound(id)}
        />
        <VolumeSlider volume={player.volume} onChange={player.setVolume} />
        <SleepTimer
          timerMinutes={player.timerMinutes}
          remainingMs={player.remainingMs}
          onSelect={player.setTimer}
        />
      </div>
    </div>
  );
}

export default App;
