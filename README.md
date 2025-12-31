# OpenGrowBox Home Assistant GUI

🌱 Modern React-based dashboard for managing grow rooms through Home Assistant.

![Version](https://img.shields.io/badge/version-1.0.8-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Home Assistant](https://img.shields.io/badge/home%20assistant-2024.12-orange)

## Features

- 🌡️ **Real-time Monitoring**: Temperature, humidity, VPD, CO2, and more
- 🎛️ **Device Control**: Lights, fans, pumps, and climate devices
- 📊 **Data Visualization**: Interactive charts and historical data
- 📝 **Grow Logs**: Real-time event logging with room-based filtering
- 🔒 **Secure Authentication**: JWT-based premium features
- 🎨 **Modern UI**: Dark theme with color-coded rooms
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## Quick Start

### For Users

1. Install via [HACS](https://hacs.xyz/) (Home Assistant Community Store)
2. Search for "OpenGrowBox"
3. Click "Download" and follow setup wizard
4. Access dashboard through Home Assistant sidebar

For detailed user documentation, see [docs/USER.md](docs/USER.md).

### For Developers

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

For developer documentation, see [docs/DEVELOPER.md](docs/DEVELOPER.md).

## Documentation

Comprehensive documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [README](docs/README.md) | Documentation overview and table of contents |
| [USER.md](docs/USER.md) | Complete user guide for using the application |
| [DEVELOPER.md](docs/DEVELOPER.md) | Developer guide for contributing and extending |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and design patterns |
| [API.md](docs/API.md) | WebSocket events and API reference |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment instructions |

## Technology Stack

- **Frontend**: React 18, Vite, styled-components
- **Communication**: WebSocket to Home Assistant
- **State Management**: React Context API
- **Routing**: React Router
- **Icons**: React Icons (FontAwesome, etc.)

## Project Structure

```
ogb-ha-gui/
├── src/
│   ├── Components/      # React components
│   ├── Pages/         # Route pages
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Main app
│   └── main.jsx       # Entry point
├── docs/             # Documentation
├── public/           # Static assets
├── package.json      # Dependencies
└── vite.config.ts    # Build config
```

## Development

```bash
# Start development server
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

## Contributing

We welcome contributions! Please read our [contributing guidelines](docs/DEVELOPER.md#contributing) before submitting pull requests.

## Known Issues

See [bugs.md](bugs.md) for known bugs and their status.

## License

This project is licensed under the MIT License.

## Support

- 🐛 **Report Bugs**: Check existing issues or create a new one
- 💬 **Community**: Join our community forum
- 📖 **Documentation**: See [docs/](docs/) for detailed guides

---

**Happy Growing! 🌱**
