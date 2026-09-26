import { useState } from 'react';
import { ArrowLeft, LockKeyhole, RefreshCw, Trash2 } from 'lucide-react';
import { santaInesConfig } from '../config/santaInes';
import { deleteInternalSubmission, readInternalSubmissions } from '../lib/persistence';
import { getSectionSummary } from '../lib/summary';
import { parseAnswers } from '../lib/validation';
import type { DiscoverySubmissionRow } from '../types/discovery';

type ResponseFilter = 'real' | 'test' | 'all';

function formatDate(value: string | null): string {
  if (!value) {
    return 'Aún no enviado';
  }
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function SubmissionCard({
  row,
  deleting,
  onDelete,
}: {
  row: DiscoverySubmissionRow;
  deleting: boolean;
  onDelete: (row: DiscoverySubmissionRow) => void;
}) {
  const answers = parseAnswers(row.answers);
  const submittedAt = row.submitted_at ?? (row.status === 'SUBMITTED' ? row.updated_at : null);
  const completion = row.status === 'SUBMITTED'
    ? 100
    : Math.min(99, Math.round((row.current_step / santaInesConfig.sections.length) * 100));

  return (
    <article className={`submission-card${row.is_test ? ' submission-card--test' : ''}`}>
      <div className="submission-card__header">
        <div>
          {row.is_test ? <span className="test-mode-badge">MODO PRUEBA</span> : null}
          <span className="eyebrow">{row.status === 'SUBMITTED' ? 'Enviado' : 'En progreso'}</span>
        </div>
        <div className="completion-badge">{completion}%</div>
      </div>
      <div className="submission-meta">
        <span>Actualizado: {formatDate(row.updated_at)}</span>
        <span>Enviado: {formatDate(submittedAt)}</span>
      </div>
      <div className="submission-card__actions">
        <button
          className="button button--danger"
          type="button"
          onClick={() => onDelete(row)}
          disabled={deleting}
        >
          <Trash2 size={15} aria-hidden="true" />
          {deleting ? 'Eliminando…' : 'Eliminar respuesta'}
        </button>
      </div>
      {answers ? (
        <div className="response-sections">
          {santaInesConfig.sections.map((section) => (
            <details className="response-section" key={section.id} open={row.status === 'SUBMITTED'}>
              <summary>{section.label}</summary>
              <dl className="response-fields">
                {getSectionSummary(section, answers).map((summary) => (
                  <div className="response-field" key={`${summary.label}-${summary.value}`}>
                    <dt>{summary.label}</dt>
                    <dd>{summary.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ))}
        </div>
      ) : (
        <p className="internal-muted">No se pudo leer el formato de respuestas de este registro.</p>
      )}
    </article>
  );
}

function AccessGate({ onAuthorize }: { onAuthorize: (value: string) => void }) {
  const [value, setValue] = useState('');
  const configured = Boolean(import.meta.env.VITE_INTERNAL_ACCESS_KEY);

  return (
    <main className="access-page page-shell">
      <LockKeyhole size={26} strokeWidth={1.5} aria-hidden="true" />
      <span className="eyebrow">Santa Inés · Uso interno</span>
      <h1>Respuestas recibidas</h1>
      <p>Ingresa la clave interna para consultar las respuestas de descubrimiento.</p>
      {!configured ? <p className="field-error">Configura VITE_INTERNAL_ACCESS_KEY para habilitar esta vista.</p> : null}
      <form
        className="access-form"
        onSubmit={(event) => {
          event.preventDefault();
          onAuthorize(value);
        }}
      >
        <label htmlFor="internal-key">Clave interna</label>
        <input
          id="internal-key"
          className="text-field"
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="current-password"
        />
        <button className="button button--primary" type="submit" disabled={!configured}>
          Entrar
        </button>
      </form>
    </main>
  );
}

export function InternalResponses() {
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<DiscoverySubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResponseFilter>('real');

  const loadRows = async () => {
    const accessKey = import.meta.env.VITE_INTERNAL_ACCESS_KEY ?? '';
    setLoading(true);
    setError('');
    try {
      setRows(await readInternalSubmissions(accessKey));
    } catch {
      setError('No pudimos cargar las respuestas. Revisa la configuración de Supabase.');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <AccessGate
        onAuthorize={(value) => {
          if (value === import.meta.env.VITE_INTERNAL_ACCESS_KEY) {
            setAuthorized(true);
            void loadRows();
          }
        }}
      />
    );
  }

  const visibleRows = rows.filter((row) => {
    if (filter === 'all') {
      return true;
    }
    return filter === 'test' ? row.is_test : !row.is_test;
  });
  const rowsByToken = visibleRows.reduce<Map<string, DiscoverySubmissionRow[]>>((groups, row) => {
    const tokenRows = groups.get(row.token) ?? [];
    tokenRows.push(row);
    groups.set(row.token, tokenRows);
    return groups;
  }, new Map());

  const deleteSubmission = async (row: DiscoverySubmissionRow) => {
    const mode = row.is_test ? 'de prueba' : 'real';
    const confirmed = window.confirm(`¿Eliminar la respuesta ${mode} del token ${row.token}? Esta acción no se puede deshacer.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(row.id);
    setError('');
    try {
      await deleteInternalSubmission(row.id, import.meta.env.VITE_INTERNAL_ACCESS_KEY ?? '');
      setRows((currentRows) => currentRows.filter((currentRow) => currentRow.id !== row.id));
    } catch {
      setError('No pudimos eliminar la respuesta. Revisa la política de Supabase e inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="internal-page page-shell page-shell--internal">
      <header className="internal-header">
        <div>
          <span className="eyebrow">Santa Inés · Uso interno</span>
          <h1>Respuestas de descubrimiento</h1>
        </div>
        <div className="internal-header__actions">
          <button className="button button--secondary" type="button" onClick={() => setAuthorized(false)}>
            <ArrowLeft size={16} aria-hidden="true" />
            Salir
          </button>
          <button className="button button--secondary" type="button" onClick={() => void loadRows()} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      </header>
      <div className="response-filters" role="tablist" aria-label="Filtrar respuestas">
        {([
          ['all', 'Todos'],
          ['real', 'Reales'],
          ['test', 'Pruebas'],
        ] as const).map(([value, label]) => (
          <button
            className={`response-filter${filter === value ? ' response-filter--active' : ''}`}
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {loading ? <p className="internal-muted">Cargando respuestas…</p> : null}
      {!loading && visibleRows.length === 0 ? <p className="internal-muted">No hay respuestas en este filtro.</p> : null}
      <div className="submission-list">
        {Array.from(rowsByToken.entries()).map(([token, tokenRows]) => (
          <section className="token-group" key={token}>
            <header className="token-group__header">
              <span className="eyebrow">Token</span>
              <h2>{token}</h2>
            </header>
            <div className="token-group__records">
              {tokenRows.map((row) => (
                <SubmissionCard
                  key={row.id}
                  row={row}
                  deleting={deletingId === row.id}
                  onDelete={deleteSubmission}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
