import { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Download, ExternalLink, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useGlobalState } from '../Context/GlobalContext';
import { ogbversions } from '../../config';
import { isVersionNewer } from '../../utils/versionCompare';

const UPDATE_ENTITY_ID = 'update.opengrowbox_update';

const IntegrationUpdateBanner = () => {
  const { connection, entities } = useHomeAssistant();
  const { state } = useGlobalState();
  const safeModeEnabled = state.Settings?.safeModeEnabled ?? true;

  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [fallback, setFallback] = useState(null);

  // TEMP PREVIEW SCAFFOLD - remove before shipping
  const __previewMode = new URLSearchParams(window.location.search).get('previewUpdate');
  const __previewEntities = {
    available: { attributes: {
      installed_version: '1.4.2', latest_version: '1.5.0',
      release_url: 'https://github.com/OpenGrow-Box/OpenGrowBox-HA/releases',
      release_summary: '- Added FridgeGrow 2.0 support\n- Fixed VPD calculation for dual sensors\n- New modular manager architecture\n- Performance improvements for large installs',
      in_progress: false,
    } },
    uptodate: { attributes: {
      installed_version: '1.5.0', latest_version: '1.5.0',
      release_url: 'https://github.com/OpenGrow-Box/OpenGrowBox-HA/releases',
      in_progress: false,
    } },
    installing: { attributes: {
      installed_version: '1.4.2', latest_version: '1.5.0', in_progress: true,
    } },
    restart: { attributes: {
      installed_version: '1.5.0', latest_version: '1.5.0', in_progress: false,
    } },
  };
  useEffect(() => {
    if (__previewMode === 'restart') setJustInstalled(true);
  }, [__previewMode]);
  // END TEMP PREVIEW SCAFFOLD

  const updateEntity = __previewMode ? __previewEntities[__previewMode] : entities?.[UPDATE_ENTITY_ID];

  // Fallback for backends without the update.py entity: compare the static
  // baked-in backend version against the latest GitHub release.
  useEffect(() => {
    if (updateEntity) return;

    let cancelled = false;
    const fetchLatestRelease = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/OpenGrow-Box/OpenGrowBox-HA/releases/latest');
        const data = await response.json();
        if (cancelled || !data.tag_name) return;
        setFallback({
          installedVersion: ogbversions.backend,
          latestVersion: data.tag_name,
          releaseUrl: data.html_url,
          releaseSummary: data.body,
          hasUpdate: isVersionNewer(data.tag_name, ogbversions.backend),
        });
      } catch {
        // console.error('Failed to fetch latest OpenGrowBox-HA release');
      }
    };

    fetchLatestRelease();
    return () => { cancelled = true; };
  }, [updateEntity]);

  const installedVersion = updateEntity
    ? updateEntity.attributes?.installed_version
    : fallback?.installedVersion;
  const latestVersion = updateEntity
    ? updateEntity.attributes?.latest_version
    : fallback?.latestVersion;
  const releaseUrl = updateEntity
    ? updateEntity.attributes?.release_url
    : fallback?.releaseUrl;
  const releaseSummary = updateEntity
    ? updateEntity.attributes?.release_summary
    : fallback?.releaseSummary;
  const inProgress = Boolean(updateEntity?.attributes?.in_progress);
  const hasUpdate = updateEntity
    ? Boolean(latestVersion) && latestVersion !== installedVersion
    : Boolean(fallback?.hasUpdate);

  if (!installedVersion && !latestVersion) return null;

  const handleUpdate = async () => {
    if (!connection || !updateEntity) return;
    setInstalling(true);
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'update',
        service: 'install',
        service_data: { entity_id: UPDATE_ENTITY_ID },
      });
      setJustInstalled(true);
    } catch {
      // console.error('Error installing OpenGrowBox update');
    } finally {
      setInstalling(false);
    }
  };

  const handleRestart = async () => {
    if (!connection) return;
    if (safeModeEnabled && !window.confirm(
      'Home Assistant neu starten? Dies betrifft dein gesamtes Smart Home, nicht nur diese App.'
    )) {
      return;
    }
    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'homeassistant',
        service: 'restart',
        service_data: {},
      });
    } catch {
      // console.error('Error restarting Home Assistant');
    }
  };

  const busy = installing || inProgress;

  return (
    <BannerContainer $hasUpdate={hasUpdate}>
      <Header>
        <HeaderLeft>
          <IconBox $hasUpdate={hasUpdate}>
            {hasUpdate ? <Sparkles size={22} /> : <CheckCircle2 size={22} />}
          </IconBox>
          <HeaderText>
            <Title>OpenGrowBox Integration</Title>
            <Subtitle>
              {hasUpdate ? 'Ein neues Update ist verfügbar' : 'Deine Installation ist aktuell'}
            </Subtitle>
          </HeaderText>
        </HeaderLeft>
        <StatusBadge $hasUpdate={hasUpdate}>
          {hasUpdate ? 'Update verfügbar' : 'Aktuell'}
        </StatusBadge>
      </Header>

      <VersionRow>
        <VersionChip>
          <VersionChipLabel>Installiert</VersionChipLabel>
          <VersionChipValue>{installedVersion || '–'}</VersionChipValue>
        </VersionChip>

        {hasUpdate && (
          <>
            <ArrowIcon size={16} />
            <VersionChip $highlight>
              <VersionChipLabel>Neu</VersionChipLabel>
              <VersionChipValue>{latestVersion}</VersionChipValue>
            </VersionChip>
          </>
        )}

        {releaseUrl && (
          <ChangelogLink href={releaseUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={13} /> Changelog
          </ChangelogLink>
        )}
      </VersionRow>

      {releaseSummary && hasUpdate && (
        <ReleaseNotes>
          <ReleaseNotesToggle onClick={() => setNotesExpanded(!notesExpanded)}>
            {notesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {notesExpanded ? 'Release-Notes ausblenden' : 'Was ist neu?'}
          </ReleaseNotesToggle>
          {notesExpanded && <ReleaseNotesBody>{releaseSummary}</ReleaseNotesBody>}
        </ReleaseNotes>
      )}

      {hasUpdate && updateEntity && (
        <Footer>
          <UpdateButton onClick={handleUpdate} disabled={busy}>
            {busy ? (
              <>
                <SpinIcon size={16} /> Update wird installiert…
              </>
            ) : (
              <>
                <Download size={16} /> Jetzt aktualisieren
              </>
            )}
          </UpdateButton>
        </Footer>
      )}

      {hasUpdate && !updateEntity && (
        <FallbackHint>
          Diese Backend-Version unterstützt noch keine automatischen Updates. Bitte manuell
          aktualisieren (siehe Changelog).
        </FallbackHint>
      )}

      {justInstalled && (
        <RestartHint>
          <span>Update installiert – Home Assistant neu starten, um es abzuschließen.</span>
          <RestartButton onClick={handleRestart}>
            <RefreshCw size={14} /> Jetzt neu starten
          </RestartButton>
        </RestartHint>
      )}
    </BannerContainer>
  );
};

export default IntegrationUpdateBanner;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.35); }
  50% { transform: scale(1.04); box-shadow: 0 0 0 6px rgba(249, 115, 22, 0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinIcon = styled(RefreshCw)`
  animation: ${spin} 1s linear infinite;
`;

const ArrowIcon = styled(ArrowRight)`
  color: var(--placeholder-text-color);
  flex-shrink: 0;
`;

const BannerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 25px;
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
  border: 1px solid ${props => (props.$hasUpdate ? 'rgba(249, 115, 22, 0.35)' : 'var(--glass-border)')};
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  background: ${props => (props.$hasUpdate
    ? 'linear-gradient(135deg, #f97316, #ef4444)'
    : 'linear-gradient(135deg, #4ade80, #22c55e)')};
  box-shadow: 0 4px 14px ${props => (props.$hasUpdate ? 'rgba(249, 115, 22, 0.35)' : 'rgba(34, 197, 94, 0.3)')};
  ${props => props.$hasUpdate && css`animation: ${pulse} 2.4s infinite;`}
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

const Title = styled.h4`
  margin: 0;
  color: var(--main-text-color);
  font-size: 1.1rem;
  font-weight: 600;
`;

const Subtitle = styled.span`
  color: var(--placeholder-text-color);
  font-size: 0.82rem;
`;

const StatusBadge = styled.span`
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  white-space: nowrap;
  background: ${props => (props.$hasUpdate
    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(239, 68, 68, 0.18))'
    : 'rgba(34, 197, 94, 0.12)')};
  color: ${props => (props.$hasUpdate ? '#fb923c' : '#4ade80')};
  border: 1px solid ${props => (props.$hasUpdate ? 'rgba(249, 115, 22, 0.4)' : 'rgba(34, 197, 94, 0.35)')};
`;

const VersionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const VersionChip = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.9rem;
  border-radius: 12px;
  background: ${props => (props.$highlight ? 'rgba(249, 115, 22, 0.1)' : 'var(--glass-bg-primary)')};
  border: 1px solid ${props => (props.$highlight ? 'rgba(249, 115, 22, 0.35)' : 'var(--glass-border)')};
`;

const VersionChipLabel = styled.span`
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--placeholder-text-color);
`;

const VersionChipValue = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--main-text-color);
`;

const ChangelogLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--main-text-color);
  text-decoration: none;
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  background: var(--glass-bg-secondary);
  border: 1px solid var(--glass-border);
  white-space: nowrap;
  margin-left: auto;
  transition: all 0.2s ease;

  &:hover {
    background: var(--active-bg-color);
    border-color: var(--primary-accent);
  }
`;

const ReleaseNotes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const ReleaseNotesToggle = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: var(--primary-accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
`;

const ReleaseNotesBody = styled.pre`
  margin: 0;
  padding: 1rem;
  border-radius: 14px;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  color: var(--second-text-color);
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: pre-wrap;
  max-height: 220px;
  overflow-y: auto;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const UpdateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #f97316, #ef4444);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(249, 115, 22, 0.4);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
`;

const FallbackHint = styled.p`
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: var(--glass-bg-primary);
  border: 1px solid var(--glass-border);
  color: var(--placeholder-text-color);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const RestartHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1.1rem;
  border-radius: 14px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--main-text-color);
  font-size: 0.82rem;
  flex-wrap: wrap;
`;

const RestartButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #062910;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;
