// Compares dotted semantic-ish version strings (with optional leading "v").
export const isVersionNewer = (remoteVersion, localVersion) => {
  const cleanRemote = String(remoteVersion || '').replace(/^v/, '');
  const cleanLocal = String(localVersion || '').replace(/^v/, '');

  const remoteParts = cleanRemote.split('.').map(Number);
  const localParts = cleanLocal.split('.').map(Number);

  for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
    const remotePart = remoteParts[i] || 0;
    const localPart = localParts[i] || 0;

    if (remotePart > localPart) return true;
    if (remotePart < localPart) return false;
  }

  return false;
};
