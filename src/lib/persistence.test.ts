import { describe, expect, it } from 'vitest';
import { initialAnswers } from '../config/santaInes';
import { buildSubmissionPayload, chooseFreshestState } from './persistence';
import type { PersistedState } from '../types/discovery';

function state(updatedAt: string, status: PersistedState['status'] = 'IN_PROGRESS'): PersistedState {
  return {
    token: 'test-token-1234567890',
    isTest: false,
    currentStep: status === 'SUBMITTED' ? 8 : 2,
    answers: initialAnswers,
    status,
    updatedAt,
    submittedAt: status === 'SUBMITTED' ? updatedAt : null,
  };
}

describe('persistence conflict handling', () => {
  it('keeps the freshest in-progress state', () => {
    expect(chooseFreshestState(state('2026-01-01T10:00:00.000Z'), state('2026-01-01T11:00:00.000Z'))?.updatedAt).toBe('2026-01-01T11:00:00.000Z');
  });

  it('keeps a submitted state over an older in-progress state', () => {
    expect(chooseFreshestState(state('2026-01-01T12:00:00.000Z'), state('2026-01-01T09:00:00.000Z', 'SUBMITTED'))?.status).toBe('SUBMITTED');
  });

  it('recovers a locally submitted state when the remote submission is still in progress', () => {
    const recovered = chooseFreshestState(
      state('2026-01-01T12:00:00.000Z', 'SUBMITTED'),
      state('2026-01-01T09:00:00.000Z'),
    );

    expect(recovered?.status).toBe('IN_PROGRESS');
    expect(recovered?.submittedAt).toBeNull();
  });

  it('marks test and real payloads independently', () => {
    const testPayload = buildSubmissionPayload('test-token-1234567890', 8, initialAnswers, 'SUBMITTED', '2026-01-01T12:00:00.000Z', true);
    const realPayload = buildSubmissionPayload('test-token-1234567890', 8, initialAnswers, 'SUBMITTED', '2026-01-01T12:00:00.000Z', false);

    expect(testPayload.is_test).toBe(true);
    expect(realPayload.is_test).toBe(false);
  });
});
