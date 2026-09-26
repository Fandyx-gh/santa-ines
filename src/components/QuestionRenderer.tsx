import type { ReactNode } from 'react';
import {
  Controller,
  type Control,
  type FieldErrors,
  type Path,
  type UseFormSetValue,
} from 'react-hook-form';
import { ChoiceCard } from './ChoiceCard';
import { NumberStepper } from './NumberStepper';
import { isOtherSelected } from '../lib/validation';
import type { DiscoveryAnswers, QuestionDefinition, QuestionOption } from '../types/discovery';

interface QuestionRendererProps {
  question: QuestionDefinition;
  control: Control<DiscoveryAnswers>;
  errors: FieldErrors<DiscoveryAnswers>;
  answers: DiscoveryAnswers;
  setValue: UseFormSetValue<DiscoveryAnswers>;
}

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getNumberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getErrorMessage(errors: FieldErrors<DiscoveryAnswers>, path: string): string {
  const segments = path.split('.');
  let current: unknown = errors;

  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) {
      return '';
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (typeof current !== 'object' || current === null) {
    return '';
  }
  const message = (current as Record<string, unknown>).message;
  return typeof message === 'string' ? message : '';
}

function FormQuestion({
  question,
  error,
  children,
}: {
  question: QuestionDefinition;
  error: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`form-question${question.large ? ' form-question--large' : ''}${question.secondary ? ' form-question--secondary' : ''}`}
      data-question-id={question.id}
    >
      {question.label ? <h2 className="form-question__label">{question.label}</h2> : null}
      {question.helper ? <p className="form-question__helper">{question.helper}</p> : null}
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </section>
  );
}

