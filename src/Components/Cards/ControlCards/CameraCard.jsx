import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MdVideocam, MdVideocamOff, MdOutlineErrorOutline } from 'react-icons/md';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import { useGlobalState } from '../../Context/GlobalContext';
import Hls from 'hls.js';

// Styled Components
const CameraContainer = styled.div`
  background: linear-gradient(135deg,
    rgba(10, 10, 10, 0.95) 0%,
    rgba(15, 15, 15, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;

  @media (max-width: 768px) {
    border-radius: 12px;
    min-height: 300px;
  }
`;

const CameraHeader = styled.div`
  background: linear-gradient(135deg,
    rgba(15, 15, 15, 0.9) 0%,
    rgba(26, 26, 26, 0.9) 100%
  );
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--main-text-color);
  font-weight: 600;
  font-size: 16px;
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => {
    switch(props.status) {
      case 'streaming': return '#4CAF50';
      case 'connecting': return '#FFC107';
      case 'still': return '#2196F3';
      case 'error': return '#F44336';
      default: return 'var(--placeholder-text-color)';
    }
  }};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch(props.status) {
      case 'streaming': return '#4CAF50';
      case 'connecting': return '#FFC107';
      case 'still': return '#2196F3';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  }};
  animation: ${props => props.status === 'streaming' ? 'pulse 2s ease-in-out infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const CameraSelector = styled.select`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: var(--main-text-color);
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: var(--primary-accent);
  }

  option {
    background: rgba(20, 20, 20, 0.95);
    color: var(--main-text-color);
  }
`;

const VideoWrapper = styled.div`
  position: relative;
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  text-align: center;
  color: #F44336;
`;

const ErrorIcon = styled(MdOutlineErrorOutline)`
  font-size: 48px;
  opacity: 0.8;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 40px;
  text-align: center;
  color: var(--placeholder-text-color);
`;

const EmptyIcon = styled(MdVideocamOff)`
  font-size: 64px;
  opacity: 0.3;
