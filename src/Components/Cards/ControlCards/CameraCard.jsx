import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { MdVideocam, MdVideocamOff, MdOutlineErrorOutline, MdChevronLeft, MdChevronRight, MdDelete, MdDownload, MdDeleteSweep, MdWarning, MdSchedule, MdNightlight, MdInfo, MdFolderOpen, MdImage, MdMovie } from 'react-icons/md';
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
    interval: '900',
    format: 'zip',
    dailySnapshotEnabled: false,
    dailySnapshotTime: '09:00',
    captureAtNight: false
  });
  const [isGeneratingTimelapse, setIsGeneratingTimelapse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState({
    active: false,
    imageCount: 0,
    startTime: null,
  });
  const [nightMode, setNightMode] = useState({
    isNight: false,
    captureAtNight: false
  });
  const [scheduledTimelapse, setScheduledTimelapse] = useState({
    isScheduled: false,
    scheduledStart: null,      // ISO string
    scheduledEnd: null,        // ISO string
    countdown: '',             // Human-readable countdown
  });
  const [dailyPhotos, setDailyPhotos] = useState([]);
  const [timelapsePhotos, setTimelapsePhotos] = useState([]);
  const [timelapseOutputs, setTimelapseOutputs] = useState([]);
  const [timelapseOutputCounts, setTimelapseOutputCounts] = useState({ mp4: 0, zip: 0 });
  const [totalTimelapseCount, setTotalTimelapseCount] = useState(0); // Total stored timelapse images
  const [currentPhotoDate, setCurrentPhotoDate] = useState(null);
  const [dailyViewLoading, setDailyViewLoading] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null); // Blob URL for current daily photo
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' }); // Modal state
  const [isDeletingAllDaily, setIsDeletingAllDaily] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  
  // Helper to format date as YYYY-MM-DD
  const formatDateOnly = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  // Initialize default dates for storage management (previous week to next week)
  const now = new Date();
  const previousWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const [zipDateRange, setZipDateRange] = useState({
    startDate: formatDateOnly(previousWeek),
    endDate: formatDateOnly(nextWeek)
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
  const [timelapseConfigHydrated, setTimelapseConfigHydrated] = useState(false);

  // Refs to store current values for event handlers (prevents stale closure issues)
  const selectedCameraRef = useRef(selectedCamera);
  const currentPhotoDateRef = useRef(currentPhotoDate);
  const timelapseConfigRef = useRef(timelapseConfig);
  const imageCountRef = useRef(recordingStatus.imageCount);
  const toggleLockRef = useRef(false); // Prevent multiple toggle calls
  // Update refs when state changes (combined into single effect)
  useEffect(() => {
    selectedCameraRef.current = selectedCamera;
    currentPhotoDateRef.current = currentPhotoDate;
    timelapseConfigRef.current = timelapseConfig;
    imageCountRef.current = recordingStatus.imageCount;
  }, [selectedCamera, currentPhotoDate, timelapseConfig, recordingStatus.imageCount]);

  useEffect(() => {
    const mp4 = timelapseOutputs.filter(file => file.format === 'mp4').length;
    const zip = timelapseOutputs.filter(file => file.format === 'zip').length;
    setTimelapseOutputCounts({ mp4, zip });
  }, [timelapseOutputs]);

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

  const normalizeCameraId = (id) => {
    if (!id) return '';
    const raw = String(id).trim().toLowerCase();
    return raw.startsWith('camera.') ? raw.slice(7) : raw;
  };

  const isSameCamera = (a, b) => normalizeCameraId(a) === normalizeCameraId(b);

  const normalizeDownloadUrl = (rawUrl) => {
    if (!rawUrl) return rawUrl;
    try {
      const parsed = new URL(rawUrl, window.location.origin);

      if (
        window.location.protocol === 'https:' &&
        parsed.protocol === 'http:' &&
        parsed.host === window.location.host
      ) {
        return `https://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      return parsed.toString();
    } catch {
      return rawUrl;
    }
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const buildTimelapseDownloadTarget = (data, cameraEntity, roomName) => {
    if (!data) return null;

    const format = (data.format || '').toLowerCase();
    const extension = format === 'mp4' ? 'mp4' : 'zip';
    const filename = data.filename || `timelapse_${cameraEntity}_${Date.now()}.${extension}`;

    if (data.download_url) {
      return { method: 'url', download_url: data.download_url, filename, format: format || extension };
    }

    if (data.filename) {
      return {
        method: 'url',
        download_url: `/local/ogb_data/${roomName}_img/timelapse_output/${data.filename}`,
        filename: data.filename,
        format: format || extension,
      };
    }

    return null;
  };

  const triggerTimelapseDownload = (downloadTarget) => {
    if (!downloadTarget) return false;

    if (downloadTarget.method === 'url' && downloadTarget.download_url) {
      const link = document.createElement('a');
      link.href = normalizeDownloadUrl(downloadTarget.download_url);
      link.setAttribute('download', downloadTarget.filename || `timelapse_${Date.now()}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    return false;
  };

  const getProgressStatusLabel = (status) => {
    switch (status) {
      case 'scanning':
        return 'Scanning images';
      case 'preparing':
        return 'Preparing files';
      case 'creating_zip':
        return 'Creating ZIP archive';
      case 'encoding_video':
        return 'Encoding MP4 video';
      case 'complete':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Working';
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


  // Initialize default dates for timelapse (today)
  useEffect(() => {
    if (timelapseConfigHydrated) return;
    if (timelapseConfig.startDate || timelapseConfig.endDate) return;

    const now = new Date();
    
    const formatDateTimeLocal = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setTimelapseConfig(prev => ({
      ...prev,
      endDate: formatDateTimeLocal(now),
      startDate: formatDateTimeLocal(now)
    }));
  }, [timelapseConfigHydrated, timelapseConfig.startDate, timelapseConfig.endDate]);

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
      const nextCapture = lastTimelapseCapture.getTime() + intervalMs;
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
    }
    // Note: We no longer set lastTimelapseCapture to Date.now() here
    // Instead, we rely on the CameraRecordingStatus event from the backend
    // which provides the accurate last_capture_time timestamp
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
    setTimelapseConfigHydrated(false);
    setLastTimelapseCapture(null);
    setNextTimelapseCountdown('');
    setNextDailySnapshot(null);
  }, [selectedCamera, currentRoom]);

  // Request timelapse status IMMEDIATELY on mount (for header info display in all tabs)
  useEffect(() => {
    if (!connection || !selectedCamera) return;

    const requestTimelapseStatus = async () => {
      try {
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_timelapse_status',
          event_data: {
            device_name: selectedCamera,
          },
        });
        console.log('Requested timelapse status for header info:', selectedCamera);
      } catch (err) {
        console.error('Failed to request timelapse status:', err);
      }
    };

    requestTimelapseStatus();
  }, [connection, selectedCamera]);

  // Request timelapse config from backend so header status stays accurate
  useEffect(() => {
    if (!connection || !selectedCamera) return;

    const requestTimelapseConfig = async () => {
      try {
        // Request config (needed for daily snapshot header visibility/countdown)
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
  }, [connection, selectedCamera]);

  // Subscribe to daily photo events from backend (ALWAYS load, regardless of active tab)
  useEffect(() => {
    if (!connection || !selectedCamera) return;

    const unsubscribeFunctions = [];
    let isMounted = true; // Track if component is mounted

    const setupDailyListeners = async () => {
      try {
        // Listen for daily photos list response
        const unsubPhotos = await connection.subscribeEvents(
          async (event) => {
            const data = event.data;
            const currentSelectedCamera = selectedCameraRef.current;
            const selectedPhotoDate = currentPhotoDateRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              console.log('Received daily photos list:', data.photos);
              setDailyPhotos(data.photos || []);
              setDailyViewLoading(false);
              // Select most recent photo if none selected
              if (data.photos && data.photos.length > 0 && !selectedPhotoDate) {
                setCurrentPhotoDate(data.photos[0].date);
              }
            }
          },
          'DailyPhotosResponse'
        );
        unsubscribeFunctions.push(unsubPhotos);

        // Request daily photos immediately when component mounts
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_daily_photos',
          event_data: {
            device_name: selectedCamera,
          },
        });
        console.log('Requested daily photos for header info:', selectedCamera);

        // Listen for timelapse photos response FIRST (before sending request)
        const unsubTimelapsePhotos = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              console.log('Received timelapse photos response:', data.total_count, 'photos');
              // Set timelapse photos list and total count
              setTimelapsePhotos(data.photos || []);
              setTotalTimelapseCount(data.total_count || 0);
              setTimelapseOutputs(data.output_files || []);
              setTimelapseOutputCounts(data.output_counts || { mp4: 0, zip: 0 });
            }
          },
          'TimelapsePhotosResponse'
        );
        unsubscribeFunctions.push(unsubTimelapsePhotos);

        // Request timelapse photos for header info
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_timelapse_photos',
          event_data: {
            device_name: selectedCamera,
          },
        });
        console.log('Requested timelapse photos for header info:', selectedCamera);

        // Listen for CameraRecordingStatus events from backend
        const unsubRecordingStatus = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            const matchesSelectedCamera = data.camera_entity
              ? isSameCamera(data.camera_entity, currentSelectedCamera)
              : data.room === currentRoom;

            if (matchesSelectedCamera) {
              console.log('Received CameraRecordingStatus:', data);
              
              // Only update isRecording if data.is_recording is explicitly set (not undefined/null)
              // This prevents unconditionally resetting to false when data is incomplete
              if (data.is_recording !== undefined) {
                setIsRecording(data.is_recording);
              }
              
              // Always update recordingStatus with latest data
              setRecordingStatus(prev => ({
                ...prev,
                active: data.is_recording !== undefined ? data.is_recording : prev.active,
                imageCount: data.image_count ?? prev.imageCount,
                startTime: data.start_time ?? prev.startTime,
              }));

              if (data.image_count !== undefined && data.image_count !== null) {
                setTotalTimelapseCount(prev => Math.max(prev, data.image_count));
              }
              
              // Update night mode state
              setNightMode({
                isNight: data.is_night_mode || false,
                captureAtNight: data.capture_at_night_enabled || false,
              });
              
              // Update scheduled state if present
              if (data.is_scheduled) {
                setScheduledTimelapse({
                  isScheduled: true,
                  scheduledStart: data.scheduled_start,
                  scheduledEnd: data.scheduled_end,
                  countdown: '',
                });
              } else if (!data.is_recording) {
                // Clear scheduled state when not recording
                setScheduledTimelapse(prev => ({
                  ...prev,
                  isScheduled: false,
                }));
              }
              
              // Update last capture time for countdown
              if (data.last_capture_time) {
                setLastTimelapseCapture(new Date(data.last_capture_time));
              }
            }
          },
          'CameraRecordingStatus'
        );
        unsubscribeFunctions.push(unsubRecordingStatus);

        // Listen for timelapse errors
        const unsubTimelapseError = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return;
            console.error('Timelapse error:', data.message);
            setModal({
              show: true,
              title: 'Timelapse Error',
              message: data.message || 'An unknown error occurred',
              type: 'error'
            });
          },
          'TimelapseError'
        );
        unsubscribeFunctions.push(unsubTimelapseError);

        // Listen for timelapse completed event (natural completion, not user stop)
        const unsubTimelapseCompleted = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.device_name, currentSelectedCamera) || isSameCamera(data.device, currentSelectedCamera)) {
              console.log('Timelapse completed:', data);
              setIsRecording(false);
              setRecordingStatus(prev => ({ ...prev, active: false }));
              
              // Only show success modal for natural completion (user_initiated === false)
              // Don't show modal when user manually stops
              if (data.user_initiated === false) {
                setModal({
                  show: true,
                  title: 'Timelapse Completed',
                  message: `Recording finished with ${data.total_images} images captured. Duration: ${data.duration?.toFixed(1) || 'N/A'}s`,
                  type: 'success'
                });
              }
            }
          },
          'TimelapseCompleted'
        );
        unsubscribeFunctions.push(unsubTimelapseCompleted);

        // Listen for timelapse config response from backend
        const unsubConfig = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.device_name, currentSelectedCamera) || isSameCamera(data.camera_entity, currentSelectedCamera)) {
              console.log('Received timelapse config response:', data.current_config);
              const cfg = data.current_config || {};
              setTimelapseConfigHydrated(true);
              
              // Smart UX: Auto-fill dates if not set
              const now = new Date();
              const oneMonthLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // Now + 1 month
              
              const receivedStartDate = cfg.StartDate || cfg.startDate || '';
              const receivedEndDate = cfg.EndDate || cfg.endDate || '';
              
              // If dates are empty, provide sensible defaults (now to now + 1 month)
              if (!receivedStartDate || receivedStartDate === '') {
                const startDateLocal = fromUtcISO(now.toISOString());
                const endDateLocal = fromUtcISO(oneMonthLater.toISOString());

                console.log('Auto-filling dates:', { startDate: startDateLocal, endDate: endDateLocal });

                setTimelapseConfig(prev => ({
                  ...prev,
                  startDate: prev.startDate || startDateLocal,
                  endDate: prev.endDate || endDateLocal,
                  interval: String(cfg.interval ?? cfg.TimeLapseIntervall ?? prev.interval ?? '900'),
                  format: cfg.OutPutFormat || cfg.format || prev.format || 'mp4',
                  dailySnapshotEnabled: cfg.daily_snapshot_enabled ?? prev.dailySnapshotEnabled,
                  dailySnapshotTime: cfg.daily_snapshot_time || prev.dailySnapshotTime || '09:00',
                  captureAtNight: cfg.capture_at_night ?? prev.captureAtNight,
                }));
              } else {
                // Use backend dates if provided
                setTimelapseConfig(prev => ({
                  ...prev,
                  startDate: fromUtcISO(receivedStartDate),
                  endDate: fromUtcISO(receivedEndDate),
                  interval: String(cfg.interval ?? cfg.TimeLapseIntervall ?? prev.interval ?? '900'),
                  format: cfg.OutPutFormat || cfg.format || prev.format || 'mp4',
                  dailySnapshotEnabled: cfg.daily_snapshot_enabled ?? prev.dailySnapshotEnabled,
                  dailySnapshotTime: cfg.daily_snapshot_time || prev.dailySnapshotTime || '09:00',
                  captureAtNight: cfg.capture_at_night ?? prev.captureAtNight,
                }));
              }
            }
          },
          'TimelapseConfigResponse'
        );
        unsubscribeFunctions.push(unsubConfig);

        // Request config again AFTER listeners are active (prevents missed initial response race)
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_timelapse_config',
          event_data: {
            device_name: selectedCameraRef.current,
          },
        });

        // Listen for timelapse generation started event
        const unsubGenerationStarted = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.device_name, currentSelectedCamera)) {
              console.log('Timelapse generation started:', data);
              setIsGeneratingTimelapse(true);
              setTimelapseProgress({
                active: true,
                percent: 0,
                status: 'generating',
                error: null,
                fileCount: data.frame_count || 0,
                estimatedTime: null,
                estimatedSpace: null
              });
            }
          },
          'TimelapseGenerationStarted'
        );
        unsubscribeFunctions.push(unsubGenerationStarted);

        // Listen for timelapse generation progress event
        const unsubGenerationProgress = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.device_name, currentSelectedCamera)) {
              console.log('Timelapse generation progress:', data.progress);
              setTimelapseProgress(prev => ({
                active: true,
                percent: Math.max(prev.percent || 0, data.progress || 0),
                status: data.status || prev.status || 'encoding_video',
                error: null,
                fileCount: data.file_count ?? prev.fileCount ?? 0,
                estimatedTime: data.estimated_time || prev.estimatedTime || null,
                estimatedSpace: data.estimated_space || prev.estimatedSpace || null
              }));
            }
          },
          'TimelapseGenerationProgress'
        );
        unsubscribeFunctions.push(unsubGenerationProgress);

        // Listen for timelapse generation complete event
        const unsubGenerationComplete = await connection.subscribeEvents(
          async (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.device_name, currentSelectedCamera)) {
              console.log('Timelapse generation complete:', data);
              setIsGeneratingTimelapse(false);

              if (!data.success) {
                setTimelapseProgress({
                  active: false,
                  percent: 0,
                  status: 'error',
                  error: data.error || 'Unknown error',
                  fileCount: 0,
                  estimatedTime: null,
                  estimatedSpace: null
                });
                setModal({
                  show: true,
                  title: 'Timelapse Generation Failed',
                  message: data.error || 'Unknown error',
                  type: 'error'
                });
                return;
              }

              setTimelapseProgress({
                active: true,
                percent: 100,
                status: 'complete',
                error: null,
                fileCount: data.frame_count || 0,
                estimatedTime: null,
                estimatedSpace: null
              });

              const downloadTarget = buildTimelapseDownloadTarget(data, currentSelectedCamera, currentRoom);
              if (downloadTarget) {
                const started = triggerTimelapseDownload(downloadTarget);
                if (!started) {
                  console.warn('Auto-download could not be started; use output list to re-download');
                }
              }

              const fileSizeMb = typeof data.file_size === 'number'
                ? `${(data.file_size / (1024 * 1024)).toFixed(2)} MB`
                : 'Unknown size';

              console.log('Timelapse generated successfully:', {
                format: (data.format || 'zip').toUpperCase(),
                frames: data.frame_count || 0,
                size: fileSizeMb,
              });

              if (data.success && data.filename) {
                const resolvedFormat = (data.format || data.filename.split('.').pop() || '').toLowerCase();
                const resolvedUrl = data.download_url || `/local/ogb_data/${currentRoom}_img/timelapse_output/${data.filename}`;

                setTimelapseOutputs(prev => {
                  const withoutExisting = prev.filter(file => file.filename !== data.filename);
                  return [{
                    filename: data.filename,
                    format: resolvedFormat,
                    size: data.file_size || 0,
                    download_url: resolvedUrl,
                  }, ...withoutExisting];
                });
              }

              try {
                await connection.sendMessagePromise({
                  type: 'fire_event',
                  event_type: 'opengrowbox_get_timelapse_photos',
                  event_data: {
                    device_name: currentSelectedCamera,
                  },
                });
              } catch (err) {
                console.error('Failed to refresh timelapse storage after generation:', err);
              }
            }
          },
          'TimelapseGenerationComplete'
        );
        unsubscribeFunctions.push(unsubGenerationComplete);

        // Listen for individual daily photo response
        const unsubPhoto = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            // Use refs to get current values instead of stale closure values
            const currentSelectedCamera = selectedCameraRef.current;
            const currentPhotoDate = currentPhotoDateRef.current;

            if (isSameCamera(data.camera_entity, currentSelectedCamera) && data.date === currentPhotoDate) {
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
            const currentSelectedCamera = selectedCameraRef.current;
            const selectedPhotoDate = currentPhotoDateRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              console.log('Photo deleted:', data.date);
              // Remove deleted photo from list
              setDailyPhotos(prev => prev.filter(p => p.date !== data.date));
              // If current photo was deleted, select another
              if (selectedPhotoDate === data.date) {
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
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              console.log('All daily photos deleted:', data.deleted_count);
              setIsDeletingAllDaily(false);
              // Clear all state
              setDailyPhotos([]);
              setCurrentPhotoDate(null);
              setCurrentPhotoUrl(null);
              setModal({
                show: true,
                title: 'Daily Photos Deleted',
                message: `Successfully deleted ${data.deleted_count} daily photos.`,
                type: 'success'
              });
            }
          },
          'ogb_camera_all_daily_deleted'
        );
        unsubscribeFunctions.push(unsubAllDeleted);

        // Listen for newly captured daily snapshots and refresh list immediately
        const unsubDailyCaptured = await connection.subscribeEvents(
          async (event) => {
            const data = event.data;
            if (!isMounted) return;
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              try {
                await connection.sendMessagePromise({
                  type: 'fire_event',
                  event_type: 'opengrowbox_get_daily_photos',
                  event_data: {
                    device_name: currentSelectedCamera,
                  },
                });
              } catch (err) {
                console.error('Failed to refresh daily photos after capture:', err);
              }
            }
          },
          'ogb_camera_daily_photo_captured'
        );
        unsubscribeFunctions.push(unsubDailyCaptured);

        // Listen for ZIP download response
        const unsubZipDownload = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            if (!isMounted) return; // CRITICAL: Prevent download from orphaned subscription
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              setIsDownloadingZip(false);

              if (data.download_url) {
                const link = document.createElement('a');
                link.href = normalizeDownloadUrl(data.download_url);
                link.setAttribute('download', `daily_photos_${currentSelectedCamera}_${Date.now()}.zip`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                console.log('ZIP download started via URL:', data.download_url, `(${data.total_size} bytes)`);
              } else {
                setModal({
                  show: true,
                  title: 'ZIP Download Failed',
                  message: 'Failed to download ZIP: ' + (data.error || 'Unknown error'),
                  type: 'error'
                });
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
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
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
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              console.log('All timelapse photos deleted:', data.deleted_count);
              setIsDeletingAllTimelapse(false);
              setTotalTimelapseCount(0);
              setTimelapsePhotos([]);
              setModal({
                show: true,
                title: 'Timelapse Photos Deleted',
                message: `Successfully deleted ${data.deleted_count} timelapse photos.`,
                type: 'success'
              });
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
            const currentSelectedCamera = selectedCameraRef.current;
            if (isSameCamera(data.camera_entity, currentSelectedCamera)) {
              console.log('All timelapse output deleted:', data.deleted_count);
              setIsDeletingTimelapseOutput(false);
              setTimelapseOutputs([]);
              setTimelapseOutputCounts({ mp4: 0, zip: 0 });
              setModal({
                show: true,
                title: 'Timelapse Output Deleted',
                message: `Successfully deleted ${data.deleted_count} timelapse output files.`,
                type: 'success'
              });
            }
          },
          'ogb_camera_all_timelapse_output_deleted'
        );
        unsubscribeFunctions.push(unsubTimelapseOutputDeleted);

        // Re-request status after subscriptions are active to avoid race on page refresh
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_get_timelapse_status',
          event_data: {
            device_name: selectedCameraRef.current,
          },
        });
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
  }, [connection, selectedCamera, currentRoom]);

  // Fallback: re-request timelapse photos if count is 0 after mount
  useEffect(() => {
    if (!connection || !selectedCamera) return;
    let isMounted = true;
    
    // If timelapse count is still 0 after 2 seconds, retry request
    const timeout = setTimeout(async () => {
      if (totalTimelapseCount === 0 && isMounted) {
        console.log('Timelapse count still 0, retrying request...');
        try {
          await connection.sendMessagePromise({
            type: 'fire_event',
            event_type: 'opengrowbox_get_timelapse_photos',
            event_data: {
              device_name: selectedCamera,
            },
          });
        } catch (err) {
          console.error('Failed to retry timelapse photos request:', err);
        }
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [connection, selectedCamera, totalTimelapseCount]);

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
  const displayedTimelapseCount = isRecording
    ? Math.max(totalTimelapseCount, recordingStatus.imageCount || 0)
    : totalTimelapseCount;

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
      setModal({ show: true, title: 'No Older Photos', message: 'No older photos available.', type: 'info' });
    }
  };

  // Handle navigation to next day's photo
  const handleNextDay = () => {
    const currentIndex = dailyPhotos.findIndex(p => p.date === currentPhotoDate);
    if (currentIndex < dailyPhotos.length - 1) {
      const newPhoto = dailyPhotos[currentIndex + 1];
      setCurrentPhotoDate(newPhoto.date);
    } else {
      setModal({ show: true, title: 'No Newer Photos', message: 'No newer photos available.', type: 'info' });
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
      setModal({ show: true, title: 'Delete Failed', message: 'Failed to delete photo. Please try again.', type: 'error' });
    }
  };

  // Handle delete all daily photos
  const handleDeleteAllDaily = async () => {
    if (!selectedCamera || !connection) return;

    const photoCount = dailyPhotos.length;
    if (photoCount === 0) {
      setModal({ show: true, title: 'No Photos', message: 'No daily photos to delete.', type: 'info' });
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
      setModal({ show: true, title: 'Delete Failed', message: 'Failed to delete all daily photos. Please try again.', type: 'error' });
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
      setModal({ show: true, title: 'No Photos Found', message: 'No daily photos found in the selected date range.', type: 'info' });
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
      setModal({ show: true, title: 'Download Failed', message: 'Failed to download ZIP. Please try again.', type: 'error' });
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
      setModal({ show: true, title: 'Delete Failed', message: 'Failed to delete all timelapse photos. Please try again.', type: 'error' });
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
      setModal({ show: true, title: 'Delete Failed', message: 'Failed to delete all timelapse output files. Please try again.', type: 'error' });
    }
  };

  const handleRedownloadOutput = (outputFile) => {
    if (!outputFile || !outputFile.download_url) {
      setModal({
        show: true,
        title: 'Download Unavailable',
        message: 'This output file is missing a download URL.',
        type: 'error'
      });
      return;
    }

    const link = document.createElement('a');
    link.href = normalizeDownloadUrl(outputFile.download_url);
    link.setAttribute('download', outputFile.filename || `timelapse_output_${Date.now()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      setModal({ show: true, title: 'Retry Failed', message: 'Failed to trigger retry. Please try again.', type: 'error' });
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
    
    // Save changed field only to backend (prevents stale defaults overwriting persisted state)
    const activeCamera = selectedCameraRef.current;
    if (activeCamera && connection) {
      try {
        console.log('[CameraCard] Sending timelapse config change:', field, value);
        console.log('[CameraCard] Selected camera:', activeCamera);

        const fieldToPayload = {
          interval: { interval: String(newConfig.interval) },
          startDate: { startDate: toUtcISO(newConfig.startDate) },
          endDate: { endDate: toUtcISO(newConfig.endDate) },
          format: { format: newConfig.format },
          dailySnapshotEnabled: { daily_snapshot_enabled: newConfig.dailySnapshotEnabled },
          dailySnapshotTime: { daily_snapshot_time: newConfig.dailySnapshotTime },
          captureAtNight: { capture_at_night: newConfig.captureAtNight },
        };

        const configPayload = fieldToPayload[field] || {};
        if (Object.keys(configPayload).length === 0) {
          return;
        }
        
        const response = await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_save_timelapse_config',
          event_data: {
            device_name: activeCamera,
            config: configPayload,
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
      setModal({ show: true, title: 'Missing Dates', message: 'Please select start and end dates for the timelapse.', type: 'info' });
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
    // Prevent multiple simultaneous toggle calls
    if (toggleLockRef.current) {
      console.log('Toggle already in progress, ignoring');
      return;
    }
    
    if (!selectedCamera) return;

    try {
      toggleLockRef.current = true;
      
      if (isRecording || scheduledTimelapse.isScheduled) {
        // Stop timelapse immediately without confirmation
        // User can restart if needed
        
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

        console.log('Timelapse stop command sent successfully');
      } else {
        // Start recording: first persist current UI config so backend startTL reads valid ISO dates
        await connection.sendMessagePromise({
          type: 'fire_event',
          event_type: 'opengrowbox_save_timelapse_config',
          event_data: {
            device_name: selectedCamera,
            config: {
              interval: timelapseConfig.interval,
              startDate: toUtcISO(timelapseConfig.startDate),
              endDate: toUtcISO(timelapseConfig.endDate),
              format: timelapseConfig.format,
              daily_snapshot_enabled: timelapseConfig.dailySnapshotEnabled,
              daily_snapshot_time: timelapseConfig.dailySnapshotTime,
              capture_at_night: timelapseConfig.captureAtNight,
            },
          },
        });

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
      setModal({
        show: true,
        title: 'Recording Error',
        message: 'Failed to ' + (isRecording ? 'stop' : 'start') + ' recording.',
        type: 'error'
      });
    } finally {
      // Release lock after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        toggleLockRef.current = false;
      }, 1000);
    }
  };

  return (
    <CameraContainer>
      {/* Modal for timelapse events */}
      {modal.show && (
        <ModalOverlay onClick={() => setModal({ ...modal, show: false })}>
          <ModalContent 
            onClick={(e) => e.stopPropagation()}
            type={modal.type}
          >
            <ModalHeader type={modal.type}>
              {modal.type === 'error' ? '⚠️' : modal.type === 'success' ? '✓' : 'ℹ️'}
            </ModalHeader>
            <ModalTitle>{modal.title}</ModalTitle>
            <ModalMessage>{modal.message}</ModalMessage>
            <ModalButton onClick={() => setModal({ ...modal, show: false })}>
              OK
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

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

      {/* Camera Info Top Header */}
      <CameraTopHeader>
        <InfoBadge type="daily">
          <span>Daily</span>
          <Count>{dailyPhotos.length}</Count>
        </InfoBadge>
        <InfoBadge type="timelapse">
          <span>Timelapse</span>
          <Count>{displayedTimelapseCount}</Count>
          {isRecording && <RecordingDot />}
        </InfoBadge>
        {timelapseConfig.dailySnapshotEnabled && (
          <InfoBadge type="countdown">
            <span>Daily Next:</span>
            <CountdownText>{nextDailySnapshot || '--'}</CountdownText>
          </InfoBadge>
        )}
        {isRecording && (
          <InfoBadge type="countdown">
            <span>Next:</span>
            <CountdownText>{nextTimelapseCountdown || '--'}</CountdownText>
          </InfoBadge>
        )}
        {timelapseProgress.active && (
          <InfoBadge type="download">
            <span>Download</span>
            <DownloadText>
              {timelapseProgress.percent}%
            </DownloadText>
          </InfoBadge>
        )}
      </CameraTopHeader>

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
                background: 'rgba(var(--warning-color-rgb, 245, 158, 11), 0.1)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--warning-color, #f59e0b)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <SpinnerIcon style={{ animation: 'spin 1s linear infinite' }}>
                      <MdSchedule style={{ fontSize: '24px', color: 'var(--warning-color, #f59e0b)' }} />
                    </SpinnerIcon>
                    <div>
                      <TimelapseLabel style={{ marginBottom: '4px', color: 'var(--warning-color, #f59e0b)' }}>
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
              background: isRecording ? 'var(--success-bg-color, rgba(76, 175, 80, 0.1))' : 'var(--glass-bg-secondary, rgba(255, 255, 255, 0.05))',
              padding: '16px',
              borderRadius: '8px',
              border: isRecording ? '1px solid var(--chart-success-color, #22c55e)' : '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
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
                      ? `Capturing every ${timelapseConfig.interval}s • Images: ${displayedTimelapseCount}`
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
                  {nightMode.isNight && !nightMode.captureAtNight && (
                    <NightModeBadge>
                      <MdNightlight />
                      <span>Night Mode - Auto-skipping captures</span>
                    </NightModeBadge>
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
                  title="When generating a timelapse or downloading images, only captures within this date range will be included. This allows you to create timelapses from specific time periods."
                />
              </TimelapseSection>

              <TimelapseSection>
                <TimelapseLabel>End Date & Time</TimelapseLabel>
                <TimelapseInput
                  type="datetime-local"
                  value={timelapseConfig.endDate}
                  onChange={(e) => handleTimelapseChange('endDate', e.target.value)}
                  title="When generating a timelapse or downloading images, only captures within this date range will be included. This allows you to create timelapses from specific time periods."
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
                <option value="mp4">MP4 Video</option>
                <option value="zip">ZIP of Images</option>
              </TimelapseSelect>
            </TimelapseSection>

            {/* Capture at Night */}
            <CaptureAtNightBox style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <TimelapseLabel style={{ marginBottom: '4px' }}>Capture at Night</TimelapseLabel>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                  Enable to capture images even when grow lights are off
                </div>
              </div>
              <ToggleLabel>
                <ToggleSwitch
                  type="checkbox"
                  checked={timelapseConfig.captureAtNight}
                  onChange={(e) => handleTimelapseChange('captureAtNight', e.target.checked)}
                />
                <ToggleSlider />
              </ToggleLabel>
            </CaptureAtNightBox>

            {/* Performance & Storage Advisory */}
            <AdvisoryHint title="Generating MP4 videos on device can be very slow depending on your hardware. For faster downloads, consider using ZIP format instead, which packages raw images without processing.

Using short intervals (e.g., less than 5 minutes) can result in unnecessarily large storage requirements. Consider using intervals of 10-30 minutes for a good balance between detail and storage.">
              <MdInfo />
              <span>Performance & Storage Advisory</span>
            </AdvisoryHint>

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
                      <CompleteIcon><MdMovie /></CompleteIcon>
                      <ProgressTitle>Completed</ProgressTitle>
                    </ProgressHeader>
                  </>
                ) : (
                  <>
                    <ProgressHeader>
                      <VideoIcon><MdVideocam /></VideoIcon>
                      <ProgressTitle>Generating Timelapse</ProgressTitle>
                    </ProgressHeader>
                    <ProgressBarContainer>
                      <ProgressBarFill percent={timelapseProgress.percent}>
                        <ProgressGlow />
                      </ProgressBarFill>
                      <ProgressPercent>{timelapseProgress.percent}%</ProgressPercent>
                    </ProgressBarContainer>
                    <ProgressMeta>
                      <span>Status: {getProgressStatusLabel(timelapseProgress.status)}</span>
                      <span>Format: {timelapseConfig.format.toUpperCase()}</span>
                      {timelapseProgress.fileCount > 0 && (
                        <span style={{ marginLeft: '12px' }}>
                          {timelapseProgress.fileCount} frames
                        </span>
                      )}
                      {timelapseProgress.estimatedTime && (
                        <span style={{ marginLeft: '12px' }}>
                          ~{timelapseProgress.estimatedTime} video
                        </span>
                      )}
                      {timelapseProgress.estimatedSpace && (
                        <span style={{ marginLeft: '12px' }}>
                          {timelapseProgress.estimatedSpace} estimated
                        </span>
                      )}
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

          {/* Storage Management - Compact */}
          <StorageSection>
            <StorageHeader>
              <StorageTitle>
                <MdFolderOpen />
                <span>Storage</span>
              </StorageTitle>
              <StorageCounters>
                <StorageCounter>
                  <MdImage />
                  <span>{dailyPhotos.length}</span>
                  <span>daily</span>
                </StorageCounter>
                <StorageCounter>
                  <MdMovie />
                  <span>{timelapsePhotos.length}</span>
                  <span>timelapse</span>
                </StorageCounter>
                <StorageCounter title={`${timelapseOutputCounts.mp4 || 0} MP4, ${timelapseOutputCounts.zip || 0} ZIP`}>
                  <MdDownload />
                  <span>{timelapseOutputs.length}</span>
                  <span>output</span>
                </StorageCounter>
              </StorageCounters>
            </StorageHeader>

            <StorageBody>
              <StorageRow>
                <DateInput
                  type="date"
                  value={zipDateRange.startDate}
                  onChange={(e) => setZipDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  title="When generating a timelapse or downloading images, only captures within this date range will be included. This allows you to create timelapses from specific time periods."
                />
                <span style={{ color: 'var(--main-text-color)', opacity: 0.5 }}>→</span>
                <DateInput
                  type="date"
                  value={zipDateRange.endDate}
                  onChange={(e) => setZipDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  title="When generating a timelapse or downloading images, only captures within this date range will be included. This allows you to create timelapses from specific time periods."
                />

              </StorageRow>

              <StorageRow style={{ justifyContent: 'flex-start', fontSize: '12px', opacity: 0.75 }}>
                <span>Output files: {timelapseOutputCounts.mp4 || 0} MP4, {timelapseOutputCounts.zip || 0} ZIP</span>
              </StorageRow>

              <OutputList>
                {timelapseOutputs.length === 0 ? (
                  <OutputEmpty>No generated output files yet.</OutputEmpty>
                ) : (
                  timelapseOutputs.map((outputFile) => (
                    <OutputItem key={outputFile.filename}>
                      <OutputMeta>
                        <strong>{outputFile.filename}</strong>
                        <span>{(outputFile.format || 'file').toUpperCase()} • {formatFileSize(outputFile.size)}</span>
                      </OutputMeta>
                      <OutputDownloadButton onClick={() => handleRedownloadOutput(outputFile)}>
                        <MdDownload />
                        Re-download
                      </OutputDownloadButton>
                    </OutputItem>
                  ))
                )}
              </OutputList>

              <StorageActions>
                <StorageButton
                  $variant="delete"
                  onClick={handleDeleteAllDaily}
                  disabled={isDeletingAllDaily || dailyPhotos.length === 0}
                >
                  {isDeletingAllDaily ? <><DeletingSpinner />...</> : <><MdDelete /> Daily</>}
                </StorageButton>
                <StorageButton
                  $variant="delete"
                  onClick={handleDeleteAllTimelapse}
                  disabled={isDeletingAllTimelapse}
                >
                  {isDeletingAllTimelapse ? <><DeletingSpinner />...</> : <><MdDelete /> Timelapse</>}
                </StorageButton>
                <StorageButton
                  $variant="delete"
                  onClick={handleDeleteTimelapseOutput}
                  disabled={isDeletingTimelapseOutput}
                >
                  {isDeletingTimelapseOutput ? <><DeletingSpinner />...</> : <><MdDelete /> Output</>}
                </StorageButton>
              </StorageActions>
            </StorageBody>
          </StorageSection>
        </TimelapseContainer>
      )}
    </CameraContainer>
  );
};

export default CameraCard;


// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: var(--main-bg-card-color, #1a1a2e);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid ${props => props.type === 'error' ? 'rgba(255, 107, 107, 0.3)' : props.type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  
  ${props => props.type === 'error' && `
    border-color: rgba(255, 107, 107, 0.5);
  `}
  ${props => props.type === 'success' && `
    border-color: rgba(0, 255, 136, 0.5);
  `}
`;

const ModalHeader = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  ${props => props.type === 'error' && `color: #ff6b6b;`}
  ${props => props.type === 'success' && `color: #00ff88;`}
  ${props => props.type === 'info' && `color: #6c9fff;`}
`;

const ModalTitle = styled.h2`
  color: var(--main-text-color, #ffffff);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const ModalMessage = styled.p`
  color: var(--secondary-text-color, #a0a0a0);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
`;

const ModalButton = styled.button`
  background: var(--primary-color, #6c5ce7);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--primary-color-hover, #5b4cdb);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

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
  color: ${props => props.active ? 'var(--main-text-color)' : 'var(--main-text-color)'};
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
  color: var(--main-text-color);
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
  background: ${props => props.$isRecording ? 'var(--chart-error-color, #ef4444)' : 'var(--chart-success-color, #22c55e)'};
  color: var(--main-text-color);
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
  background: var(--warning-color, #f59e0b);
  color: var(--main-bg-color);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--warning-accent-color, #fb923c);
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

const CaptureAtNightBox = styled(TimelapseSection)`
  background: rgba(156, 39, 176, 0.08);
  border: 1px solid rgba(156, 39, 176, 0.25);
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
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
      case 'streaming': return 'var(--chart-success-color, #22c55e)';
      case 'connecting': return 'var(--warning-color, #f59e0b)';
      case 'still': return 'var(--chart-primary-color, #60a5fa)';
      case 'error': return 'var(--chart-error-color, #ef4444)';
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
      case 'streaming': return 'var(--chart-success-color, #22c55e)';
      case 'connecting': return 'var(--warning-color, #f59e0b)';
      case 'still': return 'var(--chart-primary-color, #60a5fa)';
      case 'error': return 'var(--chart-error-color, #ef4444)';
      default: return 'var(--placeholder-text-color)';
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
  color: var(--main-text-color);
  font-size: 18px;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
`;

const DeleteButton = styled.button`
  background: var(--chart-error-color, rgba(239, 68, 68, 0.7));
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--main-text-color);

  &:hover {
    background: var(--chart-error-color, #ef4444);
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
    ? 'var(--disabled-bg-color)'
    : 'var(--chart-primary-bg-color, rgba(33, 150, 243, 0.1))'};
  border: 1px solid ${props => props.$disabled
    ? 'var(--border-color)'
    : 'var(--chart-primary-border-color, rgba(33, 150, 243, 0.3))'};
  border-radius: 4px;
  font-size: 14px;
  color: ${props => props.$disabled
    ? 'var(--placeholder-text-color)'
    : 'var(--chart-primary-color, #60a5fa)'};
  margin-left: 8px;
  white-space: nowrap;
`;

const NextCaptureInfo = styled.div`
  font-size: 11px;
  color: var(--chart-primary-color, #60a5fa);
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

const StorageSection = styled.div`
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.05));
  box-shadow: var(--main-shadow-art);
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
`;

const StorageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
`;

const StorageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--main-text-color);
  
  svg {
    font-size: 18px;
    color: var(--primary-accent);
  }
`;

const StorageCounters = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StorageCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--glass-bg-primary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  font-size: 12px;
  
  svg {
    font-size: 14px;
    color: var(--primary-accent);
  }
  
  span:first-of-type {
    font-weight: 600;
    color: var(--primary-accent);
  }
  
  span:last-of-type {
    color: var(--second-text-color);
  }
`;

const StorageBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StorageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterHint = styled.span`
  font-size: 11px;
  color: var(--primary-accent);
  font-weight: 500;
  margin-left: auto;
  padding: 2px 8px;
  background: var(--primary-accent);
  border-radius: 10px;
  color: var(--main-bg-color);
`;

const StorageActions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const OutputList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 2px;
`;

const OutputItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  background: var(--glass-bg-primary, rgba(255, 255, 255, 0.03));
  border-radius: 8px;
  padding: 8px 10px;
`;

const OutputMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: 12px;
    color: var(--main-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }

  span {
    font-size: 11px;
    color: var(--second-text-color);
  }
`;

const OutputDownloadButton = styled.button`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--chart-primary-color, rgba(33, 150, 243, 0.3));
  background: var(--glass-bg-primary, rgba(33, 150, 243, 0.15));
  color: var(--main-text-color);
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: var(--chart-primary-color, rgba(33, 150, 243, 0.25));
  }
`;

const OutputEmpty = styled.div`
  font-size: 12px;
  color: var(--second-text-color);
  opacity: 0.8;
  padding: 8px 2px;
`;

const StorageButton = styled.button`
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: ${props => props.$variant === 'delete' 
    ? 'var(--glass-bg-primary, rgba(239, 68, 68, 0.15))' 
    : 'var(--glass-bg-primary, rgba(33, 150, 243, 0.15))'};
  border: 1px solid ${props => props.$variant === 'delete' 
    ? 'var(--chart-error-color, rgba(239, 68, 68, 0.3))' 
    : 'var(--chart-primary-color, rgba(33, 150, 243, 0.3))'};
  color: var(--main-text-color);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  svg {
    font-size: 14px;
  }
  
  &:hover:not(:disabled) {
    background: ${props => props.$variant === 'delete' 
      ? 'var(--chart-error-color, rgba(239, 68, 68, 0.25))' 
      : 'var(--chart-primary-color, rgba(33, 150, 243, 0.25))'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const NightModeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--sensor-co2-bg-color, rgba(139, 92, 246, 0.15));
  border: 1px solid var(--sensor-co2-border-color, rgba(139, 92, 246, 0.3));
  border-radius: 16px;
  font-size: 13px;
  color: var(--sensor-co2-color, #8b5cf6);
  margin-top: 8px;

  svg {
    font-size: 16px;
  }
`;

const DeletingSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid var(--glass-border, rgba(255, 255, 255, 0.3));
  border-top-color: var(--main-text-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const DownloadingSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid var(--glass-border, rgba(255, 255, 255, 0.3));
  border-top-color: var(--main-text-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const DateInput = styled.input`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--input-border-color);
  background: var(--input-bg-color);
  color: var(--main-text-color);
  font-size: 12px;
  outline: none;
  transition: all 0.2s;

  &:hover {
    border-color: var(--border-hover-color);
  }

  &:focus {
    border-color: var(--input-focus-border-color);
  }

  &::-webkit-calendar-picker-indicator {
    filter: brightness(0) invert(1);
    opacity: 0.7;
    cursor: pointer;
  }
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
  background: var(--error-bg-gradient, linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(198, 40, 40, 0.15) 100%));
  border: 1px solid var(--chart-error-color, rgba(239, 68, 68, 0.4));
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.2);
  position: relative;
`;

const NotificationIcon = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--chart-error-color, #ef4444);
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
  color: var(--error-light-text, #fecaca);
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
  color: var(--main-text-color);
  opacity: 0.6;
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
  background: var(--chart-error-color, rgba(239, 68, 68, 0.8));
  color: var(--main-text-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: var(--chart-error-color, #ef4444);
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

const AdvisoryHint = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-top: 12px;
  background: var(--glass-bg-secondary, rgba(255,255, 255, 0.05));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  font-size: 12px;
  color: var(--second-text-color);
  cursor: help;
  
  svg {
    font-size: 14px;
    color: var(--warning-color, #f59e0b);
  }
  
  &:hover {
    background: var(--glass-bg-primary, rgba(255,255, 255, 0.08));
    border-color: var(--warning-color, #f59e0b);
  }
`;

const ProgressSection = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: var(--primary-bg-gradient, linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%));
  border-radius: 8px;
  border: 1px solid var(--primary-accent-border, rgba(20, 184, 166, 0.3));
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
  background: var(--success-bg-color, rgba(34, 197, 94, 0.3));
  color: var(--chart-success-color, #22c55e);
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
  background: var(--error-bg-color, rgba(239, 68, 68, 0.3));
  color: var(--chart-error-color, #ef4444);
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
  width: ${props => Math.max(props.percent || 0, 2)}%;
  background: var(--primary-gradient, linear-gradient(90deg, var(--primary-accent) 0%, var(--secondary-accent) 100%));
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
  color: var(--main-text-color);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 1;
  line-height: 24px;
`;

const ProgressMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.7;
`;

// Camera Info Header Components
const CameraTopHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--glass-bg-secondary, rgba(255,255,255,0.05));
  border-radius: 8px;
  border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
  width: 100%;
  
  @media (max-width: 768px) {
    gap: 6px;
    padding: 6px 8px;
    justify-content: center;
  }
`;

const InfoBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  ${props => props.type === 'daily' && `
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.3);
  `}
  ${props => props.type === 'timelapse' && `
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  `}
  ${props => props.type === 'countdown' && `
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  `}
  ${props => props.type === 'download' && `
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
    border: 1px solid rgba(168, 85, 247, 0.3);
    animation: pulse 2s ease-in-out infinite;
  `}
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const Count = styled.span`
  font-weight: 600;
  font-size: 14px;
`;

const CountdownText = styled.span`
  font-family: monospace;
  font-size: 12px;
  min-width: 80px;
`;

const DownloadText = styled.span`
  font-weight: 600;
  min-width: 40px;
`;

const RecordingDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: blink 1s ease-in-out infinite;
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: var(--error-bg-color, rgba(239, 68, 68, 0.15));
  border: 1px solid var(--chart-error-color, rgba(239, 68, 68, 0.4));
  border-radius: 6px;
  color: var(--error-light-text, #fecaca);
  font-size: 13px;
  line-height: 1.4;
`;

const CompleteMessage = styled.div`
  padding: 12px;
  background: var(--success-bg-color, rgba(34, 197, 94, 0.15));
  border: 1px solid var(--chart-success-color, rgba(34, 197, 94, 0.4));
  border-radius: 6px;
  color: var(--success-light-text, #bbf7d0);
  font-size: 13px;
  line-height: 1.4;
`;
