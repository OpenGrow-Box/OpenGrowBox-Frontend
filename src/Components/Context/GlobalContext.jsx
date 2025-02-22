import React, { createContext, useContext, useState, useEffect } from 'react';

const GlobalStateContext = createContext();


const initialState = {
  Conf: {
    hassServer:"",
    haToken: null,
    hass:null,
  },
  hass:{},
  hassWS:{},
  Design: {
    theme: 'Main',
    availableThemes: ['Main', 'Unicorn', 'Hacky','BookWorm','BlueOcean','CyperPunk','Darkness'],
  },
};

export const GlobalStateProvider = ({ children }) => {
  // Initialisierung des Zustands mit Werten aus dem localStorage, falls vorhanden
  const [state, setState] = useState(() => {
    const storedState = localStorage.getItem('globalOGBState');
    return storedState ? JSON.parse(storedState) : initialState;
  });
  const [accessToken,setAccessToken] = useState(null)
  const [srvADDR,setSrvADDR] = useState(null)
  const [HASS,setHASS] = useState(null)
  // Effekt zum Speichern des Zustands im localStorage bei Änderungen
  
  const setHASSAccessToken = (token) => {
    setAccessToken(token)
    setDeep("Conf.haToken",token)
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
    if (import.meta.env.PROD) {
      const hass = getHASS();
      setHass(hass)
      const haServer = hass.auth.data.hassUrl
      if (haServer !== null) {
        setHASSServer(haServer)
      }
    }else{
      setHASSServer('http://10.1.1.253:8123')
    }

  }, [srvADDR]);

  useEffect(() => {
    if (import.meta.env.PROD) {
      const hass = getHASS();
      setHass(hass)
      const accessToken = hass.auth.data.access_token
      if (accessToken) {
        setHASSAccessToken(accessToken)
      }
    }else{
      const devToken = localStorage.getItem('haDevToken')
      setHASSAccessToken(devToken)
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
            return {NOHASS:"NOTHING"}
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
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
