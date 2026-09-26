import { describe, expect, it } from 'vitest';
import { isTestMode } from './testMode';

describe('test mode URL detection', () => {
  it('only enables test mode for testMode=true', () => {
    expect(isTestMode('?t=token&testMode=true')).toBe(true);
    expect(isTestMode('?t=token&testMode=false')).toBe(false);
    expect(isTestMode('?t=token')).toBe(false);
  });
});
