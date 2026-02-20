import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MdVideocam, MdVideocamOff, MdOutlineErrorOutline, MdChevronLeft, MdChevronRight, MdDelete, MdDownload, MdDeleteSweep, MdWarning, MdSchedule } from 'react-icons/md';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import { useGlobalState } from '../../Context/GlobalContext';
import Hls from 'hls.js';


const CameraCard = () => {
  const { entities, currentRoom, connection, accessToken } = useHomeAssistant();
  const { HASS } = useGlobalState();
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const [useFallback, setUseFallback] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); // Blob URL for authenticated image
  const [activeTab, setActiveTab] = useState('stream'); // 'stream' | 'daily' | 'timelapse'
  const [timelapseConfig, setTimelapseConfig] = useState({
    startDate: '',
    endDate: '',
    interval: '300',
    format: 'mp4',
    dailySnapshotEnabled: false,
    dailySnapshotTime: '09:00'
  });
  const [isGeneratingTimelapse, setIsGeneratingTimelapse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState({
    active: false,
    imageCount: 0,
    startTime: null,
  });
  const [scheduledTimelapse, setScheduledTimelapse] = useState({
    isScheduled: false,
    scheduledStart: null,      // ISO string
    scheduledEnd: null,        // ISO string
    countdown: '',             // Human-readable countdown
  });
  const [dailyPhotos, setDailyPhotos] = useState([]);
  const [currentPhotoDate, setCurrentPhotoDate] = useState(null);
  const [dailyViewLoading, setDailyViewLoading] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null); // Blob URL for current daily photo
  const [isDeletingAllDaily, setIsDeletingAllDaily] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipDateRange, setZipDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Countdown state for timelapse next capture and daily snapshot
  const [lastTimelapseCapture, setLastTimelapseCapture] = useState(null); // timestamp of last capture
  const [nextTimelapseCountdown, setNextTimelapseCountdown] = useState(''); // "Xm Ys"
  const [nextDailySnapshot, setNextDailySnapshot] = useState(null); // "Xh Ym" or null if disabled

  const [isDeletingAllTimelapse, setIsDeletingAllTimelapse] = useState(false);
  const [isDeletingTimelapseOutput, setIsDeletingTimelapseOutput] = useState(false);
  const [captureFailure, setCaptureFailure] = useState(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Timelapse progress state
  const [timelapseProgress, setTimelapseProgress] = useState({
    active: false,
    percent: 0,
    status: 'idle', // 'idle' | 'generating' | 'complete' | 'error'
    error: null
  });

  // Refs to store current values for event handlers (prevents stale closure issues)
  const selectedCameraRef = useRef(selectedCamera);
  const currentPhotoDateRef = useRef(currentPhotoDate);
  const timelapseConfigRef = useRef(timelapseConfig);
  const imageCountRef = useRef(recordingStatus.imageCount);
  // Update refs when state changes
  useEffect(() => {
    selectedCameraRef.current = selectedCamera;
  }, [selectedCamera]);

  useEffect(() => {
    currentPhotoDateRef.current = currentPhotoDate;
  }, [currentPhotoDate]);

  useEffect(() => {
    timelapseConfigRef.current = timelapseConfig;
  }, [timelapseConfig]);

  useEffect(() => {
    imageCountRef.current = recordingStatus.imageCount;
  }, [recordingStatus.imageCount]);

  // Time format conversion utilities for UTC ISO standardization
  // Convert HTML datetime-local format to UTC ISO string
  const toUtcISO = (dateTimeLocal) => {
    if (!dateTimeLocal) return '';
    try {
      const localDate = new Date(dateTimeLocal);
      if (isNaN(localDate.getTime())) {
        throw new Error('Invalid date');
      }
      return localDate.toISOString();
    } catch (e) {
      console.error('Date conversion to UTC ISO failed:', e);
      return '';
    }
  };

  // Convert UTC ISO string to HTML datetime-local format
  const fromUtcISO = (utcISO) => {
    if (!utcISO) return '';
    try {
      const utcDate = new Date(utcISO);
      if (isNaN(utcDate.getTime())) {
        return '';
      }
      const pad = (n) => n.toString().padStart(2, '0');
      return `${utcDate.getFullYear()}-${pad(utcDate.getMonth() + 1)}-${pad(utcDate.getDate())}T${pad(utcDate.getHours())}:${pad(utcDate.getMinutes())}`;
    } catch (e) {
      console.error('Date conversion from UTC ISO failed:', e);
      return '';
    }
  };

  // Get HA token from available sources
  const getHaToken = () => {
    // Priority 1: Use accessToken from HomeAssistantContext (already validated)
    // This is the token used to establish the WebSocket connection
    if (accessToken) {
      //console.log('[CameraCard] Using token from HomeAssistantContext');
      return accessToken;
    }

    // Priority 2: Try to get from GlobalContext (if available)
    // In PROD mode, this is set from hass.states["text.ogb_accesstoken"].state
    if (HASS && HASS.states && HASS.states['text.ogb_accesstoken']) {
      const token = HASS.states['text.ogb_accesstoken'].state;
      if (token) {
        //console.log('[CameraCard] Using token from HASS entity');
        return token;
      }
    }

    // Priority 3: Fallback to hassTokens from localStorage (OAuth tokens)
    // hassTokens contains JSON with access_token, refresh_token, expires, etc.
    const hassTokens = localStorage.getItem('hassTokens');
    if (hassTokens) {
      try {
        const tokens = JSON.parse(hassTokens);
        if (tokens.access_token) {
          //console.log('[CameraCard] Using access_token from hassTokens');
          return tokens.access_token;
        }
      } catch (e) {
        console.error('[CameraCard] Failed to parse hassTokens:', e);
      }
    }

    console.error('[CameraCard] No token available from any source');
    return '';
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

      if (!token) {
        console.warn('[CameraCard] No HA token available for camera fetch');
        throw new Error('No authentication token available');
      }

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
    // Use optional chaining to handle cases where HASS isn't ready yet
    // This prevents the "No Cameras Found" issue on Chrome reload
    if (!entities || !currentRoom) return;

    const devices = HASS?.devices;
    const haEntities = HASS?.entities;

    // If HASS isn't ready yet, skip this run but don't exit permanently
    // The effect will re-run when HASS becomes available
    if (!devices || !haEntities) return;
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

  // Countdown timer for scheduled timelapses
  useEffect(() => {
    if (!scheduledTimelapse.isScheduled || !scheduledTimelapse.scheduledStart) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const start = new Date(scheduledTimelapse.scheduledStart);
      const diff = start - now;

      if (diff <= 0) {
        // Time has passed - recording should be active now
        setScheduledTimelapse(prev => ({
          ...prev,
          isScheduled: false,
          countdown: ''
        }));
        return;
      }

      // Calculate human-readable countdown
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let countdown = '';
      if (hours > 0) countdown += `${hours}h `;
      if (minutes > 0) countdown += `${minutes}m `;
      countdown += `${seconds}s`;

      setScheduledTimelapse(prev => ({ ...prev, countdown: countdown.trim() }));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [scheduledTimelapse.isScheduled, scheduledTimelapse.scheduledStart]);

  // Countdown timer for next timelapse image capture
  useEffect(() => {
    if (!isRecording || !lastTimelapseCapture) {
      setNextTimelapseCountdown('');
      return;
    }

    const updateNextCapture = () => {
      const now = Date.now();
      const intervalMs = parseInt(timelapseConfig.interval) * 1000;
      const nextCapture = lastTimelapseCapture + intervalMs;
      const diff = nextCapture - now;

      if (diff <= 0) {
        // Time passed - capture should have happened by now
        setNextTimelapseCountdown('');
        return;
      }

      // Format countdown (minutes and seconds)
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setNextTimelapseCountdown(`${minutes}m ${seconds}s`);
    };

    updateNextCapture();
    const interval = setInterval(updateNextCapture, 1000);

    return () => clearInterval(interval);
  }, [isRecording, lastTimelapseCapture, timelapseConfig.interval]);

  // Clear timelapse countdown when recording stops, initialize when recording starts
  useEffect(() => {
    if (!isRecording) {
      setLastTimelapseCapture(null);
      setNextTimelapseCountdown('');
    } else {
      // Initialize last capture time when recording starts or page loads with active recording
      setLastTimelapseCapture(Date.now());
    }
  }, [isRecording]);

  // Countdown timer for next daily snapshot
  useEffect(() => {
    if (!timelapseConfig.dailySnapshotEnabled) {
      setNextDailySnapshot(null);
      return;
    }

    const updateNextSnapshot = () => {
      const now = new Date();
      const [hours, minutes] = timelapseConfig.dailySnapshotTime.split(':').map(Number);

      // Validate time format
      if (isNaN(hours) || isNaN(minutes)) {
        setNextDailySnapshot(null);
        return;
      }

      // Create date for today's snapshot time
      const todaySnapshot = new Date(now);
      todaySnapshot.setHours(hours, minutes, 0, 0);

      // If time has passed today, use tomorrow
      const nextSnapshot = todaySnapshot <= now
        ? new Date(todaySnapshot.getTime() + 24 * 60 * 60 * 1000)
        : todaySnapshot;

      const diff = nextSnapshot - now;

      // Format countdown
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const totalMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        setNextDailySnapshot(`${days}d ${totalHours % 24}h`);
      } else if (totalHours > 0) {
        setNextDailySnapshot(`${totalHours}h ${totalMinutes}m`);
      } else {
        setNextDailySnapshot(`${totalMinutes}m`);
      }
    };

    updateNextSnapshot();
    const interval = setInterval(updateNextSnapshot, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timelapseConfig.dailySnapshotEnabled, timelapseConfig.dailySnapshotTime]);

  // Reset countdown state when camera or room changes
  useEffect(() => {
    setLastTimelapseCapture(null);
    setNextTimelapseCountdown('');
    setNextDailySnapshot(null);
  }, [selectedCamera, currentRoom]);

  // Subscribe to timelapse events from backend
  useEffect(() => {
    if (!connection) return;

    let unsubscribeConfig = null;
    let unsubscribeComplete = null;
    let unsubscribeProgress = null;
    let unsubscribeRecording = null;
    let isMounted = true; // Track if component is mounted

    const setupListeners = async () => {
      try {
        // Listen for timelapse config response
        unsubscribeConfig = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // Prevent updates if unmounted
            if (data.device_name === selectedCamera) {
              console.log('Received timelapse config:', data);
              // Update timelapse config state with received data
              if (data.current_config) {
                setTimelapseConfig(prev => ({
                  ...prev,
                  interval: data.current_config.interval?.toString() || prev.interval,
                  startDate: fromUtcISO(data.current_config.StartDate) || prev.startDate,
                  endDate: fromUtcISO(data.current_config.EndDate) || prev.endDate,
                  format: data.current_config.OutPutFormat || prev.format,
                  dailySnapshotEnabled: data.current_config.daily_snapshot_enabled ?? prev.dailySnapshotEnabled,
                  dailySnapshotTime: data.current_config.daily_snapshot_time || prev.dailySnapshotTime,
                }));
              }
              // Update recording status
              if (data.tl_active !== undefined) {
                setIsRecording(data.tl_active);
              }
              // Update image count from config response
              if (data.tl_image_count !== undefined) {
                setRecordingStatus(prev => ({
                  ...prev,
                  imageCount: data.tl_image_count,
                }));
              }
            }
          },
          'TimelapseConfigResponse'
        );

        // Listen for timelapse generation progress
        unsubscribeProgress = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // Prevent updates if unmounted
            if (data.device_name === selectedCameraRef.current) {
              setTimelapseProgress({
                active: true,
                percent: data.progress,
                status: 'generating',
                error: null
              });
            }
          },
          'TimelapseGenerationProgress'
        );

        // Listen for timelapse generation complete
        unsubscribeComplete = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // CRITICAL: Prevent download from orphaned subscription
            if (data.device_name === selectedCameraRef.current) {
              if (data.success && data.download_url) {
                // Show complete message
                setTimelapseProgress(prev => ({
                  ...prev,
                  percent: 100,
                  status: 'complete',
                  error: null
                }));

                // Trigger download
                const baseUrl = getBaseUrl();
                const downloadUrl = `${baseUrl}${data.download_url}`;
                
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', `timelapse_${selectedCameraRef.current}_${Date.now()}.${timelapseConfigRef.current.format}`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('Timelapse download started:', downloadUrl);

                // Auto-hide progress section after 2 seconds, then reset
                setTimeout(() => {
                  if (!isMounted) return;
                  setIsGeneratingTimelapse(false);
                  setTimelapseProgress({
                    active: false,
                    percent: 0,
                    status: 'idle',
                    error: null
                  });
                }, 2000);
              } else {
                // Show error inline
                setTimelapseProgress({
                  active: true,
                  percent: timelapseProgress.percent,
                  status: 'error',
                  error: data.error || 'Unknown error'
                });

                // Auto-hide error after 5 seconds
                setTimeout(() => {
                  if (!isMounted) return;
                  setIsGeneratingTimelapse(false);
                  setTimelapseProgress({
                    active: false,
                    percent: 0,
                    status: 'idle',
                    error: null
                  });
                }, 5000);
              }
            }
          },
          'TimelapseGenerationComplete'
        );

        // Listen for camera recording status updates
        unsubscribeRecording = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // Prevent updates if unmounted
            if (data.room === currentRoom && data.camera_entity === selectedCamera) {
              console.log('Camera recording status:', data);
              setIsRecording(data.is_recording);

              // Handle scheduled state
              if (data.is_scheduled) {
                setScheduledTimelapse({
                  isScheduled: true,
                  scheduledStart: data.scheduled_start,
                  scheduledEnd: data.scheduled_end,
                  countdown: ''
                });
              } else {
                setScheduledTimelapse({
                  isScheduled: false,
                  scheduledStart: null,
                  scheduledEnd: null,
                  countdown: ''
                });
              }

              // Existing image count logic
              if (data.image_count !== undefined) {
                // Track last capture time when image count increases (using ref to avoid stale closure)
                if (data.image_count > imageCountRef.current) {
                  setLastTimelapseCapture(Date.now());
                }

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
      isMounted = false; // Mark as unmounted before cleanup
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
        // Request config (existing)
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_timelapse_config',
          event_data: {
            device_name: selectedCamera,
          },
        });

        // NEW: Also request current status to restore scheduled state after refresh
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_timelapse_status',
          event_data: {
            device_name: selectedCamera,
          },
        });

        console.log('Requested timelapse config and status for:', selectedCamera);
      } catch (err) {
        console.error('Failed to request timelapse config:', err);
      }
    };

    requestTimelapseConfig();
  }, [connection, selectedCamera, activeTab]);

  // Subscribe to daily photo events from backend
  useEffect(() => {
    if (!connection) return;

    const unsubscribeFunctions = [];
    let isMounted = true; // Track if component is mounted

    const setupDailyListeners = async () => {
      try {
        // Listen for daily photos list response
        const unsubPhotos = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (data.camera_entity === selectedCamera) {
              console.log('Received daily photos list:', data.photos);
              setDailyPhotos(data.photos || []);
              setDailyViewLoading(false);
              // Select most recent photo if none selected
              if (data.photos && data.photos.length > 0 && !currentPhotoDate) {
                setCurrentPhotoDate(data.photos[0].date);
              }
            }
          },
          'DailyPhotosResponse'
        );
        unsubscribeFunctions.push(unsubPhotos);

        // Listen for individual daily photo response
        const unsubPhoto = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            // Use refs to get current values instead of stale closure values
            const currentSelectedCamera = selectedCameraRef.current;
            const currentPhotoDate = currentPhotoDateRef.current;

            if (data.camera_entity === currentSelectedCamera && data.date === currentPhotoDate) {
              if (data.success && data.image_data) {
                // Convert base64 to blob URL
                const byteCharacters = atob(data.image_data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const blobUrl = URL.createObjectURL(blob);
                setCurrentPhotoUrl(blobUrl);
              } else {
                console.error('[CameraCard] Failed to load photo:', data.error);
              }
            }
          },
          'DailyPhotoResponse'
        );
        unsubscribeFunctions.push(unsubPhoto);

        // Listen for photo deletion events
        const unsubDeleted = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (data.camera_entity === selectedCamera) {
              console.log('Photo deleted:', data.date);
              // Remove deleted photo from list
              setDailyPhotos(prev => prev.filter(p => p.date !== data.date));
              // If current photo was deleted, select another
              if (currentPhotoDate === data.date) {
                setDailyPhotos(prev => {
                  if (prev.length > 0) {
                    setCurrentPhotoDate(prev[0].date);
                  } else {
                    setCurrentPhotoDate(null);
                    setCurrentPhotoUrl(null);
                  }
                  return prev;
                });
              }
            }
          },
          'ogb_camera_photo_deleted'
        );
        unsubscribeFunctions.push(unsubDeleted);

        // Listen for all photos deleted event
        const unsubAllDeleted = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (data.camera_entity === selectedCamera) {
              console.log('All daily photos deleted:', data.deleted_count);
              setIsDeletingAllDaily(false);
              // Clear all state
              setDailyPhotos([]);
              setCurrentPhotoDate(null);
              setCurrentPhotoUrl(null);
              // Show success message
              alert(`Successfully deleted ${data.deleted_count} daily photos.`);
            }
          },
          'ogb_camera_all_daily_deleted'
        );
        unsubscribeFunctions.push(unsubAllDeleted);

        // Listen for ZIP download response
        const unsubZipDownload = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // CRITICAL: Prevent download from orphaned subscription
            if (data.camera_entity === selectedCamera) {
              setIsDownloadingZip(false);
              if (data.success && data.zip_data) {
                // Convert base64 to blob and trigger download
                const byteCharacters = atob(data.zip_data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/zip' });
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', `daily_photos_${selectedCamera}_${Date.now()}.zip`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);

                console.log('ZIP download started for', data.photo_count, 'photos');
              } else {
                alert('Failed to download ZIP: ' + (data.error || 'Unknown error'));
              }
            }
          },
          'DailyZipResponse'
        );
        unsubscribeFunctions.push(unsubZipDownload);

        // Listen for capture failure events
        const unsubCaptureFailed = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // Prevent updates if unmounted
            if (data.camera_entity === selectedCamera) {
              console.error('Capture failed:', data.error);
              // Show notification to user with retry option
              setCaptureFailure({
                error: data.error,
                retryCount: data.retry_count,
                maxRetries: 3
              });
            }
          },
          'ogb_camera_capture_failed'
        );
        unsubscribeFunctions.push(unsubCaptureFailed);

        // Listen for all timelapse photos deleted event
        const unsubTimelapseDeleted = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // Prevent updates if unmounted
            if (data.camera_entity === selectedCamera) {
              console.log('All timelapse photos deleted:', data.deleted_count);
              setIsDeletingAllTimelapse(false);
              alert(`Successfully deleted ${data.deleted_count} timelapse photos.`);
            }
          },
          'ogb_camera_all_timelapse_deleted'
        );
        unsubscribeFunctions.push(unsubTimelapseDeleted);

        // Listen for all timelapse output deleted event
        const unsubTimelapseOutputDeleted = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // Prevent updates if unmounted
            if (data.camera_entity === selectedCamera) {
              console.log('All timelapse output deleted:', data.deleted_count);
              setIsDeletingTimelapseOutput(false);
              alert(`Successfully deleted ${data.deleted_count} timelapse output files.`);
            }
          },
          'ogb_camera_all_timelapse_output_deleted'
        );
        unsubscribeFunctions.push(unsubTimelapseOutputDeleted);
      } catch (err) {
        console.error('Error setting up daily photo event listeners:', err);
      }
    };

    setupDailyListeners();

    return () => {
      isMounted = false; // Mark as unmounted before cleanup
      // Clean up all subscriptions
      unsubscribeFunctions.forEach(unsub => {
        if (unsub) unsub();
      });
    };
  }, [connection, selectedCamera, currentPhotoDate]);

  // Request daily photos list when daily or timelapse tab becomes active
  useEffect(() => {
    if (!connection || !selectedCamera || (activeTab !== 'daily' && activeTab !== 'timelapse')) return;

    const requestDailyPhotos = async () => {
      try {
        setDailyViewLoading(true);
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_daily_photos',
          event_data: {
            device_name: selectedCamera,  // Backend expects 'device_name' not 'camera_entity'
          },
        });
        console.log('Requested daily photos for:', selectedCamera);
      } catch (err) {
        console.error('Failed to request daily photos:', err);
        setDailyViewLoading(false);
      }
    };

    requestDailyPhotos();
  }, [connection, selectedCamera, activeTab]);

  // Load individual photo when currentPhotoDate changes
  useEffect(() => {
    if (!connection || !selectedCamera || !currentPhotoDate || activeTab !== 'daily') return;

    const requestDailyPhoto = async () => {
      try {
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_daily_photo',
          event_data: {
            device_name: selectedCamera,
            date: currentPhotoDate,
          },
        });
      } catch (err) {
        console.error('[CameraCard] Failed to request daily photo:', err);
      }
    };

    requestDailyPhoto();
  }, [connection, selectedCamera, currentPhotoDate, activeTab]);

  const currentFriendlyName = cameras.find(c => c.entityId === selectedCamera)?.friendlyName || selectedCamera;

  // Handle camera selection
  const handleCameraChange = (e) => {
    const newCamera = e.target.value;
    setSelectedCamera(newCamera);
    localStorage.setItem(`ogb_camera_${currentRoom}`, newCamera);
  };

  // Handle navigation to previous day's photo
  const handlePreviousDay = () => {
    const currentIndex = dailyPhotos.findIndex(p => p.date === currentPhotoDate);
    if (currentIndex > 0) {
      const newPhoto = dailyPhotos[currentIndex - 1];
      setCurrentPhotoDate(newPhoto.date);
    } else {
      alert('No older photos available');
    }
  };

  // Handle navigation to next day's photo
  const handleNextDay = () => {
    const currentIndex = dailyPhotos.findIndex(p => p.date === currentPhotoDate);
    if (currentIndex < dailyPhotos.length - 1) {
      const newPhoto = dailyPhotos[currentIndex + 1];
      setCurrentPhotoDate(newPhoto.date);
    } else {
      alert('No newer photos available');
    }
  };

  // Handle delete current photo
  const handleDeletePhoto = async () => {
    if (!currentPhotoDate || !selectedCamera || !connection) return;

    try {
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_delete_daily_photo',
        event_data: {
          camera_entity: selectedCamera,
          date: currentPhotoDate,
        },
      });
      console.log('Delete photo event sent for:', currentPhotoDate);
    } catch (err) {
      console.error('Failed to delete photo:', err);
      alert('Failed to delete photo. Please try again.');
    }
  };

  // Handle delete all daily photos
  const handleDeleteAllDaily = async () => {
    if (!selectedCamera || !connection) return;

    const photoCount = dailyPhotos.length;
    if (photoCount === 0) {
      alert('No daily photos to delete.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all ${photoCount} daily photos? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeletingAllDaily(true);
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_delete_all_daily',
        event_data: {
          camera_entity: selectedCamera,
        },
      });
      console.log('Delete all daily photos event sent');
    } catch (err) {
      console.error('Failed to delete all daily photos:', err);
      setIsDeletingAllDaily(false);
      alert('Failed to delete all daily photos. Please try again.');
    }
  };

  // Handle download ZIP of filtered daily photos
  const handleDownloadZip = async () => {
    if (!selectedCamera || !connection) return;

    // Filter photos by date range if specified
    const filteredPhotos = dailyPhotos.filter(photo => {
      if (!zipDateRange.startDate && !zipDateRange.endDate) {
        return true; // No filter, include all
      }

      const photoDate = new Date(photo.date);
      const startDate = zipDateRange.startDate ? new Date(zipDateRange.startDate) : null;
      const endDate = zipDateRange.endDate ? new Date(zipDateRange.endDate) : null;

      if (startDate && photoDate < startDate) return false;
      if (endDate && photoDate > endDate) return false;

      return true;
    });

    if (filteredPhotos.length === 0) {
      alert('No daily photos found in the selected date range.');
      return;
    }

    try {
      setIsDownloadingZip(true);
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_download_daily_zip',
        event_data: {
          camera_entity: selectedCamera,
          start_date: zipDateRange.startDate || undefined,
          end_date: zipDateRange.endDate || undefined,
        },
      });
      console.log('Download ZIP event sent for', filteredPhotos.length, 'photos');
    } catch (err) {
      console.error('Failed to download ZIP:', err);
      setIsDownloadingZip(false);
      alert('Failed to download ZIP. Please try again.');
    }
  };

  // Handle delete all timelapse photos
  const handleDeleteAllTimelapse = async () => {
    if (!selectedCamera || !connection) return;

    if (!window.confirm('Are you sure you want to delete all timelapse photos? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeletingAllTimelapse(true);
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_delete_all_timelapse',
        event_data: {
          camera_entity: selectedCamera,
        },
      });
      console.log('Delete all timelapse event sent');
    } catch (err) {
      console.error('Failed to delete all timelapse photos:', err);
      setIsDeletingAllTimelapse(false);
      alert('Failed to delete all timelapse photos. Please try again.');
    }
  };

  // Handle delete all timelapse output files
  const handleDeleteTimelapseOutput = async () => {
    if (!selectedCamera || !connection) return;

    if (!window.confirm('Are you sure you want to delete all timelapse output files (MP4/ZIP)? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeletingTimelapseOutput(true);
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_delete_all_timelapse_output',
        event_data: {
          camera_entity: selectedCamera,
        },
      });
      console.log('Delete all timelapse output event sent');
    } catch (err) {
      console.error('Failed to delete all timelapse output:', err);
      setIsDeletingTimelapseOutput(false);
      alert('Failed to delete all timelapse output files. Please try again.');
    }
  };

  // Handle retry capture after failure
  const handleRetryCapture = async () => {
    if (!selectedCamera || !connection) return;

    try {
      setCaptureFailure(prev => ({ ...prev, isRetrying: true }));
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_retry_daily_snapshot',
        event_data: {
          camera_entity: selectedCamera,
        },
      });
      console.log('Retry capture event sent for:', selectedCamera);
      // Clear notification after sending retry - will show new notification if fails again
      setTimeout(() => setCaptureFailure(null), 2000);
    } catch (err) {
      console.error('Failed to send retry capture event:', err);
      setCaptureFailure(prev => ({ ...prev, isRetrying: false }));
      alert('Failed to trigger retry. Please try again.');
    }
  };

  // Dismiss capture failure notification
  const handleDismissFailure = () => {
    setCaptureFailure(null);
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
        console.log('[CameraCard] Sending timelapse config change:', field, value);
        console.log('[CameraCard] Selected camera:', selectedCamera);
        
        const response = await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_save_timelapse_config',
          event_data: {
            device_name: selectedCamera,
            config: {
              interval: newConfig.interval,
              startDate: toUtcISO(newConfig.startDate),
              endDate: toUtcISO(newConfig.endDate),
              format: newConfig.format,
              daily_snapshot_enabled: newConfig.dailySnapshotEnabled,
              daily_snapshot_time: newConfig.dailySnapshotTime,
            },
          },
        });
        console.log('[CameraCard] Timelapse config saved to backend, response:', response);
      } catch (err) {
        console.error('[CameraCard] Failed to save timelapse config:', err);
      }
    } else {
      console.warn('[CameraCard] Cannot save - no camera selected or no connection');
    }
  };

  // Handle timelapse download - sends HA event to backend
  const handleTimelapseDownload = async () => {
    if (!selectedCamera || !timelapseConfig.startDate || !timelapseConfig.endDate) {
      alert('Please select start and end dates for the timelapse');
      return;
    }

    setIsGeneratingTimelapse(true);

    // Reset progress state
    setTimelapseProgress({
      active: true,
      percent: 0,
      status: 'generating',
      error: null
    });

    try {
      // Send HA event to trigger timelapse generation
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'opengrowbox_generate_timelapse',
        event_data: {
          device_name: selectedCamera,
          start_date: toUtcISO(timelapseConfig.startDate),
          end_date: toUtcISO(timelapseConfig.endDate),
          interval: parseInt(timelapseConfig.interval),
          format: timelapseConfig.format,
        },
      });

      console.log('Timelapse generation event sent to backend');

    } catch (err) {
      console.error('Failed to send timelapse event:', err);
      setTimelapseProgress({
        active: true,
        percent: 0,
        status: 'error',
        error: 'Failed to communicate with backend'
      });

      // Auto-hide error after 5 seconds
      setTimeout(() => {
      setIsGeneratingTimelapse(false);
        setTimelapseProgress({
          active: false,
          percent: 0,
          status: 'idle',
          error: null
        });
      }, 5000);
    }
  };

  // Start/Stop timelapse recording
  const toggleRecording = async () => {
    if (!selectedCamera) return;

    try {
      if (isRecording || scheduledTimelapse.isScheduled) {
        const action = isRecording ? 'stop recording' : 'cancel schedule';

        if (!window.confirm(`Are you sure you want to ${action}?`)) {
          return;
        }

        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_stop_timelapse',
          event_data: {
            device_name: selectedCamera,
            room: currentRoom,
          },
        });

        // Clear scheduled state immediately for better UX
        setScheduledTimelapse({
          isScheduled: false,
          scheduledStart: null,
          scheduledEnd: null,
          countdown: ''
        });

        console.log(`Timelapse ${action} successful`);
      } else {
        // Start recording
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_start_timelapse',
          event_data: {
            device_name: selectedCamera,
            room: currentRoom,
          },
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
      {captureFailure && (
        <CaptureFailureNotification>
          <NotificationContent>
            <NotificationIcon>
              <MdOutlineErrorOutline />
            </NotificationIcon>
            <NotificationMessage>
              <NotificationTitle>Daily Snapshot Failed</NotificationTitle>
              <NotificationError>{captureFailure.error}</NotificationError>
              <NotificationRetryCount>
                Retry attempt {captureFailure.retryCount} of {captureFailure.maxRetries}
              </NotificationRetryCount>
            </NotificationMessage>
            <NotificationActions>
              <RetryButton
                onClick={handleRetryCapture}
                disabled={captureFailure.isRetrying}
              >
                {captureFailure.isRetrying ? 'Retrying...' : 'Retry Now'}
              </RetryButton>
              <DismissButton onClick={handleDismissFailure}>
                Dismiss
              </DismissButton>
            </NotificationActions>
            <DismissIconButton onClick={handleDismissFailure}>
              ×
            </DismissIconButton>
          </NotificationContent>
        </CaptureFailureNotification>
      )}
      <CameraHeader>
        <HeaderTitle>
          <MdVideocam />
          <span>Camera</span>
        </HeaderTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CameraMenu>
            <TabButton active={activeTab === 'stream'} onClick={() => setActiveTab('stream')}>
              Live View
            </TabButton>
            <TabButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')}>
              Daily View
            </TabButton>
            <TabButton active={activeTab === 'timelapse'} onClick={() => setActiveTab('timelapse')}>
              Timelapse & Config
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

          {activeTab === 'daily' && cameras.length > 1 && (
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
      ) : activeTab === 'daily' ? (
        <DailyViewWrapper>
          {dailyViewLoading ? (
            <DailyEmptyState>
              <DailyLoadingSpinner />
              <p>Loading daily photos...</p>
            </DailyEmptyState>
          ) : dailyPhotos.length === 0 ? (
            <DailyEmptyState>
              <MdOutlineErrorOutline />
              <h3>No Daily Snapshots Yet</h3>
              <p>Enable daily snapshots in the Timelapse & Config settings to start tracking your plant growth.</p>
            </DailyEmptyState>
          ) : (
            <>
              <DailyPhotoContainer>
                <PhotoDisplayArea>
                  {currentPhotoUrl && (
                    <DailyPhotoImage
                      key={currentPhotoDate}
                      src={currentPhotoUrl}
                      alt={`Daily photo for ${currentPhotoDate}`}
                    />
                  )}
                  <PhotoOverlay>
                    <NavButton
                      direction="left"
                      onClick={handleNextDay}
                      disabled={dailyPhotos.findIndex(p => p.date === currentPhotoDate) === dailyPhotos.length - 1}
                    >
                      <MdChevronLeft />
                    </NavButton>
                    <PhotoDate>{currentPhotoDate}</PhotoDate>
                    <DailyInfo>
                      <span>
                        {dailyPhotos.findIndex(p => p.date === currentPhotoDate) + 1} of {dailyPhotos.length} photos
                      </span>
                    </DailyInfo>
                    <DeleteButton
                      onClick={() => {
                        if (window.confirm(`Delete photo for ${currentPhotoDate}? This action cannot be undone.`)) {
                          handleDeletePhoto();
                        }
                      }}
                    >
                      <MdDelete />
                    </DeleteButton>
                    <NavButton
                      direction="right"
                      onClick={handlePreviousDay}
                      disabled={dailyPhotos.findIndex(p => p.date === currentPhotoDate) === 0}
                    >
                      <MdChevronRight />
                    </NavButton>
                  </PhotoOverlay>
                </PhotoDisplayArea>
              </DailyPhotoContainer>
            </>
          )}
        </DailyViewWrapper>
      ) : (
        <TimelapseContainer>
          <TimelapseConfigSection>
            {/* Section Header */}
            <TimelapseConfigHeader>
              <TimelapseConfigTitle>Timelapse Configuration</TimelapseConfigTitle>
              <TimelapseConfigDescription>
                Generate a timelapse video from your camera recordings. Select the time range and interval below.
              </TimelapseConfigDescription>
            </TimelapseConfigHeader>

            {/* Scheduled Timelapse Section */}
            {scheduledTimelapse.isScheduled && (
              <TimelapseSection style={{
                background: 'rgba(255, 193, 7, 0.1)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #FFC107',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <SpinnerIcon style={{ animation: 'spin 1s linear infinite' }}>
                      <MdSchedule style={{ fontSize: '24px', color: '#FFC107' }} />
                    </SpinnerIcon>
                    <div>
                      <TimelapseLabel style={{ marginBottom: '4px', color: '#FFC107' }}>
                        Scheduled - Starts in {scheduledTimelapse.countdown}
                      </TimelapseLabel>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Will capture every {timelapseConfig.interval}s starting at{' '}
                        {new Date(scheduledTimelapse.scheduledStart).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <CancelButton onClick={toggleRecording}>
                    Cancel Schedule
                  </CancelButton>
                </div>
              </TimelapseSection>
            )}

            {/* Recording Status */}
            <TimelapseSection style={{
              background: isRecording ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              padding: '16px',
              borderRadius: '8px',
              border: isRecording ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '16px',
              opacity: scheduledTimelapse.isScheduled ? 0.5 : 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <TimelapseLabel style={{ marginBottom: '4px' }}>
                    {isRecording ? '🔴 Recording Active' : '⚪ Recording Stopped'}
                  </TimelapseLabel>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {isRecording
                      ? `Capturing every ${timelapseConfig.interval}s • Images: ${recordingStatus.imageCount}`
                      : scheduledTimelapse.isScheduled
                        ? 'Schedule is active - use Cancel above to stop'
                      : 'Click Start to begin capturing images'
                    }
                  </div>
                  {isRecording && nextTimelapseCountdown && (
                    <NextCaptureInfo>
                      Next image in {nextTimelapseCountdown}
                    </NextCaptureInfo>
                  )}
                </div>
                <RecordButton
                  $isRecording={isRecording}
                  onClick={toggleRecording}
                  disabled={scheduledTimelapse.isScheduled && !isRecording}
                  style={{
                    opacity: scheduledTimelapse.isScheduled && !isRecording ? 0.5 : 1,
                    cursor: scheduledTimelapse.isScheduled && !isRecording ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </RecordButton>
              </div>
            </TimelapseSection>

            {/* Date Range Grid */}
            <TimelapseConfigGrid>
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
            </TimelapseConfigGrid>

            {/* Capture Interval */}
            <TimelapseSection>
              <TimelapseLabel>Capture Interval</TimelapseLabel>
              <TimelapseSelect
                value={timelapseConfig.interval}
                onChange={(e) => handleTimelapseChange('interval', e.target.value)}
              >
                <option value="30">30 seconds, only for testing</option>
                <option value="60">1 minute, only for testing</option>
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
                <option value="900">15 minutes, recommended</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hour</option>
                <option value="10800">3 hour</option>
                <option value="14400">4 hour</option>
              </TimelapseSelect>
            </TimelapseSection>

            {/* Output Format */}
            <TimelapseSection>
              <TimelapseLabel>Output Format</TimelapseLabel>
              <TimelapseSelect
                value={timelapseConfig.format}
                onChange={(e) => handleTimelapseChange('format', e.target.value)}
              >
                <option value="mp4">MP4 Video (experimental)</option>
                <option value="zip">ZIP of Images (recommended)</option>
              </TimelapseSelect>
            </TimelapseSection>

            {/* Performance Warning Banner */}
            <TimelapsePerformanceWarning>
              <WarningIcon>
                <MdWarning />
              </WarningIcon>
              <WarningContent>
                <WarningTitle>Performance & Storage Advisory</WarningTitle>
                <WarningMessage>
                  Generating MP4 videos on the device can be <WarningHighlight>very slow</WarningHighlight> depending on your hardware. For faster downloads, consider using <WarningHighlight>ZIP format</WarningHighlight> instead, which packages raw images without processing.
                </WarningMessage>
                <WarningMessage>
                  Using <WarningHighlight>short intervals</WarningHighlight> (e.g., less than 5 minutes) can result in <WarningHighlight>unnecessarily large storage requirements</WarningHighlight>. Consider using intervals of 10-30 minutes for a good balance between detail and storage.
                </WarningMessage>
              </WarningContent>
            </TimelapsePerformanceWarning>

            {/* Download Button */}
            <DownloadButton
              onClick={handleTimelapseDownload}
              disabled={isGeneratingTimelapse || !timelapseConfig.startDate || !timelapseConfig.endDate}
              style={{ marginTop: '12px' }}
            >
              {isGeneratingTimelapse ? 'Generating...' : 'Download Timelapse'}
            </DownloadButton>

            {/* Progress Section */}
            {timelapseProgress.active && (
              <ProgressSection>
                {timelapseProgress.status === 'error' ? (
                  <>
                    <ProgressHeader>
                      <ErrorIcon>
                        <MdOutlineErrorOutline />
                      </ErrorIcon>
                      <ProgressTitle>Generation Failed</ProgressTitle>
                    </ProgressHeader>
                    <ErrorMessage>
                      {timelapseProgress.error}
                    </ErrorMessage>
                  </>
                ) : timelapseProgress.status === 'complete' ? (
                  <>
                    <ProgressHeader>
                      <CompleteIcon>✓</CompleteIcon>
                      <ProgressTitle>Complete!</ProgressTitle>
                    </ProgressHeader>
                    <CompleteMessage>
                      Timelapse downloaded successfully
                    </CompleteMessage>
                  </>
                ) : (
                  <>
                    <ProgressHeader>
                      <VideoIcon>📹</VideoIcon>
                      <ProgressTitle>Generating Timelapse</ProgressTitle>
                    </ProgressHeader>
                    <ProgressBarContainer>
                      <ProgressBarFill percent={timelapseProgress.percent}>
                        <ProgressGlow />
                      </ProgressBarFill>
                      <ProgressPercent>{timelapseProgress.percent}%</ProgressPercent>
                    </ProgressBarContainer>
                    <ProgressMeta>
                      <span>Format: {timelapseConfig.format.toUpperCase()}</span>
                    </ProgressMeta>
                  </>
                )}
              </ProgressSection>
            )}
          </TimelapseConfigSection>

          {/* Daily Snapshot Section - unchanged */}
          <DailySnapshotSection>
            <DailySnapshotHeader>
              <DailySnapshotTitle>Daily Snapshot Settings</DailySnapshotTitle>
              <DailySnapshotDescription>
                Automatically capture a photo every day at the specified time for tracking plant growth
              </DailySnapshotDescription>
            </DailySnapshotHeader>
            <DailySnapshotControls>
              <ToggleWrapper>
                <ToggleLabel>
                  <ToggleSwitch
                    type="checkbox"
                    checked={timelapseConfig.dailySnapshotEnabled}
                    onChange={(e) => handleTimelapseChange('dailySnapshotEnabled', e.target.checked)}
                  />
                  <ToggleSlider />
                </ToggleLabel>
                <ToggleText>Enable Daily Snapshots</ToggleText>
              </ToggleWrapper>
              <TimeInputWrapper>
                <TimeInputLabel>Snapshot Time</TimeInputLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TimeInput
                  type="time"
                  value={timelapseConfig.dailySnapshotTime}
                  onChange={(e) => handleTimelapseChange('dailySnapshotTime', e.target.value)}
                  disabled={!timelapseConfig.dailySnapshotEnabled}
                />
                  {nextDailySnapshot && (
                    <CountdownBadge $disabled={!timelapseConfig.dailySnapshotEnabled}>
                      {timelapseConfig.dailySnapshotEnabled ? `Next: ${nextDailySnapshot}` : 'Disabled'}
                    </CountdownBadge>
                  )}
                </div>
              </TimeInputWrapper>
            </DailySnapshotControls>
          </DailySnapshotSection>

          {/* Storage Management - unchanged */}
          <StorageManagementSection>
            <StorageManagementHeader>
              <StorageManagementTitle>Storage Management</StorageManagementTitle>
              <StorageManagementDescription>
                Manage your daily photo storage - download photos as a ZIP archive or delete all daily photos
              </StorageManagementDescription>
            </StorageManagementHeader>

            {/* Date Range Filter */}
            <DateRangeFilter>
              <DateRangeLabel>Filter by Date Range (Optional)</DateRangeLabel>
              <DateRangeInputs>
                <DateInputWrapper>
                  <DateInputLabel>From Date</DateInputLabel>
                  <DateInput
                    type="date"
                    value={zipDateRange.startDate}
                    onChange={(e) => setZipDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </DateInputWrapper>
                <DateInputWrapper>
                  <DateInputLabel>To Date</DateInputLabel>
                  <DateInput
                    type="date"
                    value={zipDateRange.endDate}
                    onChange={(e) => setZipDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </DateInputWrapper>
              </DateRangeInputs>
              <DateRangeHint>
                {(() => {
                  const filteredCount = dailyPhotos.filter(photo => {
                    if (!zipDateRange.startDate && !zipDateRange.endDate) return true;
                    const photoDate = new Date(photo.date);
                    const startDate = zipDateRange.startDate ? new Date(zipDateRange.startDate) : null;
                    const endDate = zipDateRange.endDate ? new Date(zipDateRange.endDate) : null;
                    if (startDate && photoDate < startDate) return false;
                    if (endDate && photoDate > endDate) return false;
                    return true;
                  }).length;
                  const hasFilter = zipDateRange.startDate || zipDateRange.endDate;
                  return hasFilter
                    ? `${filteredCount} of ${dailyPhotos.length} photos selected`
                    : `All ${dailyPhotos.length} photos will be downloaded`;
                })()}
              </DateRangeHint>
            </DateRangeFilter>

            <StorageManagementControls>
              <StorageButton
                $variant="download"
                onClick={handleDownloadZip}
                disabled={isDownloadingZip || dailyPhotos.length === 0}
              >
                {isDownloadingZip ? (
                  <>
                    <DownloadingSpinner />
                    Generating ZIP...
                  </>
                ) : (
                  <>
                    <MdDownload />
                    Download Daily as ZIP
                  </>
                )}
              </StorageButton>
              <StorageButton
                $variant="delete"
                onClick={handleDeleteAllDaily}
                disabled={isDeletingAllDaily || dailyPhotos.length === 0}
              >
                {isDeletingAllDaily ? (
                  <>
                    <DeletingSpinner />
                    Deleting...
                  </>
                ) : (
                  <>
                    <MdDeleteSweep />
                    Delete All Daily Photos
                  </>
                )}
              </StorageButton>
              <StorageButton
                $variant="delete"
                onClick={handleDeleteAllTimelapse}
                disabled={isDeletingAllTimelapse}
              >
                {isDeletingAllTimelapse ? (
                  <>
                    <DeletingSpinner />
                    Deleting...
                  </>
                ) : (
                  <>
                    <MdDeleteSweep />
                    Delete All Timelapse Photos
                  </>
                )}
              </StorageButton>
              <StorageButton
                $variant="delete"
                onClick={handleDeleteTimelapseOutput}
                disabled={isDeletingTimelapseOutput}
              >
                {isDeletingTimelapseOutput ? (
                  <>
                    <DeletingSpinner />
                    Deleting...
                  </>
                ) : (
                  <>
                    <MdDeleteSweep />
                    Delete All Timelapse Output
                  </>
                )}
              </StorageButton>
            </StorageManagementControls>
            <StorageInfo>
              <span>{dailyPhotos.length} daily photos stored</span>
            </StorageInfo>
          </StorageManagementSection>
        </TimelapseContainer>
      )}
    </CameraContainer>
  );
};

export default CameraCard;


const CameraContainer = styled.div`
  background: var(--main-bg-card-color);
  box-shadow: var(--main-shadow-art);
  backdrop-filter: blur(20px);
  border-radius: 25px;
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
  background: var(--main-bg-card-color);
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
  background: var(--main-bg-card-color);
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

const SpinnerIcon = styled.div`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: #FFC107;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #FFB300;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TimelapseConfigSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  box-shadow: var(--main-shadow-art);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TimelapseConfigHeader = styled.div`
  margin-bottom: 16px;
`;

const TimelapseConfigTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const TimelapseConfigDescription = styled.p`
  font-size: 12px;
  opacity: 0.6;
  line-height: 1.4;
`;

const TimelapseConfigGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;

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
  background: var(--main-bg-card-color);
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

const DailyViewWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0; /* Padding entfernt, damit es randlos ist */
  background: transparent; /* "background: #000" entfernt */
  overflow: hidden;
  position: relative;
`;

const DailyPhotoContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* max-width: 900px;  <-- Entfernt, damit es die volle Breite nutzt */
  gap: 0;
`;

const PhotoDisplayArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  overflow: hidden;
`;

const DailyPhotoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain; /* Damit das ganze Bild sichtbar bleibt */
  display: block;
  /* max-height: 500px; <-- Entfernt, damit es den Container füllt */
`;

const PhotoOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent 20%);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${PhotoDisplayArea}:hover & {
    opacity: 1;
  }
`;

const PhotoDate = styled.span`
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
`;

const DeleteButton = styled.button`
  background: rgba(244, 67, 54, 0.7);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;

  &:hover {
    background: rgba(244, 67, 54, 1);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    font-size: 20px;
  }
`;

const NavButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--main-text-color);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    font-size: 24px;
  }
`;

const DailyEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 40px;
  text-align: center;
  color: var(--placeholder-text-color);

  svg {
    font-size: 64px;
    opacity: 0.3;
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
    opacity: 0.7;
    max-width: 400px;
  }
`;

const DailyLoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const DailyInfo = styled.div`
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: var(--main-text-color);
  font-size: 18px;
  opacity: 0.7;
`;

const DailySnapshotSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  box-shadow: var(--main-shadow-art);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DailySnapshotHeader = styled.div`
  margin-bottom: 16px;
`;

const DailySnapshotTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--main-text-color);
  margin-bottom: 4px;
`;

const DailySnapshotDescription = styled.div`
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.6;
  line-height: 1.4;
`;

const DailySnapshotControls = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
`;

const ToggleSwitch = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + & {
    background-color: var(--primary-accent);
  }

  input:checked + &:before {
    transform: translateX(20px);
  }

  input:focus + & {
    box-shadow: 0 0 1px var(--primary-accent);
  }
`;

const ToggleText = styled.span`
  font-size: 13px;
  color: var(--main-text-color);
  font-weight: 500;
`;

const TimeInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TimeInputLabel = styled.label`
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.7;
  font-weight: 500;
`;

const TimeInput = styled.input`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: var(--main-text-color);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: var(--primary-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CountdownBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => props.$disabled
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(33, 150, 243, 0.1)'};
  border: 1px solid ${props => props.$disabled
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(33, 150, 243, 0.3)'};
  border-radius: 4px;
  font-size: 14px;
  color: ${props => props.$disabled
    ? 'var(--placeholder-text-color)'
    : '#2196F3'};
  margin-left: 8px;
  white-space: nowrap;
`;

const NextCaptureInfo = styled.div`
  font-size: 11px;
  color: #2196F3;
  margin-top: 4px;
  opacity: 0.8;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  min-width: 140px;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:focus:not(:disabled) {
    border-color: var(--primary-accent);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* For Webkit browsers like Chrome, Safari */
  &::-webkit-calendar-picker-indicator {
    filter: brightness(0) invert(1);
    opacity: 1;
    cursor: pointer;
  }

  &:disabled::-webkit-calendar-picker-indicator {
    cursor: not-allowed;
  }
`;

const StorageManagementSection = styled.div`
  background: --primary-accent;
  box-shadow: var(--main-shadow-art);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid --primary-accent;
`;

const StorageManagementHeader = styled.div`
  margin-bottom: 16px;
`;

const StorageManagementTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--main-text-color);
  margin-bottom: 4px;
`;

const StorageManagementDescription = styled.div`
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.6;
  line-height: 1.4;
`;

const StorageManagementControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
  }
`;

const StorageButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: ${props => props.$variant === 'delete' ? 'rgba(244, 67, 54, 0.8)' : 'rgba(33, 150, 243, 0.8)'};
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  justify-content: center;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    background: ${props => props.$variant === 'delete' ? 'rgba(244, 67, 54, 1)' : 'rgba(33, 150, 243, 1)'};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    font-size: 18px;
  }
`;

const DeletingSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const DownloadingSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StorageInfo = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.6;
`;

const DateRangeFilter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin-bottom: 12px;
`;

const DateRangeLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--main-text-color);
  opacity: 0.8;
`;

const DateRangeInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DateInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DateInputLabel = styled.label`
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.7;
  font-weight: 500;
`;

const DateInput = styled.input`
  padding: 8px 12px;
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

  /* For Webkit browsers like Chrome, Safari */
  &::-webkit-calendar-picker-indicator {
    filter: brightness(0) invert(1);
    opacity: 1;
    cursor: pointer;
  }
`;

const DateRangeHint = styled.div`
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.7;
  font-style: italic;
`;

const CaptureFailureNotification = styled.div`
  position: absolute;
  top: 80px;
  left: 16px;
  right: 16px;
  z-index: 100;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    top: 70px;
    left: 8px;
    right: 8px;
  }
`;

const NotificationContent = styled.div`
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(198, 40, 40, 0.15) 100%);
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(244, 67, 54, 0.2);
  position: relative;
`;

const NotificationIcon = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(244, 67, 54, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f44336;
  font-size: 20px;

  svg {
    font-size: 20px;
  }
`;

const NotificationMessage = styled.div`
  margin-left: 44px;
  padding-right: 80px;
`;

const NotificationTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffcdd2;
  margin-bottom: 4px;
`;

const NotificationError = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
  line-height: 1.4;
`;

const NotificationRetryCount = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  margin-left: 44px;
`;

const RetryButton = styled.button`
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  background: rgba(244, 67, 54, 0.8);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: rgba(244, 67, 54, 1);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DismissButton = styled.button`
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const DismissIconButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
  }
`;

const TimelapsePerformanceWarning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-top: 12px;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.12) 0%, rgba(255, 152, 0, 0.12) 100%);
  border: 1px solid rgba(255, 193, 7, 0.4);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(255, 193, 7, 0.15);
`;

const WarningIcon = styled.div`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 193, 7, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffc107;
  font-size: 18px;

  svg {
    font-size: 18px;
  }
`;

const WarningContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const WarningTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #ffe082;
  margin-bottom: 4px;
`;

const WarningMessage = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
`;

const WarningHighlight = styled.span`
  color: #ffb74d;
  font-weight: 500;
`;

const ProgressSection = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const VideoIcon = styled.div`
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CompleteIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(76, 175, 80, 0.3);
  color: #81c784;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
`;

const ErrorIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(244, 67, 54, 0.3);
  color: #ef5350;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const ProgressTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--main-text-color);
`;

const ProgressBarContainer = styled.div`
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.percent}%;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  border-radius: 12px;
  transition: width 0.3s ease-out;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const ProgressGlow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  filter: blur(8px);
  opacity: 0.5;
`;

const ProgressPercent = styled.div`
  position: absolute;
  width: 100%;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 1;
  line-height: 24px;
`;

const ProgressMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 6px;
  color: #ffcdd2;
  font-size: 13px;
  line-height: 1.4;
`;

const CompleteMessage = styled.div`
  padding: 12px;
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.4);
  border-radius: 6px;
  color: #c8e6c9;
  font-size: 13px;
  line-height: 1.4;
`;


