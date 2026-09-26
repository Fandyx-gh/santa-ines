export function isTestMode(search: string): boolean {
  return new URLSearchParams(search).get('testMode') === 'true';
}
