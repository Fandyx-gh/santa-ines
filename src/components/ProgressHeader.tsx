import { Logo } from './Logo';
import { SaveStatus } from './SaveStatus';
import type { SaveState } from '../types/discovery';

interface ProgressHeaderProps {
  logoPath: string;
  sectionLabel: string;
  step: number;
  totalSteps: number;
  saveState: SaveState;
  testMode?: boolean;
}

export function ProgressHeader({
  logoPath,
  sectionLabel,
  step,
  totalSteps,
  saveState,
  testMode = false,
}: ProgressHeaderProps) {
  const percentage = Math.round((step / totalSteps) * 100);

  return (
    <header className="progress-header">
      <div className="progress-header__topline">
        <Logo src={logoPath} compact />
        <span className="progress-header__status">
          {testMode ? <span className="test-mode-badge">Modo de prueba</span> : null}
          <SaveStatus state={saveState} />
        </span>
      </div>
      <div className="progress-header__meta">
        <span className="eyebrow">{sectionLabel}</span>
        <span className="step-count">{step} de {totalSteps}</span>
      </div>
      <div className="progress-track" aria-label={`Progreso: ${percentage}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
        <span className="progress-track__fill" style={{ width: `${percentage}%` }} />
      </div>
    </header>
  );
}
