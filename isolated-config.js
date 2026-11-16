/* Isolated connection candidate. Public identifiers only; no secrets. */
window.HOSSHII_ISOLATED_CONFIG = Object.freeze({
  enabled: true,
  storageNamespace: 'trial-verify',
  liffId: '2011929118-NJGUu69C',
  statusEndpoint: 'https://ssfjopzfzsuwcxwirggv.supabase.co/functions/v1/line-trial-status',
  backupEndpoint: 'https://ssfjopzfzsuwcxwirggv.supabase.co/functions/v1/hosshii-backup'
});
window.hosshiiReadOnly = true;
window.hosshiiIsolatedReady = function () {
  const c = window.HOSSHII_ISOLATED_CONFIG;
  return c.enabled === true
    && c.liffId === '2011929118-NJGUu69C'
    && c.statusEndpoint === 'https://ssfjopzfzsuwcxwirggv.supabase.co/functions/v1/line-trial-status'
    && c.backupEndpoint === 'https://ssfjopzfzsuwcxwirggv.supabase.co/functions/v1/hosshii-backup'
    && window.location.origin === 'https://shift-app2026.github.io'
    && ['/hosshii-shift-trial-verify/', '/hosshii-shift-trial-verify/index.html'].includes(window.location.pathname);
};
