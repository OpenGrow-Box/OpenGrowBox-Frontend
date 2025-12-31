# Developer Documentation - OpenGrowBox GUI

Technical documentation for contributing to and extending the OpenGrowBox Home Assistant GUI.

## Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Communication](#communication)
- [Styling](#styling)
- [Testing](#testing)
- [Building & Deployment](#building--deployment)
- [Contributing](#contributing)

## Project Structure

```
ogb-ha-gui/
├── src/
│   ├── Components/          # React components
│   │   ├── Cards/         # Display cards
│   │   │   ├── SliderCards/     # Sensor cards
│   │   │   ├── ControlCards/    # Device controls
│   │   │   └── ...
│   │   ├── Context/       # React Context providers
│   │   ├── Dashboard/     # Dashboard components
│   │   ├── GrowBook/      # Grow tracking
│   │   ├── Navigation/    # Navigation components
│   │   ├── Settings/      # Settings pages
│   │   └── Common/       # Shared components
│   ├── Pages/            # Route pages
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── misc/             # Misc helper files
│   ├── App.jsx           # Main App component
│   ├── main.jsx          # Entry point
│   └── config.js         # App configuration
├── public/               # Static assets
├── docs/                 # Documentation
├── package.json          # Dependencies
├── vite.config.ts        # Vite config
└── tsconfig.json         # TypeScript config
```

### Key Directories

**Components/Cards/**:
- `SliderCards/`: Sensor display cards (Temp, Hum, VPD, CO2, etc.)
- `ControlCards/`: Device control (Switch, Slider, Select, DeviceCard, etc.)

**Components/Context/**:
- `HomeAssistantContext.jsx`: WebSocket connection and HA data
- `GlobalContext.jsx`: Shared state across app
- `OGBPremiumContext.jsx`: Premium features and authentication
- `MediumContext.jsx`: Medium/plant data management

**Pages/**:
- `Home.jsx`: Main dashboard
- `Dashboard.jsx`: Detailed metrics
- `GrowBook.jsx`: Grow tracking and logs
- `Settings.jsx`: Configuration
- `Interface.jsx`: Layout wrapper

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Home Assistant instance (for PROD testing)
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ogb-ha-gui

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3004
```

### Development Workflow

```bash
# Start dev server
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env` file in root:

```env
# No environment variables required for basic development
# For PROD build, values come from Home Assistant
```

## Component Architecture

### Page Components

Pages are top-level components corresponding to routes:

```jsx
// Home.jsx
export default function Home() {
  return (
    <PageLayout>
      <DashboardStats />
      <ControlCollection />
      <DeviceCard />
    </PageLayout>
  );
}
```

### Card Components

Reusable UI cards for displaying data:

**Slider Cards** (Display sensors):
```jsx
<TempCard />
<HumCard />
<VPDCard />
<CO2Card />
```

**Control Cards** (Control devices):
```jsx
<SwitchCard entity_id="switch.example" />
<SliderCard entity_id="number.example" />
<SelectCard entity_id="select.example" />
```

### Component Props Pattern

Most cards follow this pattern:

```jsx
const MyCard = ({ entity_id, title, ...props }) => {
  const { entities, callService } = useHomeAssistant();

  const entity = entities[entity_id];

  return (
    <CardContainer>
      <Header>{title}</Header>
      <Content>{entity.state}</Content>
    </CardContainer>
  );
};
```

## State Management

### React Context

State is managed through React Context providers:

**HomeAssistantContext**
- WebSocket connection
- HA entities
- Services
- Current room

**GlobalContext**
- Shared application state
- HASS object (PROD only)

**OGBPremiumContext**
- Authentication
- Premium features
- Backend communication

**MediumContext**
- Plant/medium data
- WebSocket subscriptions

### Using Contexts

```jsx
import { useHomeAssistant } from '../Context/HomeAssistantContext';

function MyComponent() {
  const {
    entities,        // All HA entities
    currentRoom,    // Current selected room
    connection,     // WebSocket connection
    callService     // Call HA service
  } = useHomeAssistant();

  const entity = entities['sensor.example'];
  // ...
}
```

### Local State

Use `useState` for component-local state:

```jsx
const [isExpanded, setIsExpanded] = useState(false);
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  // Side effects
}, [dependencies]);
```

## Communication

### WebSocket Connection

The app communicates with Home Assistant via WebSocket through `HomeAssistantContext`:

```jsx
// Subscribe to events
connection.subscribeEvents((event) => {
  console.log('Event received:', event);
}, 'event_type');

// Call service
await callService('domain', 'service', {
  entity_id: 'switch.example',
  service_data: { /* options */ }
});
```

### WebSocket Events

**Common Event Types:**

`state_changed` - Entity state changes
```javascript
{
  type: "state_changed",
  entity_id: "sensor.temperature",
  new_state: { state: "25", attributes: {...} }
}
```

`LogForClient` - Grow log events
```javascript
{
  type: "LogForClient",
  data: {
    room: "flower tent",
    message: "VPD adjusted",
    timestamp: 1234567890
  }
}
```

`MediumPlantsUpdate` - Medium/plant updates
```javascript
{
  type: "MediumPlantsUpdate",
  data: {
    Name: "flower tent",
    plants: [/* plant objects */]
  }
}
```

### Service Calls

Call Home Assistant services:

```jsx
// Turn on a switch
await callService('switch', 'turn_on', {
  entity_id: 'switch.example'
});

// Set a number input
await callService('input_number', 'set_value', {
  entity_id: 'input_number.example',
  value: 50
});

// Select an option
await callService('input_select', 'select_option', {
  entity_id: 'input_select.example',
  option: 'option_name'
});
```

## Styling

### Styled Components

The project uses `styled-components` for styling:

```jsx
import styled from 'styled-components';

const CardContainer = styled.div`
  background: var(--main-bg-color, #1a1a1a);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    border-color: var(--primary-accent);
  }
`;
```

### CSS Variables

Theme colors are defined as CSS variables:

```javascript
// src/utils/themeColors.js
export const themeColors = {
  mainBgColor: '#0f0f0f',
  primaryAccent: '#0b95ea',
  mainTextColor: '#ffffff',
  // ...
};
```

Access in styled components:
```jsx
color: var(--primary-accent, #0b95ea);
```

### Responsive Design

Use media queries:

```jsx
const ResponsiveContainer = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;
```

## Testing

### Test Files

Test files are in `src/test/__tests__/`:
- `env-validation.test.js`
- `input-validation.test.js`
- `safe-json-parsing.test.js`
- `secure-token-storage.test.js`

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Structure

```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../utils/myFile';

describe('myFunction', () => {
  it('should return correct value', () => {
    expect(myFunction('input')).toBe('output');
  });

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

## Building & Deployment

### Development Build

```bash
npm run dev
# Runs on http://localhost:3004
```

### Production Build

```bash
npm run build
# Creates dist/ folder with optimized assets
```

### Build Output

The build creates:
- `dist/index.html` - Entry HTML
- `dist/assets/` - CSS, JS, and other assets
- Files are hashed for caching

### Deployment to Home Assistant

1. Build the app: `npm run build`
2. Copy contents of `dist/` to your Home Assistant `www/` folder
3. Add as custom panel in Home Assistant configuration
4. Restart Home Assistant

### Deployment Options

**Option 1: HA Panel (Recommended)**
- Built into Home Assistant
- Use Home Assistant panel

**Option 2: External Hosting**
- Host on any web server
- Connect via WebSocket
- Requires CORS configuration

**Option 3: Docker**
- Use provided Dockerfile
- Containerized deployment

## Contributing

### Code Style

- Use functional components with hooks
- Prefer styled-components over CSS files
- Follow existing naming conventions
- Add comments for complex logic
- Use TypeScript where possible (JSX files are JS, but TSConfig exists)

### Commit Messages

Follow conventional commits:

```
feat: add new sensor card for CO2
fix: correct temperature display in metric card
docs: update user documentation
style: improve card layout styling
refactor: simplify state management
test: add tests for utility functions
```

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit pull request with clear description

### Code Review Checklist

- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console warnings/errors
- [ ] Responsive design tested
- [ ] Accessibility considered

## Common Tasks

### Adding a New Sensor Card

1. Create `src/Components/Cards/SliderCards/NewSensor.jsx`:

```jsx
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';

const NewSensor = () => {
  const { entities } = useHomeAssistant();
  const [value, setValue] = useState('');

  useEffect(() => {
    const entity = entities['sensor.new_sensor'];
    if (entity) {
      setValue(entity.state);
    }
  }, [entities]);

  return (
    <CardContainer>
      <Header>New Sensor</Header>
      <Value>{value}</Value>
    </CardContainer>
  );
};

export default NewSensor;
```

2. Import and use in `DashboardSlider.jsx`
3. Add to slider menu

### Adding a New Control Card

Similar to sensor cards, but with controls:

```jsx
import { useState } from 'react';
import { useHomeAssistant } from '../../Context/HomeAssistantContext';
import SliderCard from './SliderCard';

const NewControl = () => {
  const { entities, callService } = useHomeAssistant();
  const [value, setValue] = useState(0);

  const handleChange = async (newValue) => {
    setValue(newValue);
    await callService('input_number', 'set_value', {
      entity_id: 'input_number.new_control',
      value: newValue
    });
  };

  return (
    <SliderCard
      entity_id="input_number.new_control"
      value={value}
      onChange={handleChange}
      min={0}
      max={100}
    />
  );
};
```

### Adding a New Page

1. Create `src/Pages/NewPage.jsx`
2. Add route in `App.jsx`
3. Add navigation item in `BottomBar.jsx`

## Debugging

### Browser Console

Open browser DevTools (F12) to see:
- Console errors/warnings
- Network requests
- React component tree
- State changes

### Common Issues

**WebSocket not connecting:**
- Check Home Assistant is running
- Verify token is valid
- Check network connection

**Entities not updating:**
- Verify entity IDs match Home Assistant
- Check WebSocket subscription
- Ensure event listener is set up

**Styling not applying:**
- Check styled-components syntax
- Verify CSS variable names
- Clear browser cache

## Performance Tips

1. **Memoize expensive computations:**
```jsx
const filteredData = useMemo(() => {
  return data.filter(/* filter logic */);
}, [data]);
```

2. **Avoid unnecessary re-renders:**
```jsx
const MemoizedComponent = memo(MyComponent);
```

3. **Debounce expensive operations:**
```jsx
import { debounce } from 'lodash';
const debouncedHandler = debounce(handler, 300);
```

4. **Optimize WebSocket subscriptions:**
- Only subscribe to needed events
- Clean up listeners on unmount

## Security

### Token Management

- Never log tokens to console
- Store tokens securely (use `secureTokenStorage.js`)
- Don't commit tokens to git
- Validate tokens before use

### User Input

- Sanitize all user inputs
- Use parameterized queries (if applicable)
- Validate entity IDs before use
- Escape HTML when rendering user content

## Resources

- [React Documentation](https://react.dev)
- [Styled Components](https://styled-components.com)
- [Vite Documentation](https://vitejs.dev)
- [Home Assistant API](https://developers.home-assistant.io/docs/api/rest/)
- [WebSocket Spec](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**Happy Coding! 🚀**
