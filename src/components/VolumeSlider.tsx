import { COPY } from "../copy";

type VolumeSliderProps = {
  volume: number;
  onChange: (volume: number) => void;
};

VolumeSlider.displayName = "VolumeSlider";

function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="volume-slider"
        className="text-[0.65rem] tracking-[0.18em] text-(--color-text-muted) uppercase"
      >
        {COPY.volumeLabel}
      </label>
      <input
        id="volume-slider"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(event) => onChange(Number(event.target.value))}
        className="volume-slider w-full cursor-pointer"
      />
    </div>
  );
}

export { VolumeSlider };
