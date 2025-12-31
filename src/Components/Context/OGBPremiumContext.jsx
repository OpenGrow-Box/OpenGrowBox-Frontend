// Fixed OGBPremiumContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useGlobalState } from './GlobalContext';

const OGBPremiumContext = createContext();

export const OGBPremiumProvider = ({ children }) => {
  const { setDeep } = useGlobalState();
  const [session, setSession] = useState(null);
  const {connection, currentRoom, entities } = useHomeAssistant();
  const [isPremium, setIsPremium] = useState(false);
  const [ogbSessions, setOGBSessions] = useState(0);
  const [ogbMaxSessions, setOgbMaxConnections] = useState(0);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isSubActive, setIsSubActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [maxRoomsReached,setMaxRoomsReached] = useState(false)

  // Mutex to prevent concurrent async operations
  const operationLockRef = useRef(false);
  // Prevent duplicate login calls (React StrictMode, rapid re-renders)
  const loginInProgressRef = useRef(false);



  const [authStatus, setAuthStatus] = useState('idle');
  const [lastError, setLastError] = useState(null);
  const responseListenerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const isLoadingProfileRef = useRef(false);

  const [growPlans,setGrowPlans] = useState([])
  const [publicGrowPlans, setPublicGrowPlans] = useState([]);
  const [privateGrowPlans, setPrivateGrowPlans] = useState([]);
  const [strainGrowPlan, setStrainGrowPlan] = useState("");
  const [activeGrowPlan, setActiveGrowPlan] = useState([])
  
  // Callback-Map für spezifische UI-Requests (nur wenn explizit gewünscht)
  const callbacksRef = useRef(new Map());

  // Helper function to get the actual current room from entities
  const getActualRoom = () => {
    // First try currentRoom from context
    if (currentRoom) {
      console.log('📍 Using currentRoom from context:', currentRoom);
      return currentRoom;
    }
    
    // Fallback: Read directly from entities
    const roomEntity = entities?.['select.ogb_rooms'];
    if (roomEntity?.state) {
      console.log('📍 Using room from entities:', roomEntity.state);
      return roomEntity.state;
    }
    
    // Last resort: Check if there's a room in the data response
    // This can happen during login before entities are populated
    console.warn('⚠️ No room available from context or entities - auto-switch will be skipped');
    console.debug('Debug info:', {
      currentRoom,
      entities: entities ? Object.keys(entities) : 'undefined',
      roomEntity: roomEntity?.state
    });
    return null;
  };

  // Debug-Funktion für currentRoom
  const logCurrentRoom = (functionName) => {
    const actualRoom = getActualRoom();
    console.log(`[${functionName}] currentRoom:`, currentRoom, '| actualRoom:', actualRoom);
  };

  // Funktion zum Laden des Benutzerprofils über Home Assistant Event
  const loadUserProfile = async (force = false) => {
    if (operationLockRef.current && !force) {
      console.log('Operation in progress, skipping loadUserProfile...');
      return;
    }

    if (isLoadingProfileRef.current && !force) {
      console.log('Profil wird bereits geladen, überspringe...');
      return;
    }

    try {
      operationLockRef.current = true;
      if (!connection) throw new Error("No Home Assistant connection available");

      isLoadingProfileRef.current = true;
      console.log('Lade Benutzerprofil über HA Event...');
      logCurrentRoom('loadUserProfile');
      
      const roomToUse = getActualRoom();
              
      // Direkte Event-Sendung ohne Callback-Erwartung
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'ogb_premium_get_profile',
        event_data: {
          room: roomToUse, // Use actual room from entities or context
          atTime: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Fehler beim Laden des Benutzerprofils:', error);
      
      if (error.message.includes('unauthorized') || error.message.includes('Not authenticated')) {
        console.log('Authentifizierungsfehler - setze States zurück');
        resetStates();
      } else {
        console.log('Netzwerk-/Serverfehler - behalte aktuelle States bei');
      }
      throw error;
    } finally {
      isLoadingProfileRef.current = false;
      operationLockRef.current = false;
    }
  };

  // Hilfsfunktion zum Zurücksetzen der States
  const resetStates = () => {
    // Reset all state values directly (no dispatch needed)
    setSession(null);
    setIsPremium(false);
    setOGBSessions(0);
    setOgbMaxConnections(0);
    setCurrentPlan(null);
    setIsSubActive(null);
    setSubscription(null);
    setUserProfile(null);
    setGrowPlans([]);
    setPrivateGrowPlans([]);
    setPublicGrowPlans([]);
    setActiveGrowPlan([]);
    setAuthStatus('idle');
    setLastError(null);

    setDeep("OGBPremium", null);
  };

  // Zentraler Event-Handler - behandelt ALLE Events einheitlich
  const handleAuthResponse = async (event) => {
    console.log("Received auth response event:", event);
    const { event_id, status, message, data } = event.data;
    
    // Prüfe ob es einen spezifischen Callback für diese event_id gibt
    const callback = callbacksRef.current.get(event_id);
    let newSession
    if (status === "success" && data) {
      // Aktualisiere immer die States basierend auf der Message
      switch (message) {
        case "LoginSuccess":
          newSession = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
            expires_at: data.expires_at,
          };
          setSession(newSession);
          setAuthStatus('authenticated');
          setLastError(null);
          // API returns 'plan', not 'currentPlan'
          setCurrentPlan(data?.currentPlan || data?.plan || data?.subscription_data?.plan_name || "free");
          setIsPremium(data?.is_premium);
          setSubscription(data?.subscription_data);
          setUserProfile(data.user);
          setIsSubActive(data.subscription_data?.status === 'active' || false);
          setOGBSessions(data?.ogb_sessions || 0);
          setOgbMaxConnections(data?.ogb_max_sessions || 0);
          
          console.log('📊 Login data received:', {
            ogb_sessions: data?.ogb_sessions,
            ogb_max_sessions: data?.ogb_max_sessions,
            usage: data?.subscription_data?.usage
          });

          // Aktualisiere den globalen State mit Login-Daten
          setDeep("OGBPremium", {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
            currentPlan: data?.currentPlan || data?.plan || data?.subscription_data?.plan_name || "free",
            expires_at: data.expires_at,
            is_premium: data.is_premium || false,
            subscription_data: data.subscription_data
          });

           try {
             console.log('Lade Profil nach erfolgreichem Login...');
             // Use room from response data if available, otherwise fall back to currentRoom
             const loginRoom = data?.room || currentRoom;
             await loadUserProfile(true);
             await getGrowPlans(loginRoom);
             console.log('Profil nach Login erfolgreich geladen');
          } catch (error) {
            console.error('Fehler beim Laden des Profils nach Login:', error);
          }
          break;

        case "Logout successful":
          resetStates();
          break;

        case "Profile retrieved":
          // SECURITY: Only set premium status if user data exists
          if (data.user) {
            console.log('🔍 Profile retrieved - subscription_data:', data.subscription_data);
            console.log('🔍 Profile retrieved - limits:', data.subscription_data?.limits);
            console.log('🔍 Profile retrieved - usage:', data.subscription_data?.usage);
            console.log('🔍 Profile retrieved - features:', data.subscription_data?.features);
            
            // CRITICAL FIX: Create session object so isLoggedIn becomes true
            // This fixes the login modal appearing after HA restart when profile shows logged in state
            if (data.is_logged_in) {
              const profileSession = {
                user_id: data.user?.user_id || data.user_id,
                is_premium: data.is_premium,
                from_profile: true,
              };
              setSession(profileSession);
              setAuthStatus('authenticated');
              console.log('✅ Session created from profile - isLoggedIn is now true');
            }
            
            setUserProfile(data.user);
            setSubscription(data.subscription_data);
            setIsPremium(data.is_premium || false);
            setIsSubActive(data.subscription_data?.active || false);
            setOGBSessions(data?.ogb_sessions || 0);
            setOgbMaxConnections(data?.ogb_max_sessions || 0);
          } else {
            // No user data means not authenticated
            resetStates();
          }
          break;

        case "Premium state auto-restored from disk":
          // Handle state restoration after HA restart
          console.log('✅ Premium state auto-restored from backend!', data);
          
          // Create a session object from restored data so isLoggedIn works
          const restoredSession = {
            user_id: data.user_id,
            is_premium: data.is_premium,
            restored: true,
          };
          setSession(restoredSession);
          
          // Update all premium state without triggering auto-switch (backend already has correct mainControl)
          setIsPremium(data.is_premium || false);
          setSubscription(data.subscription_data || null);
          setCurrentPlan(data.currentPlan || 'free');
          setUserProfile({
            currentPlan: data.currentPlan,
            is_premium: data.is_premium,
            subscription_data: data.subscription_data,
            user_id: data.user_id,
          });
          setOGBSessions(data.ogb_sessions || 0);
          setOgbMaxConnections(data.ogb_max_sessions || 0);
          setIsSubActive(data.subscription_data?.status === 'active');
          setLoading(false);
          setAuthStatus('authenticated');
          
          // Update global state
          setDeep("OGBPremium", {
            currentPlan: data.currentPlan || "free",
            is_premium: data.is_premium || false,
            subscription_data: data.subscription_data,
            user_id: data.user_id,
            restored: true // Flag to indicate this was a restore, not fresh login
          });
          

          
          // Load grow plans in background
          try {
            await getGrowPlans(roomForRestore || currentRoom);
            console.log('✅ Grow plans loaded after state restore');
          } catch (error) {
            console.error('⚠️ Error loading grow plans after restore:', error);
          }
          
          console.log('✅ Frontend state synchronized with restored backend state');
          break;

        case "GrowPlans retrieved":
          console.log(data)
          setGrowPlans(data || []);
          setPrivateGrowPlans(data?.PrivatePlans || []);
          setPublicGrowPlans(data?.PublicPlans || []);
          setActiveGrowPlan(data?.ActivePlan || [])
          break;

        case "Connect Success":
          setOGBSessions(data?.ogb_sessions);
          setOgbMaxConnections(data?.ogb_max_sessions);
          break;

        case "Disconnect Success":   
          setOGBSessions(data?.ogb_sessions);
          setOgbMaxConnections(data?.ogb_max_sessions);
          break;

        default:
          console.log('Unhandled success message:', message);
      }

      // Callback aufrufen falls vorhanden
      if (callback) {
        callbacksRef.current.delete(event_id);
        callback.resolve({
          success: true,
          data: data,
          message: message
        });
      }

    } else if (status === "error") {
      setLastError(message);
      
      switch (message) {
        case "to_many_rooms":
          setMaxRoomsReached(true)
          break;

        case "Not authenticated":
         setAuthStatus('error');
         break;

        default:
          console.log('Unhandled error message:', message);
      }

      // Callback aufrufen falls vorhanden
      if (callback) {
        callbacksRef.current.delete(event_id);
        callback.reject(new Error(message));
      }
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      if (isInitializedRef.current) {
        console.log('Session bereits initialisiert, überspringe...');
        return;
      }

      if (operationLockRef.current) {
        console.log('Operation in progress, skipping initialization...');
        return;
      }

      if (!connection) {
        console.log('Warte auf Connection...');
        return;
      }

      if (!currentRoom) {
        console.log('Warte auf currentRoom...');
        return;
      }

      isInitializedRef.current = true;

      try {
        operationLockRef.current = true;

        console.log('Load Profils from Server...');
        logCurrentRoom('initializeSession');
        await loadUserProfile(true);
        await getGrowPlans()
        console.log('Load Grow Plans from Server...');
        //await getGrowPlans();
        console.log('Session successfull loaded');

      } catch (error) {
        console.error('Fehler beim Laden des Profils während der Initialisierung:', error);
        console.log('Initialisierung fehlgeschlagen, setze loading auf false');
      } finally {
        setLoading(false);
        operationLockRef.current = false;
      }
    };

    initializeSession();

    return () => {
      isInitializedRef.current = false;
    };
    
  }, [connection, currentRoom]);

  useEffect(() => {
    if (!connection) return;

    let unsubscribe = null;

    const subscribeToEvents = async () => {
      try {
        unsubscribe = await connection.subscribeEvents(
          handleAuthResponse,
          "ogb_premium_auth_response"
        );
        responseListenerRef.current = unsubscribe;
        console.log("Successfully subscribed to auth response events");
      } catch (e) {
        console.error("Subscription to auth response failed:", e);
      }
    };
    
    subscribeToEvents();

    return () => {
      if (responseListenerRef.current) {
        try {
          responseListenerRef.current();
        } catch (e) {
          // Silently ignore "Subscription not found" errors during cleanup
          if (!e?.code?.includes('not_found') && !e?.message?.includes('not found')) {
            console.warn("Error unsubscribing from auth response events:", e);
          }
        }
        responseListenerRef.current = null;
      }
      callbacksRef.current.clear();
    };
  }, [connection, setDeep]);

  // Subscribe to real-time API usage updates
  useEffect(() => {
    if (!connection) return;

    let unsubscribeUsage = null;

    const subscribeToUsageUpdates = async () => {
      try {
        unsubscribeUsage = await connection.subscribeEvents(
          (event) => {
            console.log('📊 Received api_usage_update:', event.data);
            const { usage, timestamp, lastEndpoint, lastMethod } = event.data;
            
            // Update subscription.usage with fresh data
            if (usage) {
              setSubscription(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  usage: usage
                };
              });
              
              // Also update ogbSessions if activeConnections is provided
              if (usage.activeConnections !== undefined) {
                setOGBSessions(usage.activeConnections);
              }
              
              console.log('✅ Subscription usage updated in real-time:', usage);
            }
          },
          "api_usage_update"
        );
        console.log("Successfully subscribed to api_usage_update events");
      } catch (e) {
        console.error("Subscription to api_usage_update failed:", e);
      }
    };
    
    subscribeToUsageUpdates();

    return () => {
      if (unsubscribeUsage) {
        try {
          unsubscribeUsage();
        } catch (e) {
          // Silently ignore cleanup errors
          if (!e?.code?.includes('not_found') && !e?.message?.includes('not found')) {
            console.warn("Error unsubscribing from api_usage_update events:", e);
          }
        }
      }
    };
  }, [connection]);

  // Subscribe to real-time session count updates
  useEffect(() => {
    if (!connection) return;

    let unsubscribeSession = null;

    const subscribeToSessionUpdates = async () => {
      try {
        unsubscribeSession = await connection.subscribeEvents(
          (event) => {
            console.log('📊 Received session_update:', event.data);
            const { active_sessions, max_sessions } = event.data;
            
            // Update session counts with fresh data
            if (active_sessions !== undefined) {
              setOGBSessions(active_sessions);
            }
            if (max_sessions !== undefined) {
              setOgbMaxConnections(max_sessions);
            }
            console.log('✅ Session count updated in real-time:', { active_sessions, max_sessions });
          },
          "session_update"
        );
        console.log("Successfully subscribed to session_update events");
      } catch (e) {
        console.error("Subscription to session_update failed:", e);
      }
    };
    
    subscribeToSessionUpdates();

    return () => {
      if (unsubscribeSession) {
        try {
          unsubscribeSession();
        } catch (e) {
          // Silently ignore cleanup errors
          if (!e?.code?.includes('not_found') && !e?.message?.includes('not found')) {
            console.warn("Error unsubscribing from session_update events:", e);
          }
        }
      }
    };
  }, [connection]);

  // Subscribe to isAuthenticated event (shared auth from other rooms)
  useEffect(() => {
    if (!connection) return;

    let unsubscribeAuth = null;

    const subscribeToAuthEvents = async () => {
      try {
        unsubscribeAuth = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            console.log('🔐 Received isAuthenticated event:', data);
            
            // Only process if logged in
            if (data.is_logged_in) {
              // Create session from shared auth
              const sharedSession = {
                user_id: data.user_id,
                access_token: data.access_token,
                is_premium: data.is_premium,
                shared_from: data.AuthenticatedRoom,
              };
              setSession(sharedSession);
              setAuthStatus('authenticated');
              setIsPremium(data.is_premium || false);
              setSubscription(data.subscription_data || null);
              setCurrentPlan(data.subscription_data?.plan_name || 'free');
              setOGBSessions(data.ogb_sessions || 0);
              setOgbMaxConnections(data.ogb_max_sessions || 0);
              
              console.log(`✅ Auth shared from ${data.AuthenticatedRoom}, isLoggedIn is now true`);
            }
          },
          "isAuthenticated"
        );
        console.log("Successfully subscribed to isAuthenticated events");
      } catch (e) {
        console.error("Subscription to isAuthenticated failed:", e);
      }
    };
    
    subscribeToAuthEvents();

    return () => {
      if (unsubscribeAuth) {
        try {
          unsubscribeAuth();
        } catch (e) {
          if (!e?.code?.includes('not_found') && !e?.message?.includes('not found')) {
            console.warn("Error unsubscribing from isAuthenticated events:", e);
          }
        }
      }
    };
  }, [connection]);

  // Subscribe to room limit reached events (from backend)
  useEffect(() => {
    if (!connection) return;

    let unsubscribeRoomLimit = null;
    let unsubscribeUIRoomLimit = null;
    let unsubscribeMainControlChanged = null;

    const subscribeToRoomLimitEvents = async () => {
      try {
        // Subscribe to room_limit_reached event (API login rejection)
        unsubscribeRoomLimit = await connection.subscribeEvents(
          (event) => {
            console.log('🚫 Received room_limit_reached:', event.data);
            const { room, current_rooms, max_rooms, plan, action } = event.data;
            
            setMaxRoomsReached(true);
            
            // Show user-friendly alert
            const message = `Room limit reached for ${plan} plan.\n` +
              `Currently using ${current_rooms}/${max_rooms} rooms.\n` +
              `Please disconnect another room first or upgrade your plan.`;
            
            console.warn('⚠️ Room limit reached:', message);
            // The alert will be shown by the component that triggered the action
          },
          "room_limit_reached"
        );
        console.log("Successfully subscribed to room_limit_reached events");

        // Subscribe to ui_to_many_rooms_message event (WebSocket rejection)
        unsubscribeUIRoomLimit = await connection.subscribeEvents(
          (event) => {
            console.log('🚫 Received ui_to_many_rooms_message:', event.data);
            setMaxRoomsReached(true);
          },
          "ui_to_many_rooms_message"
        );
        console.log("Successfully subscribed to ui_to_many_rooms_message events");

        // Subscribe to ogb_main_control_changed event (backend reset mainControl)
        unsubscribeMainControlChanged = await connection.subscribeEvents(
          (event) => {
            console.log('🔄 Received ogb_main_control_changed:', event.data);
            const { room, old_value, new_value, reason } = event.data;
            
            if (reason === 'room_limit_reached' && old_value === 'Premium' && new_value === 'HomeAssistant') {
              console.warn(`⚠️ Room ${room} was reset from Premium to HomeAssistant due to room limit`);
              // The UI will automatically reflect this from entity state changes
            }
          },
          "ogb_main_control_changed"
        );
        console.log("Successfully subscribed to ogb_main_control_changed events");

      } catch (e) {
        console.error("Subscription to room limit events failed:", e);
      }
    };
    
    subscribeToRoomLimitEvents();

    return () => {
      const cleanupSubscription = (unsub, name) => {
        if (unsub) {
          try {
            unsub();
          } catch (e) {
            if (!e?.code?.includes('not_found') && !e?.message?.includes('not found')) {
              console.warn(`Error unsubscribing from ${name} events:`, e);
            }
          }
        }
      };
      
      cleanupSubscription(unsubscribeRoomLimit, 'room_limit_reached');
      cleanupSubscription(unsubscribeUIRoomLimit, 'ui_to_many_rooms_message');
      cleanupSubscription(unsubscribeMainControlChanged, 'ogb_main_control_changed');
    };
  }, [connection]);

  // SECURITY: Ensure isPremium is always false when not authenticated
  useEffect(() => {
    if (!userProfile && isPremium) {
      console.warn('SECURITY: Resetting isPremium to false - no user profile found');
      setIsPremium(false);
      setIsSubActive(false);
    }
  }, [userProfile, isPremium]);

  useEffect(() => {
    if (!connection || !currentRoom) return;

    const interval = setInterval(async () => {
      try {
        console.log('[INTERVAL] Lade Profil und GrowPlans...');
        await loadUserProfile(true);
        await getGrowPlans();
        console.log('[INTERVAL] Profil und GrowPlans aktualisiert');
      } catch (err) {
        console.warn('[INTERVAL] Fehler beim regelmäßigen Abruf:', err.message);
      }
    }, 1000 * 60 * 5);

    return () => clearInterval(interval);
  }, [connection, currentRoom]);

  const generateEventId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Hilfsfunktion für Events MIT Callback (für UI-Requests)
  const sendAuthEventWithCallback = async (eventType, eventData) => {
    if (!connection) {
      throw new Error('No Home Assistant connection available');
    }

    logCurrentRoom(`sendAuthEventWithCallback(${eventType})`);

    const eventId = generateEventId();

    const responsePromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        callbacksRef.current.delete(eventId);
        console.error(`Request timeout for ${eventType} after 30 seconds`);
        reject(new Error(`Request timeout for ${eventType}`));
      }, 30000);

      callbacksRef.current.set(eventId, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          console.log(`Request ${eventId} resolved successfully`);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          console.error(`Request ${eventId} rejected:`, error);
          reject(error);
        }
      });
    });

    try {
      const messageData = {
        type: 'fire_event',
        event_type: eventType,
        event_data: {
          ...eventData,
          room: eventData?.room || currentRoom,
          event_id: eventId,
          atTime: new Date().toISOString(),
          // Include access token for authenticated requests
          ...(session?.access_token && { access_token: session.access_token }),
        },
      };

      await connection.sendMessagePromise(messageData);
      return responsePromise;
    } catch (error) {
      callbacksRef.current.delete(eventId);
      console.error(`Error sending ${eventType} event:`, error);
      throw error;
    }
  };



  const login = async (email, OGBToken, selectedRoom) => {
    // Prevent duplicate login calls
    if (loginInProgressRef.current) {
      console.warn('Login already in progress, ignoring duplicate call');
      return { success: false, message: 'Login already in progress' };
    }
    
    loginInProgressRef.current = true;
    setAuthStatus('authenticating');
    setLastError(null);

    try {
      const loginData = { email, OGBToken, room: selectedRoom }
      console.log("LOGINDATA:", loginData)
      const result = await sendAuthEventWithCallback('ogb_premium_login', loginData);
      return result;
    } catch (error) {
      setAuthStatus('error');
      setLastError(error.message);

      console.error('Login error:', error);
      throw error;
    } finally {
      // Reset login lock after completion (success or failure)
      loginInProgressRef.current = false;
    }
  };

  const logout = async () => {
    try {
      const result = await sendAuthEventWithCallback('ogb_premium_logout', {});
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  /**
   * Check if user can add/activate a new room based on session limits.
   * @returns {boolean} true if user CAN add a new room, false if limit reached
   */
  const canAddNewRoom = () => {
    // If no max sessions set, allow (API will enforce)
    if (!ogbMaxSessions || ogbMaxSessions <= 0) {
      return true;
    }
    // Can add if current sessions < max sessions
    return ogbSessions < ogbMaxSessions;
  };

  /**
   * Check if user has reached max room limit.
   * @returns {boolean} true if limit reached, false if can add more
   */
  const isMaxRoomsReached = () => {
    if (!ogbMaxSessions || ogbMaxSessions <= 0) {
      return false;
    }
    return ogbSessions >= ogbMaxSessions;
  };

  const getProfile = async () => {
    try {
      const result = await sendAuthEventWithCallback('ogb_premium_get_profile', {});
      return result;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  const addGrowPlan = async (growPlan) => {
    try {
      const result = await sendAuthEventWithCallback('ogb_premium_add_growplan', { growPlan });
      await getGrowPlans()
      return result;
    } catch (error) {
      console.error('Send growplan error:', error);
      throw error;
    }
  };

  const getGrowPlans = async (requestingRoom) => {
    if (operationLockRef.current) {
      console.log('Operation in progress, skipping getGrowPlans...');
      return;
    }

    try {
      operationLockRef.current = true;
      const roomToUse = requestingRoom || currentRoom;

      if(!isPremium)return

      await sendAuthEventWithCallback('ogb_premium_get_growplans', {
        requestingRoom: roomToUse
      });
    } catch (error) {
      console.error('Get growplans error:', error);
      throw error;
    } finally {
      operationLockRef.current = false;
    }
  };

  const delGrowPlan = async (growPlan, requestingRoom) => {
    try {
      const roomToUse = requestingRoom || currentRoom;
      
      const result = await sendAuthEventWithCallback('ogb_premium_del_growplan', { 
        growPlan, 
        requestingRoom: roomToUse 
      });

      await getGrowPlans()
      return result;
    } catch (error) {
      console.error('Delete growplan error:', error);
      throw error;
    }
  };

  const activateGrowPlan = async (growPlan, requestingRoom) => {
    try {
      const roomToUse = requestingRoom || currentRoom;
      console.log('activateGrowPlan with room:', roomToUse);
      
      const result = await sendAuthEventWithCallback('ogb_premium_growplan_activate', { 
        growPlan, 
        requestingRoom: roomToUse 
      });
      console.log("GrowPlan Activate:", result);
      return result;
    } catch (error) {
      console.error('Activate growplan error:', error);
      throw error;
    }
  };


  const pauseGrowPlan = async (growPlan, requestingRoom) => {
    try {
      const roomToUse = requestingRoom || currentRoom;
      console.log('Pause GrowPlan with room:', roomToUse);
      
      const result = await sendAuthEventWithCallback('ogb_premium_growplan_pause', { 
        growPlan, 
        requestingRoom: roomToUse 
      });
      console.log("GrowPlan Paused:", result);
      return result;
    } catch (error) {
      console.error('Paused growplan error:', error);
      throw error;
    }
  };


  const resumeGrowPlan = async (growPlan, requestingRoom) => {
    try {
      const roomToUse = requestingRoom || currentRoom;
      console.log('Pause GrowPlan with room:', roomToUse);
      
      const result = await sendAuthEventWithCallback('ogb_premium_growplan_resume', { 
        growPlan, 
        requestingRoom: roomToUse 
      });
      console.log("GrowPlan Paused:", result);
      return result;
    } catch (error) {
      console.error('Paused growplan error:', error);
      throw error;
    }
  };




  const updateProfile = async (profileData) => {
    try {
      const result = await sendAuthEventWithCallback('ogb_premium_update_profile', { 
        profile_data: profileData 
      });
      
      await loadUserProfile();
      
      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const clearError = () => {
    setLastError(null);
    if (authStatus === 'error') {
      setAuthStatus('idle');
    }
  };

  const debugPendingRequests = () => {
    console.log('Aktuelle callbacks:', {
      count: callbacksRef.current.size,
      callbacks: Array.from(callbacksRef.current.keys())
    });
  };

  const refreshProfile = async () => {
    try {
      await loadUserProfile(true);
    } catch (error) {
      console.error('Fehler beim Refresh des Profils:', error);
      throw error;
    }
  };

  /**
   * Disconnect a room from Premium mode by setting its mainControl to HomeAssistant.
   * This will free up a session slot for connecting another room.
   * @param {string} roomToDisconnect - The room name to disconnect
   * @returns {Promise<boolean>} - true if successful
   */
  const disconnectRoom = async (roomToDisconnect) => {
    if (!connection) {
      throw new Error('No Home Assistant connection available');
    }

    try {
      console.log(`🔌 Disconnecting room ${roomToDisconnect} from Premium...`);
      
      const entity_id = `select.ogb_maincontrol_${roomToDisconnect.toLowerCase()}`;
      
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'select',
        service: 'select_option',
        service_data: { 
          entity_id, 
          option: 'HomeAssistant' 
        },
      });

      console.log(`✅ Room ${roomToDisconnect} disconnected from Premium`);
      
      // Reset maxRoomsReached flag since we freed up a slot
      setMaxRoomsReached(false);
      
      // Refresh profile to get updated session counts
      await loadUserProfile(true);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to disconnect room ${roomToDisconnect}:`, error);
      throw error;
    }
  };

  /**
   * Switch Premium from one room to another.
   * First disconnects the old room, then connects the new one.
   * @param {string} fromRoom - The room currently using Premium
   * @param {string} toRoom - The room to switch Premium to
   * @returns {Promise<boolean>} - true if successful
   */
  const switchPremiumRoom = async (fromRoom, toRoom) => {
    if (!connection) {
      throw new Error('No Home Assistant connection available');
    }

    try {
      console.log(`🔄 Switching Premium from ${fromRoom} to ${toRoom}...`);
      
      // Step 1: Disconnect old room
      await disconnectRoom(fromRoom);
      
      // Step 2: Wait a moment for backend to process the disconnect
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Connect new room
      const newRoomEntityId = `select.ogb_maincontrol_${toRoom.toLowerCase()}`;
      
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'select',
        service: 'select_option',
        service_data: { 
          entity_id: newRoomEntityId, 
          option: 'Premium' 
        },
      });

      console.log(`✅ Premium switched from ${fromRoom} to ${toRoom}`);
      
      // Refresh profile to get updated session counts
      await loadUserProfile(true);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to switch Premium from ${fromRoom} to ${toRoom}:`, error);
      throw error;
    }
  };

  /**
   * Get list of rooms currently in Premium mode.
   * @returns {string[]} - Array of room names in Premium mode
   */
  const getPremiumRooms = () => {
    if (!entities) return [];
    
    const premiumRooms = [];
    Object.entries(entities).forEach(([key, entity]) => {
      const match = key.match(/^select\.ogb_maincontrol_(.+)$/);
      if (match && entity.state === 'Premium') {
        premiumRooms.push(match[1]);
      }
    });
    
    return premiumRooms;
  };

  return (
    <OGBPremiumContext.Provider
      value={{
        session,
        isPremium,
        isSubActive,
        ogbSessions,
        ogbMaxSessions,
        loading,
        subscription,
        userProfile,
        authStatus,
        lastError,
        publicGrowPlans,
        privateGrowPlans,
        strainGrowPlan,
        activeGrowPlan,
        growPlans,
        currentPlan,
        ///
        login,
        logout,
        getProfile,
        updateProfile,
        clearError,
        refreshProfile,
        debugPendingRequests,
        addGrowPlan,
        getGrowPlans,
        delGrowPlan,
        activateGrowPlan,
        canAddNewRoom,
        isMaxRoomsReached,
        maxRoomsReached,
        disconnectRoom,
        switchPremiumRoom,
        getPremiumRooms,
        // Helper to check if user is logged in (has valid session)
        isLoggedIn: authStatus === 'authenticated' && !!session,
        pauseGrowPlan,
        resumeGrowPlan,
        // Feature checking - returns isPremium status for now
        hasFeature: (feature) => {
          // Simple check based on premium status
          return isPremium;
        },
      }}
    >
      {children}
    </OGBPremiumContext.Provider>
  );
};

export const usePremium = () => useContext(OGBPremiumContext);
export const useOGBPremium = () => useContext(OGBPremiumContext); // Alias for consistency