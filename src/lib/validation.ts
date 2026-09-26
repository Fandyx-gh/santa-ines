import { z } from 'zod';
import { santaInesConfig } from '../config/santaInes';
import type {
  DiscoveryAnswers,
  DiscoveryConfig,
  QuestionDefinition,
  SectionDefinition,
} from '../types/discovery';

const nullableNumber = z.number().finite().int().min(0).nullable();
const stringArrayValue = z.union([z.array(z.string()), z.string()]).transform((value) => (
  Array.isArray(value) ? value : value ? [value] : []
));

export const discoveryAnswersSchema = z.object({
  totalApartments: nullableNumber,
  apartmentDistribution: z.object({
    oneBedroom: z.number().int().min(0),
    twoBedrooms: z.number().int().min(0),
    threeBedrooms: z.number().int().min(0),
  }),
  apartmentsSimilar: z.string(),
  apartmentDifferences: z.string(),
  apartmentOccupancy: z.object({
    oneBedroom: nullableNumber,
    twoBedrooms: nullableNumber,
    threeBedrooms: nullableNumber,
  }),
  apartmentOccupancyUnknown: z.boolean().default(false),
  services: z.array(z.string()),
  servicesOther: z.string(),
  apartmentPhotos: stringArrayValue.default([]),
  guestTypes: z.array(z.string()),
  guestTypesOther: z.string().default(''),
  stayDurations: z.array(z.string()),
  receivesCompanyGuests: z.string(),
  desiredGuest: z.string(),
  rateModels: z.array(z.string()),
  monthlyUtilities: z.array(z.string()),
  monthlyUtilitiesOther: z.string().default(''),
  hasUtilityBills: z.string(),
  availabilityTracking: z.array(z.string()),
  availabilityTrackingOther: z.string().default(''),
  availabilitySoftware: z.string(),
  confirmedReservationTracking: z.array(z.string()),
  confirmedReservationTrackingOther: z.string().default(''),
  bookingInformation: z.string(),
  reservationConditions: z.array(z.string()).default([]),
  reservationConditionsOther: z.string().default(''),
  afterHours: stringArrayValue.default([]),
  afterHoursOther: z.string(),
  reservationAuthority: stringArrayValue.default([]),
  reservationAuthorityOther: z.string(),
  desiredCapabilities: z.array(z.string()),
  externalPlatforms: z.array(z.string()).default([]),
  externalPlatformsOther: z.string().default(''),
  domainPreference: stringArrayValue.default([]),
  domainOther: z.string().default(''),
  existingDomain: z.string().default(''),
  personalReview: z.string(),
  requestChannels: z.array(z.string()),
  requestEmail: z.string().default(''),
  deposit: z.string(),
  depositDetails: z.string(),
  paymentMethods: z.array(z.string()),
  paymentMethodsOther: z.string().default(''),
  digitalImprovements: z.array(z.string()),
  projectTiming: z.string().default(''),
  projectTimingDetails: z.string().default(''),
  proposalApprovers: z.string().default(''),
  finalAdditionalNotes: z.string().default(''),
});

export interface StepValidationError {
  name: string;
  message: string;
}

export interface StepValidationResult {
  valid: boolean;
  errors: StepValidationError[];
}

function answerFor(answers: DiscoveryAnswers, id: string): unknown {
  return (answers as unknown as Record<string, unknown>)[id];
}

function isFilledString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOtherOptionLabel(label: string): boolean {
  return /^(otro|otra|otros)$/i.test(label.trim());
}

export function isOtherSelected(question: QuestionDefinition, answers: DiscoveryAnswers): boolean {
  const option = question.options?.find(
    (candidate) => candidate.value === 'other' || isOtherOptionLabel(candidate.label),
  );
  if (!option) {
    return false;
  }

  const value = answerFor(answers, question.id);
  return Array.isArray(value) ? value.includes(option.value) : value === option.value;
}

