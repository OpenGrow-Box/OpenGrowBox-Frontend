import{ createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
} from 'home-assistant-js-websocket';

import { useGlobalState } from './GlobalContext';

const HomeAssistantContext = createContext();

export const HomeAssistantProvider = ({ children }) => {
  const { getDeep, setDeep } = useGlobalState();

  // State declarations
  const [entities, setEntities] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [roomOptions, setRoomOptions] = useState([]);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionState, setConnectionState] = useState('disconnected');

  // Connection states
  const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    CONFIG_ERROR: 'config_error',
    NETWORK_ERROR: 'network_error',
    AUTH_ERROR: 'auth_error'
  };
  const [srvAddr, setSrvAddr] = useState("");

  // Refs for managing connections and cleanup
  const unsubscribeRef = useRef(null);
  const wsConnectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryDelayRef = useRef(1000);
  const connectAttemptRef = useRef(0);
  const connectionListenersRef = useRef([]);
  const debounceTimer = useRef(null);
  const abortController = useRef(null);
  const dataCacheRef = useRef(new Map());
  const MAX_RECONNECT_ATTEMPTS = 5;
  const isManualConnectRef = useRef(false);

  // State for unauthorized attempt tracking
  const [unauthAttempts, setUnauthAttempts] = useState(0);
  const MAX_UNAUTH_ATTEMPTS = 3;

  // Configuration
  const configuredServer = getDeep("Conf.hassServer") || '';
  // Read token from localStorage directly to avoid async state issues
  const token = localStorage.getItem(import.meta.env.PROD ? 'haToken' : 'devToken') || getDeep('Conf.haToken') || '';

  // Environment detection
  const isDev = import.meta.env.DEV;
  
  // In development: use VITE_HA_HOST from .env, or manual config, or Vite proxy
  // In production (Home Assistant panel): use window.location.origin
  const envHaHost = import.meta.env.VITE_HA_HOST || '';
  const prodBaseUrl = window.location.origin;
  
  // Determine the base URL to use
  const getBaseUrl = () => {
    if (isDev) {
      // Dev mode: prefer configured server, then env variable
      return configuredServer || envHaHost || '';
    }
    // Production: always use window.location.origin (we're in HA panel)
    return prodBaseUrl;
  };
  
  const baseUrl = getBaseUrl();
  const wsBaseUrl = baseUrl;
  const stateURL = baseUrl ? `${baseUrl}/api/states` : '';

  console.log('isDev:', isDev, 'envHaHost:', envHaHost, 'configuredServer:', configuredServer);
  console.log('HA Config - baseUrl:', baseUrl || 'not set', 'token:', token ? '[REDACTED]' : 'null');

  // Configuration validation
  const isConfigurationValid = () => {
    const hasToken = token && typeof token === 'string' && token.trim() !== '';
    
    if (isDev) {
      // In dev mode, we need both URL and token
      const hasUrl = baseUrl && typeof baseUrl === 'string' && baseUrl.trim() !== '';
      return hasUrl && hasToken;
    }
    
    // In production, we use window.location.origin, so just token is needed
    return hasToken;
  };

  // Cleanup connection event listeners to prevent memory leaks
  const cleanupConnectionListeners = () => {
    connectionListenersRef.current.forEach(({ event, listener }) => {
      if (wsConnectionRef.current) {
        try {
          wsConnectionRef.current.removeEventListener(event, listener);
        } catch (e) {
          console.warn(`Error removing ${event} listener:`, e);
        }
      }
    });
    connectionListenersRef.current = [];
  };

  // Detect unauthorized errors
  const isUnauthorizedError = (error) => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    const code = error.code;
    return (
      message.includes('unauth') ||
      message.includes('unauthorized') ||
      message.includes('invalid token') ||
      message.includes('authentication failed') ||
      code === 401 ||
      code === 403
    );
  };

  // Send command with retry logic
  const sendCommand = async (command, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connection directly to avoid reference issues
        if (connection && connection.readyState !== 3) {
          return await connection.sendMessagePromise(command);
        }
        // Wait for connection to be ready
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      } catch (error) {
        if (attempt === maxRetries) throw error;
        console.warn(`Command attempt ${attempt} failed, retrying...`, error);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  };

  // Handle reconnection with exponential backoff
  const scheduleReconnect = () => {
    if (!isMountedRef.current) return;

    // Check configuration before attempting reconnection
    if (!isConfigurationValid()) {
      console.warn('Configuration invalid, not attempting reconnection');
      setConnectionState(CONNECTION_STATES.CONFIG_ERROR);
      setError('Home Assistant configuration missing. Please check your settings.');
      return;
    }

    // Clear any existing reconnect timeout
    clearTimeout(reconnectTimeoutRef.current);

    // Increment attempt counter and check if we've reached the limit
    connectAttemptRef.current += 1;

    if (connectAttemptRef.current > MAX_RECONNECT_ATTEMPTS) {
      console.warn(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
      setConnectionState(CONNECTION_STATES.NETWORK_ERROR);
      setError(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Please check your network and Home Assistant configuration.`);
      return;
    }
    
    // Calculate delay with exponential backoff
    retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, 30000);
    
    // Schedule reconnection
    console.log(`Reconnecting in ${retryDelayRef.current}ms... (Attempt ${connectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) connect(true);
    }, retryDelayRef.current);
  };

  // Extract setup logic to a separate function for better organization
  const setupConnection = async (conn) => {
    if (!conn || !isMountedRef.current) return;

    try {
      // Clean up any existing subscription
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (e) {
          // Silently ignore "Subscription not found" errors
          if (!e?.code?.includes('not_found') && !e?.message?.includes('not found')) {
            console.warn("Error unsubscribing from entities:", e);
          }
        }
        unsubscribeRef.current = null;
      }

      // Set up new entity subscription
      const unsubscribe = subscribeEntities(conn, (updatedEntities) => {
        if (isMountedRef.current) setEntities(updatedEntities);
      });
      unsubscribeRef.current = unsubscribe;

      // Fetch initial entities via REST API as a fallback
      if (stateURL) {
        try {
          const response = await fetch(stateURL, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) throw new Error(`API Error: ${response.status}`);
          
          const initialEntities = await response.json();
          
          if (isMountedRef.current) {
            // Convert array to object format
            const entitiesObj = initialEntities.reduce(
              (acc, entity) => ({ ...acc, [entity.entity_id]: entity }), 
              {}
            );
            setEntities(entitiesObj);
            
            // Extract room and token information
            const roomEntity = initialEntities.find(e => e.entity_id === 'select.ogb_rooms');
            const tokenEntity = initialEntities.find(e => e.entity_id === 'text.ogb_accesstoken');
            
            if (roomEntity) {
              setCurrentRoom(roomEntity.state || '');
              setRoomOptions(
                (roomEntity.attributes?.options || []).filter(
                  r => r.toLowerCase() !== "ambient"
                )
              );

            }
            
            if (tokenEntity) {
              setAccessToken(tokenEntity.state || '');
            }
          }
        } catch (err) {
          console.error("Failed to fetch initial entities:", err);
          // Don't throw here, we still have the WebSocket connection
        }
      }

      // Clean up any existing event listeners before adding new ones
      cleanupConnectionListeners();

      // Set up connection event listeners with proper cleanup tracking
      const readyListener = () => {
        if (isMountedRef.current) {
          console.log('Home Assistant connection ready ✅');
          setError(null);
          retryDelayRef.current = 1000;
          connectAttemptRef.current = 0;
        }
      };

      const disconnectedListener = () => {
        if (isMountedRef.current) {
          console.warn('Home Assistant disconnected ❌');
          // Don't immediately clear connection - give reconnection a chance
          setTimeout(() => {
            if (!wsConnectionRef.current || wsConnectionRef.current.readyState === 3) {
              wsConnectionRef.current = null;
              setConnection(null);
            }
          }, 2000); // 2-second grace period for reconnection
          scheduleReconnect();
        }
      };

      const errorListener = (err) => {
        if (isMountedRef.current) {
          console.error('Home Assistant connection error:', err);
          setError(`Connection error: ${err.message || 'Unknown error'}`);
        }
      };

      conn.addEventListener('ready', readyListener);
      conn.addEventListener('disconnected', disconnectedListener);
      conn.addEventListener('error', errorListener);

      // Store listener references for cleanup
      connectionListenersRef.current = [
        { event: 'ready', listener: readyListener },
        { event: 'disconnected', listener: disconnectedListener },
        { event: 'error', listener: errorListener }
      ];

    } catch (err) {
      console.error("Error in setupConnection:", err);
      if (isMountedRef.current) setError(`Setup error: ${err.message || 'Unknown error'}`);
      throw err; // Re-throw to be handled by caller
    }
  };

  // Connection function - declaring before use
  const connect = async (force = false) => {
    if (!isMountedRef.current || (!isOnline && !force)) return;

    // Double-check configuration
    if (!isConfigurationValid()) {
      console.warn("Invalid configuration, cannot connect");
      setConnectionState(CONNECTION_STATES.CONFIG_ERROR);
      setLoading(false);
      return;
    }

    // Clear any pending reconnection
    clearTimeout(reconnectTimeoutRef.current);

    try {
      setLoading(true);
      
      // Create auth object and connection with proper error handling
      const auth = createLongLivedTokenAuth(wsBaseUrl, token);
      
      let newConnection;
      try {
        newConnection = await createConnection({
          auth,
          setupRetry: 0
        });
       } catch (err) {
         console.error("WebSocket connection failed:", err);
         // Determine error type
         if (err.message?.includes('401') || err.message?.includes('auth')) {
           setConnectionState(CONNECTION_STATES.AUTH_ERROR);
         } else {
           setConnectionState(CONNECTION_STATES.NETWORK_ERROR);
         }
         throw err; // Re-throw to be caught by outer try/catch
       }

      if (!isMountedRef.current) {
        // Component unmounted during connection attempt
        newConnection.close();
        return;
      }

      // Reset reconnection attempts on successful connection
      connectAttemptRef.current = 0;
      retryDelayRef.current = 1000;
      setUnauthAttempts(0); // Reset unauthorized attempts on successful connection
      isManualConnectRef.current = false; // Reset manual connect flag

      // Update connection state
      setConnectionState(CONNECTION_STATES.CONNECTED);

      // Store connection references
      wsConnectionRef.current = newConnection;
      setConnection(newConnection);
      
      // Set up entity subscription with error handling
      try {
        await setupConnection(newConnection);
      } catch (err) {
        console.error("Failed to set up entity subscription:", err);
        throw err; // Re-throw to be caught by outer try/catch
      }
      
      setError(null);
      console.log("✅ Connected to Home Assistant WebSocket");
      
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error("Failed to connect to Home Assistant:", err);

      // Handle unauthorized errors specially
      if (isUnauthorizedError(err)) {
        const newAttempts = unauthAttempts + 1;
        setUnauthAttempts(newAttempts);

        if (newAttempts >= MAX_UNAUTH_ATTEMPTS) {
          // Clear invalid token and redirect to config
          setDeep('Conf.haToken', null);
          localStorage.removeItem(import.meta.env.PROD ? 'haToken' : 'devToken');

          setError('Invalid token. Please re-enter your Home Assistant Long-Lived Access Token.');
          console.warn(`Maximum unauthorized attempts (${MAX_UNAUTH_ATTEMPTS}) reached. Redirecting to config.`);

          // Redirect to config page
          setTimeout(() => {
            window.location.href = '/ogb-gui/config';
          }, 2000); // Brief delay to show error message

          return; // Don't attempt reconnection
        } else {
          setError(`Invalid token (attempt ${newAttempts}/${MAX_UNAUTH_ATTEMPTS}). Please check your token.`);
          // Continue with normal reconnection for attempts 1-2
          scheduleReconnect();
        }
      } else {
        // Handle other connection errors normally
        setError(err.message || "Connection failed");
        scheduleReconnect();
      }

      // Close any partial connection
      if (wsConnectionRef.current) {
        try {
          wsConnectionRef.current.close();
        } catch (e) {
          console.warn("Error closing partial connection:", e);
        }
        wsConnectionRef.current = null;
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online && !wsConnectionRef.current) {
        console.log("Network is online, attempting to reconnect");
        connect();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [connection]);

  // Main connection effect
  useEffect(() => {
    isMountedRef.current = true;

    // Skip if user manually initiated connection from setup page
    if (isManualConnectRef.current) {
      console.log('Manual connection in progress, skipping initial connect');
      setLoading(false);
      return;
    }

    // Check configuration first
    if (!isConfigurationValid()) {
      console.log('Home Assistant not configured, skipping connection attempt');
      setConnectionState(CONNECTION_STATES.CONFIG_ERROR);
      setLoading(false);
      return;
    }

    // Attempt initial connection if we have valid configuration and are online
    if (isOnline) {
      setConnectionState(CONNECTION_STATES.CONNECTING);
      connect();
    } else {
      setConnectionState(CONNECTION_STATES.NETWORK_ERROR);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      // Clear any pending reconnection attempts
      clearTimeout(reconnectTimeoutRef.current);

      // Unsubscribe from entity updates
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (e) {
          console.warn("Error during unsubscribe:", e);
        }
        unsubscribeRef.current = null;
      }

      // Clean up connection event listeners
      cleanupConnectionListeners();

      // Close WebSocket connection
      if (wsConnectionRef.current) {
        try {
          wsConnectionRef.current.close();
        } catch (e) {
          console.warn("Error closing connection:", e);
        }
        wsConnectionRef.current = null;
        console.log('Home Assistant connection closed 🧹');
      }
    };
  }, [token, isOnline]); // Removed baseUrl dependency - in production we use window.location.origin

  // Update current room from entities when they change
  useEffect(() => {
    const roomEntity = entities['select.ogb_rooms'];
    if (roomEntity && roomEntity.state !== currentRoom) {
      setCurrentRoom(roomEntity.state || '');
      
      // Also update room options if available
      if (roomEntity.attributes?.options) {
        setRoomOptions(roomEntity.attributes.options);
      }
    }
  }, [entities, currentRoom]);

  // Page Visibility API - Handle tab inactivity to prevent black screens
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - log for debugging
        console.log('Tab hidden - WebSocket operations may be throttled by browser');
        // Don't pause operations, just be aware of potential throttling
      } else {
        // Tab became visible - validate connection and refresh if needed
        console.log('Tab visible - validating connection state');

        // Check if we need to refresh connection or data
        if (!connection || connection.readyState === 3) {
          console.log('Connection was lost while tab was hidden, will reconnect automatically');
          // The existing reconnection logic will handle this
        } else if (connection.readyState === 1) {
          console.log('Connection active, tab reactivation successful');
        }

        // Clear any stale debounce timers
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Cancel any ongoing requests
      if (abortController.current) {
        abortController.current.abort();
      }
      // Clear cache
      dataCache.current.clear();
    };
  }, []);

  // Provide context values
  return (
    <HomeAssistantContext.Provider
      value={{
        connection,
        loading,
        error,
        setError,
        connectionState,
        entities,
        currentRoom,
        setCurrentRoom,
        roomOptions,
        setRoomOptions,
        isOnline,
        srvAddr,
        accessToken,
        setAccessToken,
        isConfigurationValid,
        reconnect: () => {
          isManualConnectRef.current = true;
          connectAttemptRef.current = 0;
          retryDelayRef.current = 1000;
          connect(true);
        },
        isConnectionValid: () => {
          return connection && connection.readyState !== 3; // Not CLOSED
        },
        sendCommand,
        // Tab reactivation helper for components
        handleTabReactivation: () => {
          console.log('Manual tab reactivation triggered');
          if (!connection || connection.readyState === 3) {
            console.log('Reconnecting due to tab reactivation...');
            connectAttemptRef.current = 0;
            retryDelayRef.current = 1000;
            connect(true);
          }
        }
      }}
    >
      {children}
    </HomeAssistantContext.Provider>
  );
};

export default HomeAssistantProvider;

export const useHomeAssistant = () => useContext(HomeAssistantContext);