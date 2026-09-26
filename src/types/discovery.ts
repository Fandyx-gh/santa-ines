import type { LucideIcon } from 'lucide-react';

export type DiscoveryStatus = 'IN_PROGRESS' | 'SUBMITTED';

export interface ApartmentDistribution {
  oneBedroom: number;
  twoBedrooms: number;
  threeBedrooms: number;
}

export interface ApartmentOccupancy {
  oneBedroom: number | null;
  twoBedrooms: number | null;
  threeBedrooms: number | null;
}

export interface DiscoveryAnswers {
  totalApartments: number | null;
  apartmentDistribution: ApartmentDistribution;
  apartmentsSimilar: string;
  apartmentDifferences: string;
  apartmentOccupancy: ApartmentOccupancy;
  apartmentOccupancyUnknown: boolean;
  services: string[];
  servicesOther: string;
  apartmentPhotos: string;
  guestTypes: string[];
  guestTypesOther: string;
  stayDurations: string[];
  receivesCompanyGuests: string;
  desiredGuest: string;
  rateModels: string[];
  monthlyUtilities: string[];
  monthlyUtilitiesOther: string;
  hasUtilityBills: string;
  availabilityTracking: string[];
  availabilityTrackingOther: string;
  availabilitySoftware: string;
  confirmedReservationTracking: string[];
  confirmedReservationTrackingOther: string;
  bookingInformation: string;
  afterHours: string;
  afterHoursOther: string;
  reservationAuthority: string;
  reservationAuthorityOther: string;
  reservationConditions: string[];
  reservationConditionsOther: string;
  desiredCapabilities: string[];
  externalPlatforms: string[];
  externalPlatformsOther: string;
  domainPreference: string;
  domainOther: string;
  existingDomain: string;
  personalReview: string;
  requestChannels: string[];
  requestEmail: string;
  deposit: string;
  depositDetails: string;
  paymentMethods: string[];
  paymentMethodsOther: string;
  digitalImprovements: string[];
  projectTiming: string;
  projectTimingDetails: string;
  proposalApprovers: string;
  finalAdditionalNotes: string;
}

export type QuestionType =
  | 'number'
  | 'distribution'
  | 'occupancy'
  | 'single'
  | 'multi'
  | 'text'
  | 'textarea'
  | 'context'
  | 'separator';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

export type OtherAnswerKey =
  | 'servicesOther'
  | 'guestTypesOther'
  | 'monthlyUtilitiesOther'
  | 'availabilityTrackingOther'
  | 'confirmedReservationTrackingOther'
  | 'afterHoursOther'
  | 'reservationAuthorityOther'
  | 'reservationConditionsOther'
  | 'externalPlatformsOther'
  | 'paymentMethodsOther'
  | 'domainOther';

export interface OtherFieldDefinition {
  id: OtherAnswerKey;
  label: string;
  placeholder?: string;
}

export interface QuestionDefinition {
  id: string;
  type: QuestionType;
  label?: string;
  helper?: string;
  placeholder?: string;
  inputType?: 'text' | 'email';
  content?: string;
  options?: readonly QuestionOption[];
  otherField?: OtherFieldDefinition;
  summaryLabel?: string;
  requiredMessage?: string;
  required?: boolean;
  large?: boolean;
  secondary?: boolean;
  rows?: number;
  condition?: (answers: DiscoveryAnswers) => boolean;
}

export interface SectionDefinition {
  id: string;
  label: string;
  title: string;
  description?: string;
  questions: readonly QuestionDefinition[];
}

export interface DiscoveryConfig {
  clientSlug: string;
  clientName: string;
  logoPath: string;
  facadePath: string;
  sections: readonly SectionDefinition[];
}

export interface PersistedState {
  token: string;
  isTest: boolean;
  currentStep: number;
  answers: DiscoveryAnswers;
  status: DiscoveryStatus;
  updatedAt: string;
  submittedAt?: string | null;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface DiscoverySubmissionRow {
  [key: string]: unknown;
  id: string;
  token: string;
  is_test: boolean;
  client_slug: string;
  current_step: number;
  answers: JsonValue;
  status: DiscoveryStatus;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface DiscoverySubmissionInsert {
  [key: string]: unknown;
  token: string;
  is_test: boolean;
  client_slug: string;
  current_step: number;
  answers: JsonValue;
  status: DiscoveryStatus;
  updated_at: string;
  submitted_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      discovery_submissions: {
        Row: DiscoverySubmissionRow;
        Insert: DiscoverySubmissionInsert;
        Update: Partial<DiscoverySubmissionInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