function defaultMessage(question: QuestionDefinition): string {
  if (question.requiredMessage) {
    return question.requiredMessage;
  }
  if (question.type === 'multi') {
    return 'Selecciona al menos una opción para continuar.';
  }
  if (question.type === 'single') {
    return 'Selecciona una opción para continuar.';
  }
  if (question.type === 'number') {
    return 'Cuéntanos aproximadamente cuántos apartamentos tienen.';
  }
  if (question.type === 'distribution') {
    return 'Registra al menos una categoría de apartamentos.';
  }
  if (question.type === 'occupancy') {
    return 'Indica una capacidad aproximada o selecciona “No estoy segura/o”.';
  }
  return 'Completa esta respuesta para continuar.';
}

function validateQuestion(question: QuestionDefinition, answers: DiscoveryAnswers): StepValidationError[] {
  if (question.type === 'context' || question.type === 'separator') {
    return [];
  }
  if (question.condition && !question.condition(answers)) {
    return [];
  }

  const value = answerFor(answers, question.id);
  let isComplete = true;

  if (question.type === 'number') {
    isComplete = typeof value === 'number' && Number.isFinite(value) && value > 0;
  } else if (question.type === 'distribution') {
    const distribution = value as DiscoveryAnswers['apartmentDistribution'];
    const distributionTotal = Object.values(distribution).reduce((total, item) => total + item, 0);
    isComplete = Object.values(distribution).some((item) => item > 0)
      && answers.totalApartments !== null
      && distributionTotal === answers.totalApartments;
  } else if (question.type === 'occupancy') {
    const occupancy = value as DiscoveryAnswers['apartmentOccupancy'];
    isComplete = answers.apartmentOccupancyUnknown
      || Object.values(occupancy).every((item) => typeof item === 'number' && Number.isFinite(item));
  } else if (question.type === 'single' || question.type === 'text' || question.type === 'textarea') {
    isComplete = isFilledString(value);
  } else if (question.type === 'multi') {
    isComplete = Array.isArray(value) && value.length > 0;
  }

  const errors: StepValidationError[] = [];
  if (!isComplete) {
    const errorName = question.type === 'distribution' || question.type === 'occupancy'
      ? `${question.id}.oneBedroom`
      : question.id;
    const message = question.type === 'distribution' && answers.totalApartments !== null
      ? 'La suma de la distribución debe coincidir con el total de apartamentos.'
      : defaultMessage(question);
    errors.push({ name: errorName, message });
  }

  if (question.id === 'requestEmail' && isComplete && !z.string().email().safeParse(value).success) {
    errors.push({ name: question.id, message: 'Escribe un correo electrónico válido.' });
  }

  if (question.otherField && isOtherSelected(question, answers)) {
    const otherValue = answerFor(answers, question.otherField.id);
    if (!isFilledString(otherValue)) {
      errors.push({
        name: question.otherField.id,
        message: `Cuéntanos ${question.otherField.label.replace(/^¿|\?$/g, '').toLowerCase()}.`,
      });
    }
  }

  return errors;
}

export function visibleQuestions(section: SectionDefinition, answers: DiscoveryAnswers): QuestionDefinition[] {
  return section.questions.filter((question) => !question.condition || question.condition(answers));
}

export function validateStep(
  step: number,
  answers: DiscoveryAnswers,
  config: DiscoveryConfig = santaInesConfig,
): StepValidationResult {
  const section = config.sections[step];
  if (!section) {
    return { valid: true, errors: [] };
  }

  const errors = visibleQuestions(section, answers).flatMap((question) => validateQuestion(question, answers));
  return { valid: errors.length === 0, errors };
}

export function validateAll(
  answers: DiscoveryAnswers,
  config: DiscoveryConfig = santaInesConfig,
): StepValidationResult {
  const errors = config.sections.flatMap((section, index) =>
    validateStep(index, answers, config).errors.map((error) => ({
      ...error,
      name: `${index}:${error.name}`,
    })),
  );
  return { valid: errors.length === 0, errors };
}

export function parseAnswers(value: unknown): DiscoveryAnswers | null {
  const result = discoveryAnswersSchema.safeParse(value);
  return result.success ? result.data : null;
}
