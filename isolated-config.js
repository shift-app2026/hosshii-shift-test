/* Unconfigured test copy. No secrets, no production fallback. */
window.HOSSHII_ISOLATED_CONFIG = Object.freeze({
  enabled: false,
  liffId: '',
  statusEndpoint: '',
  backupEndpoint: ''
});
window.hosshiiReadOnly = true;
window.hosshiiIsolatedReady = function () {
  const c = window.HOSSHII_ISOLATED_CONFIG;
  if (c.enabled !== true || !/^2011929118-[A-Za-z0-9]+$/.test(c.liffId)
      || c.liffId === '2011929118-Fyk1pdlU') return false;
  try {
    const status = new URL(c.statusEndpoint), backup = new URL(c.backupEndpoint);
    return status.protocol === 'https:' && status.origin === backup.origin
      && /^[a-z0-9]{20}\.supabase\.co$/.test(status.hostname)
      && status.hostname !== 'urwmuafkmlgzanpiksfv.supabase.co'
      && status.pathname === '/functions/v1/line-trial-status'
      && backup.pathname === '/functions/v1/hosshii-backup'
      && !status.search && !backup.search && !status.hash && !backup.hash
      && !status.username && !status.password && !backup.username && !backup.password;
  } catch { return false; }
};
