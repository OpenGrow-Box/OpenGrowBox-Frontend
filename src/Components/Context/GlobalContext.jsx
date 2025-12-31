import { createContext, useContext, useState, useEffect } from 'react';
import { ogbversions } from '../../config';
import SecureTokenStorage from '../../utils/secureTokenStorage';

const GlobalStateContext = createContext();


const initialState = {
  Conf: {
    hassServer:"",
    haToken: null,
    hass:null,
  },
  OGBPremium:{
    access_token:null,
    refresh_token:null,
    user:null,
    plan:'free',
    isPremium:null,
  },
  hass:{},
  hassWS:{},
  Design: {
    theme: 'Main',
    availableThemes: ['Main', 'Unicorn', 'Hacky','BookWorm','BlueOcean','CyberPunk','Darkness','Aurora'],
  },
  Settings: {
    safeModeEnabled: true, // Enable safe mode by default to prevent accidental mobile changes
  },
};

export const GlobalStateProvider = ({ children }) => {
  const haHostDev = import.meta.env.VITE_HA_HOST;
  // Initialisierung des Zustands mit Werten aus dem localStorage, falls vorhanden
 
  const [state, setState] = useState(() => {
    try {
      const storedState = localStorage.getItem('globalOGBState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        // Merge with initialState to ensure new themes are included
        return {
          ...initialState,
          ...parsedState,
          Design: {
            ...initialState.Design,
            ...parsedState.Design,
            // Always use the latest availableThemes from initialState
            availableThemes: initialState.Design.availableThemes
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
    return initialState;
  });
  const [srvADDR,setSrvADDR] = useState(null)
  const [HASS,setHASS] = useState(null)
  const [accessToken,setAccessToken] = useState(null)
  const [entities, setEntities] = useState({});
  const [currentRoom, setCurrentRoom] = useState('');
  const [roomOptions, setRoomOptions] = useState([]);

  // Effekt zum Speichern des Zustands im localStorage bei Änderungen
  
   const setHASSAccessToken = (token) => {
     setAccessToken(token)
     setDeep("Conf.haToken",token)
     // Also save to SecureTokenStorage for persistence
     if (token) {
       SecureTokenStorage.storeToken(token);
     }
   }

  const setHASSServer = (addr) => {
    if(addr === null) return
    setSrvADDR(addr)
    setDeep("Conf.hassServer",addr)
  }

  const setHass = (hassObject) => {
    if(hassObject){
      setHASS(hassObject)
    }
  }

  useEffect(() => {
    if (!HASS?.states) return;

    const roomEntity = HASS.states['select.ogb_rooms'];

    if (roomEntity && roomEntity.state !== currentRoom) {
      setCurrentRoom(roomEntity.state || '');

      if (roomEntity.attributes?.options) {
        setRoomOptions(roomEntity.attributes.options);
      }
    }
  }, [HASS, currentRoom]);

  useEffect(() => {
    if (import.meta.env.PROD) {
      console.log(`
        OpenGrowBox: 🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱
        🖥 Frontend: ${ogbversions.frontend}
        ⚙️ Backend: ${ogbversions.backend}
        👑 Prem-API: ${ogbversions.premapi}
        Happy GROWING 🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱
        `)
    }else{
      console.log(`
        OpenGrowBox: 🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱
        🖥 Frontend: ${ogbversions.frontend}
        ⚙️ Backend: ${ogbversions.backend}
        👑 Prem-API: ${ogbversions.premapi}
        Happy GROWING 🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱
        `)
    }

    const hass = getHASS();
    setHass(hass)
    console.log("HASS:",hass)
  
  }, []);

   useEffect(() => {
     if (import.meta.env.PROD) {
       const hass = getHASS();
       setHass(hass)
       const haServer = hass.auth.data.hassUrl
       if (haServer !== null) {
         setHASSServer(haServer)
       }
     }else{
       // In dev mode, only set default server if not already configured
       const currentServer = state.Conf?.hassServer;
       if (!currentServer || currentServer.trim() === '') {
         setHASSServer(haHostDev)
       }
     }

   }, [srvADDR, state.Conf?.hassServer]);

   useEffect(() => {
     if (import.meta.env.PROD) {
       const hass = getHASS();
       const token = hass.states["text.ogb_accesstoken"].state
       setHASSAccessToken(token)
     }else{
       // Load token from SecureTokenStorage in dev mode
       const token = SecureTokenStorage.getToken();
       if (token) {
         setHASSAccessToken(token);
       }
     }

   }, [accessToken]);

  useEffect(() => {
    localStorage.setItem('globalOGBState', JSON.stringify(state));
  }, [state]);

  const updateState = (path, value) => {
    setState((prevState) => {
      const newState = { ...prevState };
      const keys = path.split('.');
      let current = newState;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const getDeep = (path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], state);
  };

  const setDeep = (path, value) => {
    setState((prevState) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const deepClone = JSON.parse(JSON.stringify(prevState));
      const nested = keys.reduce((acc, key) => acc[key], deepClone);
      nested[lastKey] = value;
      return deepClone;
    });
  };

  const getHASS = () => {
        if (import.meta.env.PROD) {
            const hass = document.querySelector('home-assistant')?.hass;
            return hass
        }else{
            console.error("NO HASS Object in Dev-Mode")
            return {noHASS:"IN-DEV"}
        }

  }

  return (
    <GlobalStateContext.Provider
      value={{
        state,
        updateState,
        getDeep,
        setDeep,
        getHASS,
        HASS,
        entities,
        currentRoom,
        setCurrentRoom,
        roomOptions,
        setRoomOptions,
        accessToken,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within GlobalStateProvider');
  }
  return context;
};
