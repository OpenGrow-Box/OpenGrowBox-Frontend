// Fixed OGBPremiumContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useHomeAssistant } from '../Context/HomeAssistantContext';
import { useGlobalState } from './GlobalContext';

const OGBPremiumContext = createContext();

export const OGBPremiumProvider = ({ children }) => {
  const { setDeep } = useGlobalState();
  const [session, setSession] = useState(null);
  const {connection, currentRoom } = useHomeAssistant();
  const [isPremium, setIsPremium] = useState(false);
  const [ogbSessions, setOGBSessions] = useState(0);
  const [ogbMaxSessions, setOgbMaxConnections] = useState(0);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isSubActive, setIsSubActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [maxRoomsReached,setMaxRoomsReached] = useState(false)

  const [devTestUser,setDevTestUser] = useState({})

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

  // Debug-Funktion für currentRoom
  const logCurrentRoom = (functionName) => {
    console.log(`[${functionName}] currentRoom:`, currentRoom);
  };

  // Funktion zum Laden des Benutzerprofils über Home Assistant Event
  const loadUserProfile = async (force = false) => {
    if (isLoadingProfileRef.current && !force) {
      console.log('Profil wird bereits geladen, überspringe...');
      return;
    }

    try {
      if (!connection) throw new Error("No Home Assistant connection available");

      isLoadingProfileRef.current = true;
      console.log('Lade Benutzerprofil über HA Event...');
      logCurrentRoom('loadUserProfile');
              
      // Direkte Event-Sendung ohne Callback-Erwartung
      await connection.sendMessagePromise({
        type: 'fire_event',
        event_type: 'ogb_premium_get_profile',
        event_data: {
          room: currentRoom, // Hier explizit room hinzufügen
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
    }
  };

  // Hilfsfunktion zum Zurücksetzen der States
  const resetStates = () => {
    setSession(null);
    setIsPremium(false);
    setIsSubActive(false);
    setUserProfile(null);
    setSubscription(null);
    setAuthStatus('idle');

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
          setCurrentPlan(data?.currentPlan);
          setIsPremium(data?.is_premium);
          setSubscription(data?.subscription_data);
          setUserProfile(data.user);
          setIsSubActive(data.subscription_data?.active || false);
          setOGBSessions(data?.ogb_sessions || 0);
          setOgbMaxConnections(data?.ogb_max_sessions || 0);

          // Aktualisiere den globalen State mit Login-Daten
          setDeep("OGBPremium", {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
            currentPlan: data.currentPlan || "free",
            expires_at: data.expires_at,
            is_premium: data.is_premium || false,
            subscription_data: data.subscription_data
          });

          try {
            console.log('Lade Profil nach erfolgreichem Login...');
            await loadUserProfile(true);
            await getGrowPlans(currentRoom);
            console.log('Profil nach Login erfolgreich geladen');
          } catch (error) {
            console.error('Fehler beim Laden des Profils nach Login:', error);
          }
          break;

        case "DevLoginSuccess":
          setDevTestUser(data)
          break;

        case "Logout successful":
          resetStates();
          break;

        case "Profile retrieved":

          setUserProfile(data.user);
          setSubscription(data.subscription_data);
          setIsPremium(data.is_premium);
          setIsSubActive(data.subscription_data?.active || false);
          setOGBSessions(data?.ogb_sessions || 0);
          setOgbMaxConnections(data?.ogb_max_sessions || 0);
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
        responseListenerRef.current();
      }
      callbacksRef.current.clear();
    };
  }, [connection, setDeep]);

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

  const devUserLogin = async (email, ogbAccessToken,ogbBetaToken ) => {

    try {
      const testUserData = {email, ogbAccessToken, ogbBetaToken }
      const result = await sendAuthEventWithCallback('ogb_premium_devlogin', testUserData);
      return result;

    } catch (error) {

      setAuthStatus('error');
      setLastError(error.message);

      console.error('Login error:', error);
      throw error;
    }
  };

  const login = async (email, OGBToken, selectedRoom) => {
    setAuthStatus('authenticating');
    setLastError(null);


    try {
      const loginData = { email, OGBToken, room: selectedRoom }
      console.log("LOGINDATA:",loginData)
      const result = await sendAuthEventWithCallback('ogb_premium_login', loginData);
      return result;
    } catch (error) {
      setAuthStatus('error');
      setLastError(error.message);

      console.error('Login error:', error);
      throw error;
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

  const canAddNewRoom = () => {
    const isMax = ogbMaxSessions > 0 && ogbSessions >= ogbMaxSessions;
    return isMax;
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
    try {
      const roomToUse = requestingRoom || currentRoom;
     
      if(!isPremium)return

      await sendAuthEventWithCallback('ogb_premium_get_growplans', { 
        requestingRoom: roomToUse 
      });
    } catch (error) {
      console.error('Get growplans error:', error);
      throw error;
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
        devTestUser,
        currentPlan,
        ///
        devUserLogin,
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
        pauseGrowPlan,
        resumeGrowPlan,
      }}
    >
      {children}
    </OGBPremiumContext.Provider>
  );
};

export const usePremium = () => useContext(OGBPremiumContext);