function ChoiceGroup({
  options,
  value,
  multiple,
  large,
  onChange,
}: {
  options: readonly QuestionOption[];
  value: string | string[];
  multiple: boolean;
  large?: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [];
  const selectedValue = multiple ? '' : typeof value === 'string' ? value : '';

  return (
    <div className={`choice-grid${large ? ' choice-grid--large' : ''}`}>
      {options.map((option) => {
        const isSelected = multiple ? selectedValues.includes(option.value) : selectedValue === option.value;
        return (
          <ChoiceCard
            key={option.value}
            option={option}
            selected={isSelected}
            multiple={multiple}
            large={large}
            onSelect={() => {
              if (!multiple) {
                onChange(option.value);
                return;
              }

              const nextValues = isSelected
                ? selectedValues.filter((valueItem) => valueItem !== option.value)
                : [...selectedValues, option.value];
              onChange(nextValues);
            }}
          />
        );
      })}
    </div>
  );
}

function DistributionFields({
  control,
  totalApartments,
}: {
  control: Control<DiscoveryAnswers>;
  totalApartments: number | null;
}) {
  const fields = [
    { name: 'apartmentDistribution.oneBedroom' as const, label: '1 habitación' },
    { name: 'apartmentDistribution.twoBedrooms' as const, label: '2 habitaciones' },
    { name: 'apartmentDistribution.threeBedrooms' as const, label: '3 habitaciones' },
  ];

  return (
    <div className="distribution-grid">
      {fields.map((fieldDefinition) => (
        <Controller
          key={fieldDefinition.name}
          name={fieldDefinition.name}
          control={control}
          render={({ field }) => (
            <NumberStepper
              label={fieldDefinition.label}
              value={getNumberValue(field.value)}
              onChange={field.onChange}
            />
          )}
        />
      ))}
      <Controller
        name="apartmentDistribution"
        control={control}
        render={({ field }) => {
          const distributionTotal = Object.values(field.value).reduce((total, item) => total + item, 0);
          const matches = totalApartments !== null && distributionTotal === totalApartments;
          const summaryClass = totalApartments === null
            ? 'distribution-summary'
            : `distribution-summary${matches ? ' distribution-summary--match' : ' distribution-summary--review'}`;
          return (
            <div className={summaryClass} role="status">
              <strong>{matches ? '✓ ' : ''}Total registrado: {totalApartments === null ? distributionTotal : `${distributionTotal} de ${totalApartments}`} apartamentos</strong>
              {!matches && totalApartments !== null ? (
                <span>La distribución no coincide con el total indicado arriba. Revísala antes de continuar.</span>
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
}

function OccupancyFields({
  control,
  setValue,
}: {
  control: Control<DiscoveryAnswers>;
  setValue: UseFormSetValue<DiscoveryAnswers>;
}) {
  const fields = [
    { name: 'apartmentOccupancy.oneBedroom' as const, label: '1 habitación' },
    { name: 'apartmentOccupancy.twoBedrooms' as const, label: '2 habitaciones' },
    { name: 'apartmentOccupancy.threeBedrooms' as const, label: '3 habitaciones' },
  ];

  return (
    <div className="occupancy-grid">
      {fields.map((fieldDefinition) => (
        <Controller
          key={fieldDefinition.name}
          name={fieldDefinition.name}
          control={control}
          render={({ field }) => (
            <NumberStepper
              label={fieldDefinition.label}
              value={getNumberValue(field.value)}
              onChange={(value) => {
                field.onChange(value);
                setValue('apartmentOccupancyUnknown', false, { shouldDirty: true });
              }}
              placeholder="—"
            />
          )}
        />
      ))}
      <Controller
        name="apartmentOccupancyUnknown"
        control={control}
        render={({ field }) => (
          <ChoiceCard
            option={{ value: 'unknown', label: 'No estoy segura/o' }}
            selected={field.value === true}
            onSelect={() => field.onChange(!field.value)}
            multiple={false}
          />
        )}
      />
    </div>
  );
}

function hasOtherSelection(question: QuestionDefinition, value: string | string[]): boolean {
  const otherOption = question.options?.find(
    (option) => option.value === 'other' || /^(otro|otra|otros)$/i.test(option.label.trim()),
  );
  if (!otherOption) {
    return false;
  }
  return Array.isArray(value) ? value.includes(otherOption.value) : value === otherOption.value;
}

function OtherTextField({
  question,
  control,
  errors,
}: {
  question: QuestionDefinition;
  control: Control<DiscoveryAnswers>;
  errors: FieldErrors<DiscoveryAnswers>;
}) {
  if (!question.otherField) {
    return null;
  }

  const error = getErrorMessage(errors, question.otherField.id);
  return (
    <div className="conditional-field">
      <Controller
        name={question.otherField.id}
        control={control}
        render={({ field }) => (
          <input
            className="text-field"
            type="text"
            value={getStringValue(field.value)}
            aria-label={question.otherField?.label}
            placeholder={question.otherField?.placeholder}
            onChange={(event) => field.onChange(event.target.value)}
          />
        )}
      />
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}

export function QuestionRenderer({ question, control, errors, answers, setValue }: QuestionRendererProps) {
  if (question.condition && !question.condition(answers)) {
    return null;
  }

  if (question.type === 'context') {
    return (
      <aside className="context-card">
        <span className="context-card__kicker">Un punto de partida</span>
        <p>{question.content}</p>
      </aside>
    );
  }

  if (question.type === 'separator') {
    return (
      <div className="visual-separator">
        <span>{question.label}</span>
      </div>
    );
  }

  const answerPath = question.id as Path<DiscoveryAnswers>;
  const errorPath = question.type === 'distribution' || question.type === 'occupancy'
    ? `${question.id}.oneBedroom`
    : question.id;
  const error = getErrorMessage(errors, errorPath);

  if (question.type === 'number') {
    return (
      <FormQuestion question={question} error={error}>
        <Controller
          name={answerPath}
          control={control}
          render={({ field }) => (
            <NumberStepper
              label="Total de apartamentos"
              value={getNumberValue(field.value)}
              onChange={field.onChange}
              placeholder={question.placeholder}
            />
          )}
        />
      </FormQuestion>
    );
  }

  if (question.type === 'distribution') {
    return (
      <FormQuestion question={question} error={error}>
        <DistributionFields control={control} totalApartments={answers.totalApartments} />
      </FormQuestion>
    );
  }

  if (question.type === 'occupancy') {
    return (
      <FormQuestion question={question} error={error}>
        <OccupancyFields control={control} setValue={setValue} />
      </FormQuestion>
    );
  }

  if (question.type === 'single' || question.type === 'multi') {
    const multiple = question.type === 'multi';
    return (
      <FormQuestion question={question} error={error}>
        <Controller
          name={answerPath}
          control={control}
          render={({ field }) => (
            <ChoiceGroup
              options={question.options ?? []}
              value={multiple ? getStringArray(field.value) : getStringValue(field.value)}
              multiple={multiple}
              large={question.large}
              onChange={(nextValue) => {
                if (question.otherField && !hasOtherSelection(question, nextValue)) {
                  setValue(question.otherField.id, '', { shouldDirty: true });
                }
                if (question.id === 'requestChannels' && Array.isArray(nextValue) && !nextValue.includes('email')) {
                  setValue('requestEmail', '', { shouldDirty: true });
                }
                field.onChange(nextValue);
              }}
            />
          )}
        />
        {question.otherField && isOtherSelected(question, answers) ? (
          <OtherTextField question={question} control={control} errors={errors} />
        ) : null}
      </FormQuestion>
    );
  }

  return (
    <FormQuestion question={question} error={error}>
      <Controller
        name={answerPath}
        control={control}
        render={({ field }) => (
          question.type === 'textarea' ? (
            <textarea
              className="text-field text-field--textarea"
              value={getStringValue(field.value)}
              aria-label={question.label}
              placeholder={question.placeholder}
              rows={question.rows ?? (question.large ? 6 : 4)}
              onChange={(event) => field.onChange(event.target.value)}
            />
          ) : (
            <input
              className="text-field"
              type={question.inputType ?? 'text'}
              value={getStringValue(field.value)}
              aria-label={question.label}
              placeholder={question.placeholder}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )
        )}
      />
    </FormQuestion>
  );
}
