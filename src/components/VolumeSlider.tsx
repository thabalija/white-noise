import { COPY } from "../copy";

type VolumeSliderProps = {
  volume: number;
  onChange: (volume: number) => void;
};

VolumeSlider.displayName = "VolumeSlider";

function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="volume-slider"
        className="text-sm font-medium text-(--color-text-muted)"
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
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-(--color-surface) accent-(--color-accent-active)"
      />
    </div>
  );
}

export { VolumeSlider };
