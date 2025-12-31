# Architecture Documentation - OpenGrowBox GUI

System architecture, design patterns, and data flow.

## Table of Contents

- [System Overview](#system-overview)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [Communication Layer](#communication-layer)
- [State Management](#state-management)
- [Design Patterns](#design-patterns)
- [Security Model](#security-model)

## System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │              React App (Vite)                   │    │
│  │                                                  │    │
│  │  ┌──────────────────────────────────────┐       │    │
│  │  │      Page Components                │       │    │
│  │  │  (Home, Dashboard, GrowBook, etc.) │       │    │
│  │  └──────────────────────────────────────┘       │    │
│  │                    │                           │    │
│  │  ┌──────────────────────────────────────┐       │    │
│  │  │      Card Components               │       │    │
│  │  │  (SensorCards, ControlCards, etc.) │       │    │
│  │  └──────────────────────────────────────┘       │    │
│  │                    │                           │    │
│  │  ┌──────────────────────────────────────┐       │    │
│  │  │      Context Providers             │       │    │
│  │  │  (HA, Global, Premium, Medium)    │       │    │
│  │  └──────────────────────────────────────┘       │    │
│  │                    │                           │    │
│  │  ┌──────────────────────────────────────┐       │    │
│  │  │      WebSocket Client              │       │    │
│  │  └──────────────────────────────────────┘       │    │
│  │                    │                           │    │
│  └────────────────────┼───────────────────────────┘    │
│                       │                                │
└───────────────────────┼────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Home Assistant                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │      WebSocket Server                         │    │
│  └──────────────────────────────────────┬─────────┘    │
│                                         │              │
│  ┌───────────────────────────────────────┴─────────┐    │
│  │      State Machine                        │    │
│  │  (Entities, Devices, Services)              │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │      OGB Backend (Optional)              │    │
│  │  (Premium features, advanced logic)      │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 - UI framework
- Vite - Build tool and dev server
- styled-components - CSS-in-JS
- React Router - Client-side routing
- home-assistant-js-websocket - HA WebSocket client

**State Management:**
- React Context API - Global state
- useState/useReducer - Local state
- Custom hooks - Reusable state logic

**Communication:**
- WebSocket - Real-time communication
- REST API (via HA) - Initial data fetch

## Component Hierarchy

### Page Level

```
App
├── ErrorBoundary (Wrapper)
├── HomeAssistantProvider
├── OGBPremiumProvider
├── GlobalStateProvider
└── BrowserRouter
    └── Routes
        ├── / → Interface
        │   └── Home
        ├── /home → Home
        ├── /dashboard → Dashboard
        ├── /growbook → GrowBook
        └── /settings → Settings
```

### Card Level

```
DashboardSlider
├── TempCard
├── HumCard
├── VPDCard
├── CO2Card
└── ...

DashboardStats
├── TemperatureMetric
├── HumidityMetric
├── VPD Metric
└── ...

ControlCollection
├── SwitchCard
├── SliderCard
├── SelectCard
├── TimeCard
└── TextCard

DeviceCard
└── DeviceItem (for each device)
```

### Context Hierarchy

```
App
├── ErrorBoundary
│
├── HomeAssistantProvider (innermost)
│   └── Provides: entities, connection, currentRoom, callService
│
├── GlobalStateProvider
│   └── Provides: HASS object, room options
│
└── OGBPremiumProvider (outermost)
    └── Provides: authentication, premium features
```

## Data Flow

### Initial Load

1. **App mounts** → `useHomeAssistant()` initializes
2. **WebSocket connects** → Establishes connection to HA
3. **Fetch initial data** → Gets all entities and state
4. **Subscribe to events** → Listens for state changes
5. **Render components** → UI displays current state

### Real-time Updates

1. **State change occurs** in HA
2. **WebSocket event** → `state_changed` event received
3. **Update context** → `entities` updated in `HomeAssistantContext`
4. **Re-render components** → React re-renders affected components
5. **UI reflects new state** → User sees updated values

### User Interaction Flow

1. **User clicks button/slider**
2. **Event handler** → Component's onChange/onToggle
3. **Call service** → `callService()` from context
4. **Send to HA** → WebSocket sends service call
4. **HA executes** → Device state changes
5. **Event received** → `state_changed` event
6. **UI updates** → Components re-render with new state

### Data Flow Diagram

```
User Action
    │
    ▼
Component Handler
    │
    ▼
Context Service Call
    │
    ▼
WebSocket Message (to HA)
    │
    ▼
Home Assistant executes
    │
    ▼
WebSocket Event (from HA)
    │
    ▼
Context Updates State
    │
    ▼
Component Re-renders
    │
    ▼
UI Updated
```

## Communication Layer

### WebSocket Connection

**File:** `src/Components/Context/HomeAssistantContext.jsx`

**Initialization:**
```jsx
useEffect(() => {
  // Connect to HA WebSocket
  const connect = async () => {
    const ws = await createConnection({
      authToken: token,
    });
    setConnection(ws);
  };

  connect();
}, []);
```

**Subscriptions:**
```jsx
// Subscribe to state changes
connection.subscribeEvents((event) => {
  if (event.event_type === 'state_changed') {
    // Update local state
  }
}, 'state_changed');

// Subscribe to grow logs
connection.subscribeEvents((event) => {
  if (event.event_type === 'LogForClient') {
    // Add to log array
  }
}, 'LogForClient');
```

### Event Types

**State Change Event**
```javascript
{
  event_type: "state_changed",
  data: {
    entity_id: "sensor.temperature",
    new_state: {
      state: "25",
      attributes: {
        unit_of_measurement: "°C",
        friendly_name: "Temperature"
      }
    },
    old_state: { /* previous state */ }
  }
}
```

**Log Event**
```javascript
{
  event_type: "LogForClient",
  time_fired: 1234567890,
  data: {
    room: "flower tent",
    message: "VPD adjusted",
    Device: "Exhaust Fan",
    Action: "increase"
  }
}
```

**Medium Update Event**
```javascript
{
  event_type: "MediumPlantsUpdate",
  time_fired: 1234567890,
  data: {
    Name: "flower tent",
    plants: [
      {
        id: 1,
        name: "Gelato",
        stage: "flowering"
      }
    ]
  }
}
```

### Service Calls

**File:** `src/Components/Context/HomeAssistantContext.jsx`

```jsx
const callService = async (domain, service, serviceData) => {
  try {
    await connection.callService(domain, service, {
      entity_id: serviceData.entity_id,
      ...serviceData
    });
  } catch (error) {
    console.error('Service call failed:', error);
  }
};
```

**Usage:**
```jsx
// Turn on a light
await callService('light', 'turn_on', {
  entity_id: 'light.led_1'
});

// Set a number
await callService('input_number', 'set_value', {
  entity_id: 'input_number.temperature_target',
  value: 25
});

// Select an option
await callService('input_select', 'select_option', {
  entity_id: 'input_select.control_mode',
  option: 'vpd'
});
```

## State Management

### Context Providers

**HomeAssistantContext**

**Location:** `src/Components/Context/HomeAssistantContext.jsx`

**State:**
- `connection` - WebSocket connection object
- `entities` - All HA entities (keyed by entity_id)
- `currentRoom` - Currently selected room
- `roomOptions` - Available rooms
- `accessToken` - Auth token

**Methods:**
- `callService()` - Call HA service
- `subscribeEvents()` - Subscribe to WebSocket events
- `getConnection()` - Get current connection

**Usage Pattern:**
```jsx
const { entities, currentRoom, callService } = useHomeAssistant();

const tempEntity = entities['sensor.temperature'];
```

**GlobalStateProvider**

**Location:** `src/Components/Context/GlobalContext.jsx`

**State:**
- `HASS` - Home Assistant object (PROD only)
- `roomOptions` - Available rooms
- `currentRoom` - Current selected room

**Purpose:**
- Provides HASS object for PROD mode
- Manages room selection globally
- Legacy context (being phased out)

**OGBPremiumProvider**

**Location:** `src/Components/Context/OGBPremiumContext.jsx`

**State:**
- `connection` - OGB backend connection
- `isPremium` - Premium status
- `accessToken` - Premium token
- `user` - User data

**Methods:**
- `login()` - Login to premium
- `logout()` - Logout
- `refreshToken()` - Refresh token
- `subscribe()` - Subscribe to backend events

**Purpose:**
- Manages premium authentication
- Handles premium features
- Communicates with OGB backend

**MediumContext**

**Location:** `src/Components/Context/MediumContext.jsx`

**State:**
- `plants` - Plant/medium data
- `editingPlant` - Currently editing plant
- `mediums` - Available mediums

**Methods:**
- `updatePlant()` - Update plant data
- `addPlant()` - Add new plant
- `deletePlant()` - Delete plant
- `setEditing()` - Set editing state

**Purpose:**
- Manages plant/medium data
- Handles grow book functionality
- Syncs with backend

### Local State

For component-local state, use `useState`:

```jsx
const [isExpanded, setIsExpanded] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [logs, setLogs] = useState([]);

// For complex state
const [state, dispatch] = useReducer(reducer, initialState);
```

### State Updates

**Best Practices:**

1. **Functional updates** for derived state:
```jsx
// Bad
setCount(count + 1);

// Good
setCount(prev => prev + 1);
```

2. **Memoize expensive calculations:**
```jsx
const filteredData = useMemo(() => {
  return data.filter(item => item.room === currentRoom);
}, [data, currentRoom]);
```

3. **Batch updates** with single setState:
```jsx
// Bad
setStateA(newState);
setStateB(newState);

// Good
setCombinedState({ a: newState, b: newState });
```

## Design Patterns

### Provider Pattern

Context providers wrap the app to share state:

```jsx
<HomeAssistantProvider>
  <GlobalStateProvider>
    <OGBPremiumProvider>
      <App />
    </OGBPremiumProvider>
  </GlobalStateProvider>
</HomeAssistantProvider>
```

### Custom Hooks Pattern

Reusable logic encapsulated in hooks:

```jsx
// useSafeMode.js
export const useSafeMode = () => {
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const confirmChange = (action) => {
    if (isSafeMode) {
      setConfirmation(action);
    } else {
      action();
    }
  };

  return { isSafeMode, confirmation, confirmChange };
};
```

### Compound Component Pattern

Components that work together:

```jsx
<DashboardSlider>
  <TempCard />
  <HumCard />
  <VPDCard />
</DashboardSlider>
```

### Render Props Pattern

Render function as prop:

```jsx
<HistoryChart sensorId={sensor.id}>
  {({ data, loading }) => (
    <div>{loading ? 'Loading...' : renderChart(data)}</div>
  )}
</HistoryChart>
```

### Container/Presentation Pattern

Separate logic from rendering:

```jsx
// Container - handles logic
const TempCardContainer = () => {
  const { entities } = useHomeAssistant();
  const sensors = filterSensors(entities);
  return <TempCardPresentation sensors={sensors} />;
};

// Presentation - handles rendering
const TempCardPresentation = ({ sensors }) => (
  <Card>
    {sensors.map(sensor => <SensorItem key={sensor.id} {...sensor} />)}
  </Card>
);
```

## Security Model

### Authentication Flow

**Home Assistant Authentication:**

1. User logs into Home Assistant
2. HA generates long-lived access token
3. Token stored in localStorage (via `secureTokenStorage.js`)
4. Token sent with WebSocket connection
5. HA validates token on connection

**Premium Authentication:**

1. User logs in via OGB backend
2. Backend validates credentials
3. Backend generates JWT token
4. Token stored in localStorage
5. Token sent with requests to backend
6. Backend validates JWT on each request

### Token Storage

**Location:** `src/utils/secureTokenStorage.js`

```jsx
// Secure token storage with encryption
export const setToken = (key, value) => {
  const encrypted = encrypt(value);
  localStorage.setItem(key, encrypted);
};

export const getToken = (key) => {
  const encrypted = localStorage.getItem(key);
  return decrypt(encrypted);
};
```

### Security Best Practices

1. **Never log tokens to console**
```jsx
// Bad
console.log('Token:', token);

// Good
console.log('Token:', '[REDACTED]');
```

2. **Validate all inputs**
```jsx
const validateEntityId = (entityId) => {
  if (!entityId || !entityId.includes('.')) {
    throw new Error('Invalid entity ID');
  }
  return entityId;
};
```

3. **Sanitize user content**
```jsx
// Use dangerouslySetInnerHTML cautiously
<div dangerouslySetInnerHTML={{ __html: sanitize(userContent) }} />
```

4. **Use parameterized queries** (if using backend)
```jsx
// Bad
query(`SELECT * FROM users WHERE id = ${userId}`);

// Good
query(`SELECT * FROM users WHERE id = ?`, [userId]);
```

5. **Handle errors securely**
```jsx
try {
  // operation
} catch (error) {
  // Don't expose sensitive info to user
  console.error('Operation failed:', error.message);
  showGenericError();
}
```

### WebSocket Security

- Uses WSS (WebSocket Secure) for encrypted connection
- Token sent in initial connection handshake
- Connection re-establishes with same token
- Automatic reconnection on disconnect

### CORS Policy

For external hosting, configure CORS:

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://home-assistant:8123',
        changeOrigin: true,
        ws: true,
      }
    }
  }
});
```

## Performance Considerations

### Rendering Optimization

**Use React.memo:**
```jsx
const ExpensiveComponent = memo(({ data }) => {
  // Only re-renders if data changes
});
```

**Use useMemo:**
```jsx
const filtered = useMemo(() => {
  return data.filter(/* expensive filter */);
}, [data]);
```

**Use useCallback:**
```jsx
const handleClick = useCallback(() => {
  // Function reference stays same
}, [dependency]);
```

### WebSocket Optimization

**Limit subscriptions:**
```jsx
// Only subscribe to needed events
connection.subscribeEvents(handler, 'state_changed');
```

**Batch updates:**
```jsx
// Collect multiple state changes
const updates = [];
connection.subscribeEvents((event) => {
  updates.push(event.data);
  // Batch process updates
}, 'state_changed');
```

**Clean up listeners:**
```jsx
useEffect(() => {
  const unsubscribe = connection.subscribeEvents(handler, 'event');
  return () => unsubscribe();
}, []);
```

### Memory Management

**Clean up on unmount:**
```jsx
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    cancelSubscription();
    clearTimers();
  };
}, []);
```

**Limit data storage:**
```jsx
// Keep only recent logs
setLogs(prev => prev.slice(0, 50));
```

## Error Handling

### Global Error Boundary

**Location:** `src/misc/ErrorBoundary.jsx`

Catches React errors and displays fallback:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### WebSocket Errors

**Handle connection errors:**
```jsx
try {
  await connect();
} catch (error) {
  if (isAuthError(error)) {
    showLoginModal();
  } else {
    showGenericError();
  }
}
```

**Handle service call errors:**
```jsx
try {
  await callService('domain', 'service', data);
} catch (error) {
  console.error('Service call failed:', error);
  showToast('Failed to execute command', 'error');
}
```

### Data Validation

**Validate entity data:**
```jsx
const validateEntity = (entity) => {
  if (!entity || typeof entity !== 'object') {
    return null;
  }
  if (!entity.entity_id || !entity.state) {
    return null;
  }
  return entity;
};
```

**Validate WebSocket events:**
```jsx
const validateEvent = (event) => {
  if (!event || typeof event !== 'object') {
    return null;
  }
  if (!event.event_type || !event.data) {
    return null;
  }
  return event;
};
```

---

**End of Architecture Documentation**
