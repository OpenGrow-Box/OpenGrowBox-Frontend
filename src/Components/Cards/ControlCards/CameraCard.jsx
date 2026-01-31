import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MdVideocam, MdVideocamOff, MdOutlineErrorOutline } from 'react-icons/md';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import { useGlobalState } from '../../Context/GlobalContext';
import Hls from 'hls.js';


const CameraCard = () => {
  const { entities, currentRoom, connection } = useHomeAssistant();
  const { HASS } = useGlobalState();
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const [useFallback, setUseFallback] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); // Blob URL for authenticated image
  const [activeTab, setActiveTab] = useState('stream'); // 'stream' | 'timelapse'
  const [timelapseConfig, setTimelapseConfig] = useState({
    startDate: '',
    endDate: '',
    interval: '60',
    format: 'mp4'
  });
  const [isGeneratingTimelapse, setIsGeneratingTimelapse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState({
    active: false,
    imageCount: 0,
    startTime: null,
  });
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

        // Timeout for HLS connection (5 seconds)
        const hlsTimeout = setTimeout(() => {
          console.warn('HLS connection timeout, falling back to still images');
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
          setUseFallback(true);
          setStatus('still');
          fetchCameraImage(selectedCamera);
        }, 5000);

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
                clearTimeout(hlsTimeout);
                setStatus('streaming');
                videoRef.current.play().catch(e => {
                  console.warn('Autoplay failed:', e);
                });
              });

              hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                  clearTimeout(hlsTimeout);
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
            clearTimeout(hlsTimeout);
            console.warn('HLS stream failed:', hlsError);
          }
          clearTimeout(hlsTimeout);
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


  // Initialize default dates for timelapse (last 24 hours) - must be before any early returns
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const formatDateTimeLocal = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setTimelapseConfig(prev => ({
      ...prev,
      endDate: formatDateTimeLocal(now),
      startDate: formatDateTimeLocal(yesterday)
    }));
  }, []);

  // Subscribe to timelapse events from backend
  useEffect(() => {
    if (!connection) return;

    let unsubscribeConfig = null;
    let unsubscribeComplete = null;
    let unsubscribeProgress = null;
    let unsubscribeRecording = null;

    const setupListeners = async () => {
      try {
        // Listen for timelapse config response
        unsubscribeConfig = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (data.device_name === selectedCamera) {
              console.log('Received timelapse config:', data);
              // Update timelapse config state with received data
              if (data.current_config) {
                setTimelapseConfig(prev => ({
                  ...prev,
                  interval: data.current_config.interval?.toString() || prev.interval,
                  startDate: data.current_config.StartDate || prev.startDate,
                  endDate: data.current_config.EndDate || prev.endDate,
                  format: data.current_config.OutPutFormat || prev.format,
                }));
              }
              // Update recording status
              if (data.tl_active !== undefined) {
                setIsRecording(data.tl_active);
              }
            }
          },
          'TimelapseConfigResponse'
        );

        // Listen for timelapse generation progress
        unsubscribeProgress = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (data.device_name === selectedCamera) {
              console.log('Timelapse progress:', data.progress, '%');
              // Could show progress bar here
            }
          },
          'TimelapseGenerationProgress'
        );

        // Listen for timelapse generation complete
        unsubscribeComplete = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (data.device_name === selectedCamera) {
              setIsGeneratingTimelapse(false);
              
              if (data.success && data.download_url) {
                // Trigger download
                const baseUrl = getBaseUrl();
                const downloadUrl = `${baseUrl}${data.download_url}`;
                
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', `timelapse_${selectedCamera}_${Date.now()}.${timelapseConfig.format}`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('Timelapse download started:', downloadUrl);
              } else {
                alert('Timelapse generation failed: ' + (data.error || 'Unknown error'));
              }
            }
          },
          'TimelapseGenerationComplete'
        );

        // Listen for camera recording status updates
        unsubscribeRecording = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (data.room === currentRoom && data.camera_entity === selectedCamera) {
              console.log('Camera recording status:', data);
              setIsRecording(data.is_recording);
              if (data.image_count !== undefined) {
                setRecordingStatus(prev => ({
                  ...prev,
                  imageCount: data.image_count,
                  active: data.is_recording,
                  startTime: data.start_time,
                }));
              }
            }
          },
          'CameraRecordingStatus'
        );
      } catch (err) {
        console.error('Error setting up timelapse event listeners:', err);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeConfig) unsubscribeConfig();
      if (unsubscribeComplete) unsubscribeComplete();
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeRecording) unsubscribeRecording();
    };
  }, [connection, selectedCamera, timelapseConfig.format, currentRoom]);

  // Request timelapse config from backend when timelapse tab becomes active
  useEffect(() => {
    if (!connection || !selectedCamera || activeTab !== 'timelapse') return;

    const requestTimelapseConfig = async () => {
      try {
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_timelapse_config',
          event_data: {
            device_name: selectedCamera,
          },
        });
        console.log('Requested timelapse config for:', selectedCamera);
      } catch (err) {
        console.error('Failed to request timelapse config:', err);
      }
    };

    requestTimelapseConfig();
  }, [connection, selectedCamera, activeTab]);

  const currentFriendlyName = cameras.find(c => c.entityId === selectedCamera)?.friendlyName || selectedCamera;

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

  // Handle timelapse config change and save to backend
  const handleTimelapseChange = async (field, value) => {
    // Update local state
    const newConfig = {
      ...timelapseConfig,
      [field]: value
    };
    setTimelapseConfig(newConfig);
    
    // Save to backend
    if (selectedCamera && connection) {
      try {
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_save_timelapse_config',
          event_data: {
            device_name: selectedCamera,
            config: {
              interval: newConfig.interval,
              startDate: newConfig.startDate,
              endDate: newConfig.endDate,
              format: newConfig.format,
            },
          },
        });
        console.log('Timelapse config saved to backend');
      } catch (err) {
        console.error('Failed to save timelapse config:', err);
      }
    }
  };

  // Handle timelapse download - sends HA event to backend
  const handleTimelapseDownload = async () => {
    if (!selectedCamera || !timelapseConfig.startDate || !timelapseConfig.endDate) {
      alert('Please select start and end dates for the timelapse');
      return;
    }

    setIsGeneratingTimelapse(true);

    try {
      // Send HA event to trigger timelapse generation
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_generate_timelapse',
        event_data: {
          device_name: selectedCamera,
          start_date: new Date(timelapseConfig.startDate).toISOString(),
          end_date: new Date(timelapseConfig.endDate).toISOString(),
          interval: parseInt(timelapseConfig.interval),
          format: timelapseConfig.format,
        },
      });

      console.log('Timelapse generation event sent to backend');

    } catch (err) {
      console.error('Failed to send timelapse event:', err);
      alert('Failed to start timelapse generation. Please try again.');
      setIsGeneratingTimelapse(false);
    }
  };

  // Start/Stop timelapse recording
  const toggleRecording = async () => {
    if (!selectedCamera) return;

    try {
      if (isRecording) {
        // Stop recording
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_stop_timelapse',
          event_data: {
            device_name: selectedCamera,
          },
        });
        setIsRecording(false);
        console.log('Timelapse recording stopped');
      } else {
        // Start recording
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_start_timelapse',
          event_data: {
            device_name: selectedCamera,
            interval: parseInt(timelapseConfig.interval),
          },
        });
        setIsRecording(true);
        setRecordingStatus({
          active: true,
          imageCount: 0,
          startTime: new Date().toISOString(),
        });
        console.log('Timelapse recording started');
      }
    } catch (err) {
      console.error('Failed to toggle recording:', err);
      alert('Failed to ' + (isRecording ? 'stop' : 'start') + ' recording');
    }
  };

  return (
    <CameraContainer>
      <CameraHeader>
        <HeaderTitle>
          <MdVideocam />
          <span>Camera</span>
        </HeaderTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CameraMenu>
            <TabButton active={activeTab === 'stream'} onClick={() => setActiveTab('stream')}>
              Stream
            </TabButton>
            <TabButton active={activeTab === 'timelapse'} onClick={() => setActiveTab('timelapse')}>
              Timelapse
            </TabButton>
          </CameraMenu>
          
          {activeTab === 'stream' && (
            <>
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
            </>
          )}
          
          {activeTab === 'timelapse' && cameras.length > 1 && (
            <CameraSelector value={selectedCamera} onChange={handleCameraChange}>
              {cameras.map(cam => (
                <option key={cam.entityId} value={cam.entityId}>
                  {cam.friendlyName}
                </option>
              ))}
            </CameraSelector>
          )}
        </div>
      </CameraHeader>

      {cameras.length === 0 ? (
        <VideoWrapper>
          <EmptyState>
            <EmptyIcon />
            <h3>No Cameras Found</h3>
            <p>Add a camera entity to the &quot;{currentRoom}&quot; room in Home Assistant</p>
          </EmptyState>
        </VideoWrapper>
      ) : activeTab === 'stream' ? (
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
      ) : (
        <TimelapseContainer>
          <TimelapseInfo>
            <strong>Timelapse Configuration</strong><br />
            Generate a timelapse video from your camera recordings. Select the time range and interval below.
          </TimelapseInfo>

          {/* Recording Status */}
          <TimelapseSection style={{ 
            background: isRecording ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
            padding: '16px', 
            borderRadius: '8px',
            border: isRecording ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <TimelapseLabel style={{ marginBottom: '4px' }}>
                  {isRecording ? '🔴 Recording Active' : '⚪ Recording Stopped'}
                </TimelapseLabel>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  {isRecording 
                    ? `Capturing every ${timelapseConfig.interval}s • Images: ${recordingStatus.imageCount}`
                    : 'Click Start to begin capturing images'
                  }
                </div>
              </div>
              <RecordButton 
                $isRecording={isRecording}
                onClick={toggleRecording}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </RecordButton>
            </div>
          </TimelapseSection>

          <DateTimeGrid>
            <TimelapseSection>
              <TimelapseLabel>Start Date & Time</TimelapseLabel>
              <TimelapseInput
                type="datetime-local"
                value={timelapseConfig.startDate}
                onChange={(e) => handleTimelapseChange('startDate', e.target.value)}
              />
            </TimelapseSection>

            <TimelapseSection>
              <TimelapseLabel>End Date & Time</TimelapseLabel>
              <TimelapseInput
                type="datetime-local"
                value={timelapseConfig.endDate}
                onChange={(e) => handleTimelapseChange('endDate', e.target.value)}
              />
            </TimelapseSection>
          </DateTimeGrid>

          <TimelapseSection>
            <TimelapseLabel>Capture Interval</TimelapseLabel>
            <TimelapseSelect
              value={timelapseConfig.interval}
              onChange={(e) => handleTimelapseChange('interval', e.target.value)}
            >
              <option value="5">Every 5 seconds</option>
              <option value="10">Every 10 seconds</option>
              <option value="30">Every 30 seconds</option>
              <option value="60">Every 1 minute</option>
              <option value="300">Every 5 minutes</option>
              <option value="600">Every 10 minutes</option>
              <option value="1800">Every 30 minutes</option>
              <option value="3600">Every 1 hour</option>
            </TimelapseSelect>
          </TimelapseSection>

          <TimelapseSection>
            <TimelapseLabel>Output Format</TimelapseLabel>
            <TimelapseSelect
              value={timelapseConfig.format}
              onChange={(e) => handleTimelapseChange('format', e.target.value)}
            >
              <option value="mp4">MP4 Video</option>
              <option value="zip">ZIP of Images</option>
            </TimelapseSelect>
          </TimelapseSection>

          <DownloadButton 
            onClick={handleTimelapseDownload}
            disabled={isGeneratingTimelapse || !timelapseConfig.startDate || !timelapseConfig.endDate}
          >
            {isGeneratingTimelapse ? 'Generating...' : 'Download Timelapse'}
          </DownloadButton>
        </TimelapseContainer>
      )}
    </CameraContainer>
  );
};

export default CameraCard;


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

const CameraMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TabButton = styled.button`
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  background: ${props => props.active ? 'var(--primary-accent)' : 'transparent'};
  color: ${props => props.active ? '#fff' : 'var(--main-text-color)'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const TimelapseContainer = styled.div`
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const TimelapseSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TimelapseLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--main-text-color);
  opacity: 0.8;
`;

const TimelapseInput = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: var(--main-text-color);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: var(--primary-accent);
  }
`;

const TimelapseSelect = styled.select`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: var(--main-text-color);
  font-size: 14px;
  outline: none;
  cursor: pointer;
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

const DownloadButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: var(--primary-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const RecordButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: ${props => props.$isRecording ? '#f44336' : '#4CAF50'};
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TimelapseInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  color: var(--main-text-color);
  line-height: 1.5;
`;

const DateTimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
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