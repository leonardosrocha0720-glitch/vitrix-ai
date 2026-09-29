"use client";

interface RatingRangeSliderProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

const ABSOLUTE_MIN = 0;
const ABSOLUTE_MAX = 5;
const STEP = 0.1;
const MIN_GAP = 0.1;

export default function RatingRangeSlider({ min, max, onChange }: RatingRangeSliderProps) {
  const percent = (value: number) =>
    ((value - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100;

  const handleMinChange = (value: number) => {
    const next = Math.min(value, max - MIN_GAP);
    onChange(Number(next.toFixed(1)), max);
  };

  const handleMaxChange = (value: number) => {
    const next = Math.max(value, min + MIN_GAP);
    onChange(min, Number(next.toFixed(1)));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
        <span>Avaliação mínima e máxima</span>
        <span className="tabular-nums text-brand">
          {min.toFixed(1)} – {max.toFixed(1)} ⭐
        </span>
      </div>
      <div className="range-slider px-2">
        <div className="range-slider-track" />
        <div
          className="range-slider-track-fill"
          style={{
            left: `${percent(min)}%`,
            width: `${percent(max) - percent(min)}%`,
          }}
        />
        <input
          type="range"
          min={ABSOLUTE_MIN}
          max={ABSOLUTE_MAX}
          step={STEP}
          value={min}
          aria-label="Avaliação mínima"
          onChange={(e) => handleMinChange(Number(e.target.value))}
        />
        <input
          type="range"
          min={ABSOLUTE_MIN}
          max={ABSOLUTE_MAX}
          step={STEP}
          value={max}
          aria-label="Avaliação máxima"
          onChange={(e) => handleMaxChange(Number(e.target.value))}
        />
      </div>
      <div className="mt-1 flex justify-between px-2 text-xs text-muted/60">
        <span>0</span>
        <span>5</span>
      </div>
    </div>
  );
}
