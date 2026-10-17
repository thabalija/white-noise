import { AmbientBackground } from "./components/AmbientBackground";
import { PlayButton } from "./components/PlayButton";
import { SleepTimer } from "./components/SleepTimer";
import { SoundPicker } from "./components/SoundPicker";
import { VolumeSlider } from "./components/VolumeSlider";
import { COPY } from "./copy";
import { usePlayer } from "./player/usePlayer";

function App() {
  const player = usePlayer();

  return (
    <div className="relative mx-auto flex min-h-full max-w-md flex-col px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <AmbientBackground soundId={player.soundId} />

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-(--color-text)">
          {COPY.appTitle}
        </h1>
      </header>

      <div className="mb-10 flex justify-center">
        <PlayButton
          playing={player.playing}
          onToggle={() => void player.toggle()}
        />
      </div>

      <section className="mb-8">
        <SoundPicker
          soundId={player.soundId}
          onSelect={(id) => void player.setSound(id)}
        />
      </section>

      <section className="mb-8">
        <VolumeSlider volume={player.volume} onChange={player.setVolume} />
      </section>

      <section>
        <SleepTimer
          timerMinutes={player.timerMinutes}
          remainingMs={player.remainingMs}
          onSelect={player.setTimer}
        />
      </section>
    </div>
  );
}

export default App;
