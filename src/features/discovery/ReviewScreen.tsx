import { useState } from 'react';
import { Check, ChevronDown, ChevronLeft, Pencil } from 'lucide-react';
import { getSectionSummary } from '../../lib/summary';
import type { DiscoveryAnswers, DiscoveryConfig } from '../../types/discovery';

interface ReviewScreenProps {
  config: DiscoveryConfig;
  answers: DiscoveryAnswers;
  onEdit?: (sectionIndex: number) => void;
  onBack: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
}

export function ReviewScreen({
  config,
  answers,
  onEdit,
  onBack,
  onSubmit,
  readOnly = false,
}: ReviewScreenProps) {
  const [openSections, setOpenSections] = useState<number[]>(() => config.sections.map((_, index) => index));

  const toggleSection = (index: number) => {
    setOpenSections((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index]);
  };

  return (
    <main className="review-page page-shell">
      <div className="review-intro">
        <span className="eyebrow">Última mirada</span>
        <h1>{readOnly ? 'Respuestas enviadas' : 'Revisa tus respuestas'}</h1>
        <p>
          {readOnly
            ? 'Esta es la información que recibimos de Santa Inés.'
            : 'Antes de enviarlas, puedes revisar la información y volver a cualquier sección si necesitas cambiar algo.'}
        </p>
      </div>

      <div className="review-list review-list--accordion">
        {config.sections.map((section, index) => {
          const isOpen = openSections.includes(index);
          const summary = getSectionSummary(section, answers);
          const contentId = `review-section-${section.id}`;

          return (
            <section className="review-accordion" key={section.id}>
              <div className="review-accordion__header">
                <button
                  className="review-accordion__toggle"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => toggleSection(index)}
                >
                  <span className="review-row__status" aria-hidden="true"><Check size={14} /></span>
                  <span className="review-row__copy">
                    <span className="review-row__label">{section.label}</span>
                    <span className="review-row__title">{section.title}</span>
                  </span>
                  <ChevronDown className={`review-accordion__chevron${isOpen ? ' review-accordion__chevron--open' : ''}`} size={18} aria-hidden="true" />
                </button>
                {!readOnly && onEdit ? (
                  <button className="edit-button" type="button" onClick={() => onEdit(index)}>
                    <Pencil size={15} aria-hidden="true" />
                    Editar
                  </button>
                ) : null}
              </div>
              {isOpen ? (
                <dl className="review-answers" id={contentId}>
                  {summary.map((row) => (
                    <div className="review-answer" key={`${row.label}-${row.value}`}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="review-actions">
        <button className="button button--secondary" type="button" onClick={onBack}>
          <ChevronLeft size={18} aria-hidden="true" />
          Volver
        </button>
        {!readOnly && onSubmit ? (
          <button className="button button--primary" type="button" onClick={onSubmit}>
            Enviar respuestas
          </button>
        ) : null}
      </div>
    </main>
  );
}
