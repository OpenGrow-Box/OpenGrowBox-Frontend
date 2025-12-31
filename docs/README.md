# OpenGrowBox Home Assistant GUI - Documentation

Welcome to the official documentation for the OpenGrowBox Home Assistant GUI project.

## 📚 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [For Users](#for-users)
- [For Developers](#for-developers)
- [Troubleshooting](#troubleshooting)

## Overview

OpenGrowBox Home Assistant GUI is a modern React-based dashboard for managing grow rooms through Home Assistant. It provides real-time monitoring, device control, climate management, and comprehensive logging capabilities.

### Key Features

- 🌱 **Real-time Monitoring**: Temperature, humidity, VPD, CO2, and more
- 🎛️ **Device Control**: Lights, fans, pumps, and climate devices
- 📊 **Data Visualization**: Interactive charts and metrics
- 📝 **Grow Logs**: Event logging with room-based filtering
- 🔒 **Secure Authentication**: JWT-based premium features
- 🎨 **Modern UI**: Dark theme with color-coded rooms
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

### Technology Stack

- **Frontend**: React 18, Vite, styled-components
- **Communication**: WebSocket to Home Assistant
- **State Management**: React Context API
- **Routing**: React Router
- **Icons**: React Icons (FontAwesome, etc.)
- **Backend**: Home Assistant + OGB Backend

## Quick Start

### For Users

1. **Install** the HACS integration or clone the repository
2. **Configure** Home Assistant with OpenGrowBox backend
3. **Access** the dashboard through Home Assistant
4. **Setup** your grow rooms and devices

See [USER.md](USER.md) for detailed user documentation.

### For Developers

```bash
# Clone the repository
git clone <repository-url>
cd ogb-ha-gui

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

See [DEVELOPER.md](DEVELOPER.md) for developer documentation.

## For Users

### 📘 [User Documentation](USER.md)

Complete guide for using OpenGrowBox GUI:
- Installation and setup
- Dashboard overview
- Device control
- Grow logs
- Settings and configuration
- Troubleshooting common issues

## For Developers

### 🛠️ [Developer Documentation](DEVELOPER.md)

Technical documentation for contributing:
- Project structure
- Development setup
- Component architecture
- State management
- WebSocket communication
- Testing
- Deployment

### 🏗️ [Architecture Documentation](ARCHITECTURE.md)

System architecture and design:
- Component hierarchy
- Data flow
- Context providers
- Communication patterns
- Security model

### 🔌 [API Reference](API.md)

API and interface documentation:
- WebSocket events
- Entity naming conventions
- Service calls
- Event handlers

### 🚀 [Deployment Guide](DEPLOYMENT.md)

Production deployment:
- Building the application
- Hosting options
- Home Assistant integration
- Environment variables
- Security considerations

## Troubleshooting

### Common Issues

**App won't load**
- Check browser console for errors
- Verify WebSocket connection to Home Assistant
- Ensure Home Assistant is running

**Devices not showing**
- Verify devices are configured in Home Assistant
- Check room selection
- Review entity naming conventions

**Premium features not working**
- Verify authentication token is valid
- Check backend connection
- Ensure subscription is active

### Getting Help

- 🐛 **Report Bugs**: Check existing issues or create a new one
- 💬 **Community**: Join the Discord/Forum
- 📖 **Documentation**: Read through the docs for detailed guides

## Project Status

**Current Version**: v1.0.8
**Backend Version**: v1.4.1
**Premium API**: v0.0.1

## License

This project is licensed under the MIT License.

## Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests to improve the project.

---

**Happy Growing! 🌱**
