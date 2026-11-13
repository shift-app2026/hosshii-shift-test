// This preparation copy refuses all requests until isolated project metadata is set.
// Never reads SUPABASE_SECRET_KEYS or any credential to decide readiness.
export function isolatedEnvironmentReady(get: (name: string) => string | undefined): boolean {
  const enabled = get('ISOLATED_TEST_MODE');
  const expected = get('ISOLATED_TEST_PROJECT_REF') || '';
  if (enabled !== 'true' || !/^[a-z0-9]{20}$/.test(expected)
      || expected === 'urwmuafkmlgzanpiksfv') return false;
  return get('SUPABASE_URL') === `https://${expected}.supabase.co`;
}