`;

const FallbackImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: var(--main-text-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CameraCard = () => {
  const { entities, currentRoom, connection } = useHomeAssistant();
  const { HASS } = useGlobalState();
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const [useFallback, setUseFallback] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); // Blob URL for authenticated image
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Get HA token from localStorage
  const getHaToken = () => {
    // hassTokens contains JSON with access_token field
    const hassTokens = localStorage.getItem('hassTokens');
    if (hassTokens) {
      try {
        const tokens = JSON.parse(hassTokens);
        return tokens.access_token || '';
      } catch (e) {
        console.error('Failed to parse hassTokens:', e);
      }
    }
  };

  // Get base URL
  const getBaseUrl = () => {
    return import.meta.env.PROD ? window.location.origin : (import.meta.env.VITE_HA_HOST || '');
  };

  // Fetch authenticated camera image
  const fetchCameraImage = async (cameraId) => {
    try {
      const token = getHaToken();
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}/api/camera_proxy/${cameraId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch camera image: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setImageUrl(blobUrl);

      // Cleanup old blob URL if exists
      return () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      };
    } catch (err) {
      console.error('Failed to fetch camera image:', err);
      setError(err.message);
      throw err;
    }
  };

  // Filter cameras by area_id using HASS devices and entities (like DeviceCard does)
  useEffect(() => {
    if (!entities || !currentRoom || !HASS) return;

    const devices = HASS?.devices;
    const haEntities = HASS?.entities;
    let roomDeviceIds = [];
    let roomEntityIds = [];

    // Find devices in the current room
    if (devices) {
      for (const [key, device] of Object.entries(devices)) {
        if (device.area_id === currentRoom.toLowerCase()) {
          roomDeviceIds.push(key);
        }
      }
    }

    // Find camera entities that belong to devices in this room
    if (haEntities) {
      for (const [entityKey, entity] of Object.entries(haEntities)) {
        // Check if entity is a camera, belongs to a room device, and is not unavailable
        if (
          entityKey.startsWith('camera.') &&
          roomDeviceIds.includes(entity.device_id) &&
          entity.state !== 'unavailable'
        ) {
          roomEntityIds.push(entityKey);
        }
      }
    }

    // Get camera data from entities (for state/attributes)
    const roomCameras = roomEntityIds
      .map(entityId => entities[entityId])
      .filter(Boolean)
      .map(entity => ({
        entityId: entity.entity_id,
        friendlyName: entity?.attributes?.friendly_name || entity.entity_id,
        ...entity
      }));

    setCameras(roomCameras);

    // Load saved selection
    const saved = localStorage.getItem(`ogb_camera_${currentRoom}`);
    if (saved && roomCameras.find(c => c.entityId === saved)) {
      setSelectedCamera(saved);
    } else if (roomCameras.length > 0) {
      setSelectedCamera(roomCameras[0].entityId);
    }
  }, [entities, currentRoom, HASS]);

  // Initialize stream when camera selected
  useEffect(() => {
    if (!selectedCamera || !connection) return;

    const initializeStream = async () => {
      try {
        setError(null);
        setUseFallback(false);
        setStatus('connecting');

        // Try HLS stream first
        if (Hls.isSupported()) {
          try {
            // Call camera/stream via WebSocket
            const streamResponse = await connection.sendMessagePromise({
              type: 'camera/stream',
              entity_id: selectedCamera
            });

            if (streamResponse && streamResponse.url) {
              const hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                enableWorker: true
              });

              hls.loadSource(streamResponse.url);
              hls.attachMedia(videoRef.current);

              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setStatus('streaming');
                videoRef.current.play().catch(e => {
                  console.warn('Autoplay failed:', e);
                });
              });

              hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                  console.error('HLS fatal error:', data);
                  hls.destroy();
                  // Fallback to still image with authentication
                  setUseFallback(true);
                  setStatus('still');
                  setError(null);
                  fetchCameraImage(selectedCamera);
                }
              });

              hlsRef.current = hls;
              return;
            }
          } catch (hlsError) {
            console.warn('HLS stream failed:', hlsError);
          }
        }

        // Fallback: Direct video element (for Safari/MSE)
        else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          const streamResponse = await connection.sendMessagePromise({
            type: 'camera/stream',
            entity_id: selectedCamera
          });

          if (streamResponse && streamResponse.url) {
            videoRef.current.src = streamResponse.url;
            videoRef.current.addEventListener('loadedmetadata', () => {
              setStatus('streaming');
              videoRef.current.play().catch(e => {
                console.warn('Autoplay failed:', e);
              });
            });
            return;
          }
        }

        // Final fallback: Still image
        throw new Error('Camera does not support HLS streaming - using still image');

      } catch (err) {
        console.error('Stream initialization failed:', err);
        setError(null);
        setUseFallback(true);
        setStatus('still');
        fetchCameraImage(selectedCamera);
      }
    };

    initializeStream();

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.src = '';
      }
    };
  }, [selectedCamera, connection]);

  // Auto-refresh still images when in fallback mode
  useEffect(() => {
    if (!useFallback || !selectedCamera) return;

    // Initial fetch
    fetchCameraImage(selectedCamera);

    const interval = setInterval(() => {
      fetchCameraImage(selectedCamera);
    }, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(interval);
      // Cleanup blob URL on unmount
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [useFallback, selectedCamera]);

  // Handle camera selection
  const handleCameraChange = (e) => {
    const newCamera = e.target.value;
    setSelectedCamera(newCamera);
    localStorage.setItem(`ogb_camera_${currentRoom}`, newCamera);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (useFallback) {
      // For still images, fetch new authenticated image
      fetchCameraImage(selectedCamera);
    } else {
      // For streams, trigger re-initialization
      setUseFallback(false);
      setError(null);
      setStatus('connecting');
      const current = selectedCamera;
      setSelectedCamera(null);
      setTimeout(() => setSelectedCamera(current), 100);
    }
  };

  // Empty state
  if (cameras.length === 0) {
    return (
      <CameraContainer>
        <CameraHeader>
          <HeaderTitle>
            <MdVideocam />
            <span>Camera</span>
          </HeaderTitle>
        </CameraHeader>
        <VideoWrapper>
          <EmptyState>
            <EmptyIcon />
            <h3>No Cameras Found</h3>
            <p>Add a camera entity to the "{currentRoom}" room in Home Assistant</p>
          </EmptyState>
        </VideoWrapper>
      </CameraContainer>
    );
  }

  const currentFriendlyName = cameras.find(c => c.entityId === selectedCamera)?.friendlyName || selectedCamera;

  return (
    <CameraContainer>
      <CameraHeader>
        <HeaderTitle>
          <MdVideocam />
          <span>Camera</span>
        </HeaderTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusContainer status={status}>
            <StatusDot status={status} />
            <span>
              {status === 'streaming' && 'Live'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'idle' && 'Ready'}
              {status === 'still' && 'Still Image (5s)'}
              {status === 'error' && 'Error'}
            </span>
          </StatusContainer>
          {cameras.length > 1 && (
            <CameraSelector value={selectedCamera} onChange={handleCameraChange}>
              {cameras.map(cam => (
                <option key={cam.entityId} value={cam.entityId}>
                  {cam.friendlyName}
                </option>
              ))}
            </CameraSelector>
          )}
          {(status === 'error' || status === 'still') && (
            <RefreshButton onClick={handleRefresh}>
              {status === 'still' ? 'Refresh' : 'Retry'}
            </RefreshButton>
          )}
        </div>
      </CameraHeader>

      <VideoWrapper>
        {useFallback ? (
          imageUrl && (
            <FallbackImage
              src={imageUrl}
              alt={currentFriendlyName}
              onError={() => setError('Failed to load camera image')}
            />
          )
        ) : (
          <VideoElement
            ref={videoRef}
            controls
            muted
            playsInline
            onError={(e) => {
              console.error('Video error:', e);
              setUseFallback(true);
              setStatus('still');
              setError(null);
              fetchCameraImage(selectedCamera);
            }}
          />
        )}
      </VideoWrapper>
    </CameraContainer>
  );
};

export default CameraCard;
