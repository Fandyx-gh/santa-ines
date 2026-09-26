import { z } from 'zod';
import { initialAnswers } from '../config/santaInes';
import { parseAnswers } from './validation';
import { getScopedSupabaseClient } from './supabase';
import type {
  Database,
  DiscoveryAnswers,
  DiscoveryStatus,
  DiscoverySubmissionRow,
  PersistedState,
} from '../types/discovery';

const STORAGE_PREFIX = 'santa-ines-discovery:';

const persistedStateSchema = z.object({
  token: z.string().min(1),
  currentStep: z.number().int().min(0).max(8),
  isTest: z.boolean().optional().default(false),
  answers: z.unknown(),
  status: z.enum(['IN_PROGRESS', 'SUBMITTED']),
  updatedAt: z.string(),
  submittedAt: z.string().nullable().optional(),
});

function storageKeys(token: string, isTest: boolean): string[] {
  const encodedToken = encodeURIComponent(token);
  const modeKey = `${STORAGE_PREFIX}${isTest ? 'test' : 'real'}:${encodedToken}`;
  return isTest ? [modeKey] : [modeKey, `${STORAGE_PREFIX}${encodedToken}`];
}

function rowToState(row: DiscoverySubmissionRow): PersistedState | null {
  const answers = parseAnswers(row.answers);
  if (!answers) {
    return null;
  }

  return {
    token: row.token,
    isTest: row.is_test,
    currentStep: row.current_step,
    answers,
    status: row.status,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
  };
}

export function readLocalState(token: string, isTest = false): PersistedState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    for (const key of storageKeys(token, isTest)) {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed: unknown = JSON.parse(raw);
      const state = persistedStateSchema.safeParse(parsed);
      if (!state.success || state.data.isTest !== isTest) {
        continue;
      }

      const answers = parseAnswers(state.data.answers);
      if (!answers) {
        continue;
      }

      return {
        token: state.data.token,
        isTest: state.data.isTest,
        currentStep: state.data.currentStep,
        answers,
        status: state.data.status,
        updatedAt: state.data.updatedAt,
        submittedAt: state.data.submittedAt ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeLocalState(state: PersistedState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKeys(state.token, state.isTest)[0], JSON.stringify(state));
  } catch {
    // Local persistence is best effort when browser storage is unavailable.
  }
}

export function removeLocalState(token: string, isTest: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of storageKeys(token, isTest)) {
    window.localStorage.removeItem(key);
  }
}

export function chooseFreshestState(
  localState: PersistedState | null,
  remoteState: PersistedState | null,
): PersistedState | null {
  if (!localState) {
    return remoteState;
  }
  if (!remoteState) {
    return localState;
  }
  if (localState.status === 'SUBMITTED' && remoteState.status !== 'SUBMITTED') {
    return localState;
  }
  if (remoteState.status === 'SUBMITTED' && localState.status !== 'SUBMITTED') {
    return remoteState;
  }

  return new Date(localState.updatedAt).getTime() >= new Date(remoteState.updatedAt).getTime()
    ? localState
    : remoteState;
}

export async function readRemoteState(token: string, isTest = false): Promise<PersistedState | null> {
  const client = getScopedSupabaseClient({ 'x-discovery-token': token });
  if (!client) {
    return null;
  }

  const result = await client
    .from('discovery_submissions')
    .select('*')
    .eq('token', token)
    .eq('is_test', isTest)
    .maybeSingle();

  if (result.error || !result.data) {
    return null;
  }

  return rowToState(result.data);
}

export async function saveRemoteState(
  token: string,
  currentStep: number,
  answers: DiscoveryAnswers,
  status: DiscoveryStatus,
  submittedAt: string | null = null,
  isTest = false,
): Promise<void> {
  const client = getScopedSupabaseClient({ 'x-discovery-token': token });
  if (!client) {
    return;
  }

  const payload = buildSubmissionPayload(token, currentStep, answers, status, submittedAt, isTest);

  const result = await client.from('discovery_submissions').upsert(payload, { onConflict: 'token,is_test' });
  if (result.error) {
    throw result.error;
  }
}

export function buildSubmissionPayload(
  token: string,
  currentStep: number,
  answers: DiscoveryAnswers,
  status: DiscoveryStatus,
  submittedAt: string | null,
  isTest: boolean,
  updatedAt = new Date().toISOString(),
): Database['public']['Tables']['discovery_submissions']['Insert'] {
  return {
    token,
    is_test: isTest,
    client_slug: 'santa-ines',
    current_step: currentStep,
    answers: answers as unknown as import('../types/discovery').JsonValue,
    status,
    updated_at: updatedAt,
    submitted_at: submittedAt,
  };
}

export async function readInternalSubmissions(accessKey: string): Promise<DiscoverySubmissionRow[]> {
  const client = getScopedSupabaseClient({ 'x-internal-access-key': accessKey });
  if (!client) {
    return [];
  }

  const result = await client
    .from('discovery_submissions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

export function createEmptyState(token: string, isTest = false): PersistedState {
  return {
    token,
    isTest,
    currentStep: 0,
    answers: structuredClone(initialAnswers),
    status: 'IN_PROGRESS',
    updatedAt: new Date(0).toISOString(),
    submittedAt: null,
  };
}
