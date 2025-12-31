const ogbversions = {
    backend:"v1.4.1",
    frontend:"v1.0.8",
    premapi:"v0.0.1"
}
const DEV_CONFIG = {
 
  // Dev-Modus (für lokale Entwicklung)
  IS_DEV_MODE: process.env.NODE_ENV === 'development' || 
               process.env.REACT_APP_DEV_MODE === 'true' ||
               window.location.hostname === 'localhost'
};

// Project Contributors (Hall of Fame)
const CONTRIBUTORS = [
  {name:"OpenGrowBox"},
  {name:"0xW3bJun6l3"},
  {name:"SZip"},
];

const premiumLaunchDate = new Date('2025-12-01T00:00:00Z'); 
const PREMIUM_RELEASE_DATE = new Date("2025-12-01T00:00:00Z");

export {
  ogbversions,
  DEV_CONFIG,
  CONTRIBUTORS,
  premiumLaunchDate,
  PREMIUM_RELEASE_DATE,
};
