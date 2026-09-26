import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  placeholder?: string;
}

export function NumberStepper({ value, onChange, label, placeholder = '0' }: NumberStepperProps) {
  const decrement = () => {
    if (value === null) {
      return;
    }
    onChange(Math.max(0, value - 1));
  };

  const increment = () => {
    onChange(Math.min(999, (value ?? 0) + 1));
  };

  return (
    <div className="number-stepper">
      <span className="number-stepper__label">
        {label}
      </span>
      <div className="number-stepper__controls">
        <button type="button" className="stepper-button" onClick={decrement} aria-label={`Disminuir ${label}`}>
          <Minus size={17} aria-hidden="true" />
        </button>
        <input
          className="stepper-input"
          type="number"
          min="0"
          max="999"
          step="1"
          inputMode="numeric"
          value={value ?? ''}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === '') {
              onChange(null);
              return;
            }

            const numericValue = Number(nextValue);
            if (Number.isFinite(numericValue)) {
              onChange(Math.max(0, Math.min(999, Math.trunc(numericValue))));
            }
          }}
        />
        <button type="button" className="stepper-button" onClick={increment} aria-label={`Aumentar ${label}`}>
          <Plus size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
