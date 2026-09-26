import { isOtherSelected } from './validation';
import type {
  DiscoveryAnswers,
  QuestionDefinition,
  SectionDefinition,
} from '../types/discovery';

export interface AnswerSummary {
  label: string;
  value: string;
}

function answerFor(answers: DiscoveryAnswers, id: string): unknown {
  return (answers as unknown as Record<string, unknown>)[id];
}

function optionLabel(question: QuestionDefinition, value: string): string {
  return question.options?.find((option) => option.value === value)?.label ?? value;
}

function formatValue(question: QuestionDefinition, answers: DiscoveryAnswers): string {
  const value = answerFor(answers, question.id);

  if (question.type === 'distribution' && typeof value === 'object' && value !== null) {
    const distribution = value as Record<string, unknown>;
    return [
      `1 habitación: ${String(distribution.oneBedroom ?? 0)}`,
      `2 habitaciones: ${String(distribution.twoBedrooms ?? 0)}`,
      `3 habitaciones: ${String(distribution.threeBedrooms ?? 0)}`,
    ].join(' · ');
  }

  if (question.type === 'occupancy') {
    if (answers.apartmentOccupancyUnknown) {
      return 'No estoy segura/o';
    }
    const occupancy = value as Record<string, unknown>;
    const labels = [
      ['oneBedroom', '1 habitación'],
      ['twoBedrooms', '2 habitaciones'],
      ['threeBedrooms', '3 habitaciones'],
    ] as const;
    return labels
      .filter(([type]) => answers.apartmentDistribution[type] > 0)
      .map(([type, label]) => `${label}: ${occupancy[type] ?? '—'}`)
      .join(' · ');
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map((item) => optionLabel(question, String(item))).join(' · ')
      : 'Sin respuesta';
  }

  if (typeof value === 'string' && value.trim()) {
    return optionLabel(question, value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return 'Sin respuesta';
}

export function getSectionSummary(
  section: SectionDefinition,
  answers: DiscoveryAnswers,
): AnswerSummary[] {
  return section.questions.flatMap((question) => {
    if (question.type === 'context' || question.type === 'separator') {
      return [];
    }
    if (question.condition && !question.condition(answers)) {
      return [];
    }

    const rows: AnswerSummary[] = [{
      label: question.summaryLabel ?? question.label ?? section.label,
      value: formatValue(question, answers),
    }];

    if (question.otherField && isOtherSelected(question, answers)) {
      const customValue = answerFor(answers, question.otherField.id);
      rows.push({
        label: question.otherField.label,
        value: typeof customValue === 'string' && customValue.trim() ? customValue : 'Sin respuesta',
      });
    }

    return rows;
  });
}
