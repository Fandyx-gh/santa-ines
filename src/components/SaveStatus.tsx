import { CloudOff, LoaderCircle } from 'lucide-react';
import type { SaveState } from '../types/discovery';

interface SaveStatusProps {
  state: SaveState;
}

export function SaveStatus({ state }: SaveStatusProps) {
  if (state === 'saving') {
    return (
      <span className="save-status save-status--saving" role="status" aria-live="polite">
        <LoaderCircle size={14} aria-hidden="true" />
        Guardando…
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className="save-status save-status--error" role="status" aria-live="polite">
        <CloudOff size={14} aria-hidden="true" />
        No pudimos sincronizar por el momento. Tus respuestas siguen guardadas en este dispositivo.
      </span>
    );
  }

  if (state === 'saved') {
    return null;
  }

  return <span className="save-status" aria-hidden="true" />;
}
