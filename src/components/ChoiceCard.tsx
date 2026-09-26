import { Check } from 'lucide-react';
import type { QuestionOption } from '../types/discovery';

interface ChoiceCardProps {
  option: QuestionOption;
  selected: boolean;
  onSelect: () => void;
  multiple?: boolean;
  large?: boolean;
}

export function ChoiceCard({ option, selected, onSelect, multiple = false, large = false }: ChoiceCardProps) {
  const Icon = option.icon;
  const classes = [
    'choice-card',
    selected ? 'choice-card--selected' : '',
    multiple ? 'choice-card--multiple' : '',
    large ? 'choice-card--large' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="choice-card__body">
        {Icon ? <Icon className="choice-card__icon" size={18} strokeWidth={1.7} aria-hidden="true" /> : null}
        <span className="choice-card__copy">
          <span className="choice-card__label">{option.label}</span>
          {option.description ? <span className="choice-card__description">{option.description}</span> : null}
        </span>
      </span>
      <span className="choice-card__check" aria-hidden="true">
        {selected ? <Check size={12} strokeWidth={2.1} /> : null}
      </span>
    </button>
  );
}
