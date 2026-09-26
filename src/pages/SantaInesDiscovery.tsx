import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { DiscoveryWizard } from '../features/discovery/DiscoveryWizard';
import { santaInesConfig } from '../config/santaInes';
import {
  chooseFreshestState,
  createEmptyState,
  readLocalState,
  readRemoteState,
} from '../lib/persistence';
import { isTestMode } from '../lib/testMode';
import type { PersistedState } from '../types/discovery';

function MissingToken() {
  return (
    <main className="message-page page-shell">
      <span className="eyebrow">Santa Inés · Descubrimiento</span>
      <h1>Necesitamos un enlace personalizado</h1>
      <p>Este cuestionario se abre desde el enlace privado que te compartimos.</p>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="message-page page-shell">
      <LoaderCircle className="loading-icon" size={24} aria-label="Cargando" />
      <p>Preparando tu espacio de trabajo…</p>
    </main>
  );
}

export function SantaInesDiscovery() {
  const queryToken = new URLSearchParams(window.location.search).get('t')?.trim() ?? '';
  const token = queryToken || import.meta.env.VITE_DEFAULT_DISCOVERY_TOKEN?.trim() || '';
  const testMode = isTestMode(window.location.search);
  const [state, setState] = useState<PersistedState | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    const localState = readLocalState(token, testMode);
    const load = async () => {
      let remoteState: PersistedState | null = null;
      try {
        remoteState = await readRemoteState(token, testMode);
      } catch {
        remoteState = null;
      }

      if (active) {
        setState(chooseFreshestState(localState, remoteState) ?? createEmptyState(token, testMode));
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [testMode, token]);

  if (!token) {
    return <MissingToken />;
  }

  if (!state) {
    return <LoadingState />;
  }

  return <DiscoveryWizard config={santaInesConfig} initialState={state} testMode={testMode} />;
}
