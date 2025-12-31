# User Documentation - OpenGrowBox GUI

Complete guide for using OpenGrowBox Home Assistant GUI to manage your grow operations.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard](#dashboard)
- [Device Control](#device-control)
- [Sensors & Metrics](#sensors--metrics)
- [Grow Book](#grow-book)
- [Settings](#settings)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

1. Open Home Assistant
2. Navigate to HACS (Home Assistant Community Store)
3. Search for "OpenGrowBox"
4. Click "Download" and follow installation wizard
5. Restart Home Assistant

### Initial Setup

1. Click "OpenGrowBox" in Home Assistant sidebar
2. Select your grow room (e.g., "flower tent", "veg tent", "drying room")
3. Configure sensors and devices
4. Set your grow parameters

### Navigation

The dashboard is organized into several pages:

- **🏠 Home**: Quick overview and main controls
- **📊 Dashboard**: Detailed metrics and charts
- **📖 Grow Book**: Grow logs, notes, and tracking
- **⚙️ Settings**: Configuration and preferences

Use the bottom navigation bar to switch between pages.

## Dashboard

### Main Overview

The dashboard shows:
- Current room status
- Key environmental metrics (temperature, humidity, VPD)
- Device states
- Recent activity

### Environmental Metrics

**Temperature**
- Displayed in Celsius
- Color-coded by status:
  - 🟢 Green: Optimal (18-25°C)
  - 🟡 Yellow: Warning (15-30°C)
  - 🔴 Red: Critical (outside range)

**Humidity**
- Displayed as percentage (%)
- Color-coded by status:
  - 🟢 Green: Optimal (40-60%)
  - 🟡 Yellow: Warning (30-70%)
  - 🔴 Red: Critical (outside range)

**VPD (Vapor Pressure Deficit)**
- Displayed in kPa
- Optimal range: 1.1-1.35 kPa
- Critical for plant transpiration

**CO2**
- Displayed in ppm
- Optimal for growth: 800-1200 ppm
- Warning levels: <400 or >1500 ppm

### Charts

**History Charts**
- Click on any sensor card to view historical data
- See trends over time
- Identify patterns and issues

## Device Control

### Device Card

Shows all controllable devices in your grow room:
- **Lights**: On/Off and dimming
- **Fans**: Exhaust and intake
- **Climate**: Heaters, coolers, humidifiers, dehumidifiers
- **Pumps**: Water and nutrient pumps

**Controls:**
- Toggle devices on/off
- Adjust brightness (for lights)
- Set duty cycles (for fans)
- View current status

### Room vs All Filter

- **Room**: Shows only devices in the currently selected room
- **All**: Shows all devices from all rooms

Use the toggle at the top of the device card to switch views.

### Control Modes

Different modes for controlling devices:

**VPD Perfection**
- Automatically adjusts devices to maintain optimal VPD
- Best for advanced growers

**PID Control**
- Proportional-Integral-Derivative control algorithm
- Precise climate management

**MPC Control**
- Model Predictive Control
- Advanced climate prediction

**Manual**
- Full manual control of all devices

## Sensors & Metrics

### Sensor Cards

Each sensor type has its own card:

- **Temperature**: Air temperature sensors
- **Humidity**: Relative humidity sensors
- **VPD**: Vapor pressure deficit (calculated)
- **CO2**: Carbon dioxide levels
- **Dew Point**: Calculated from temp/humidity
- **Duty Cycle**: Fan and pump duty cycles
- **Soil/Medium**: Moisture, EC, pH (if using sensors)
- **Light**: Intensity, PPFD, DLI

### Understanding the Colors

**Green (✅)**: Within optimal range
**Yellow (⚠️)**: Within acceptable range but needs attention
**Red (🚨)**: Critical - needs immediate action

### Room Filtering

Sensors can be filtered by room:
- **Room**: Shows sensors for current room only
- **All**: Shows all sensors from all rooms

Use the toggle at the top of each sensor section.

## Grow Book

### Grow Day Counter

- Tracks days in current grow cycle
- Displays current grow stage
- Shows total grow duration

### Grow Logs

Real-time event logging for your grow operations:

**Log Types:**
- 🌡️ **Sensors**: Environmental readings
- 🎛️ **Devices**: Device state changes
- 🎯 **Actions**: Control actions taken
- 💧 **Hydro**: Hydroponic system events
- 🎛️ **PID**: Controller events
- 🌱 **Medium**: Sensor readings from medium
- 🌙 **Night VPD**: Night mode events
- 🚨 **Emergency**: Critical system events

**Room Colors:**
Each room has a unique color for easy identification:
- Veg tent: Greenish
- Flower tent: Purple/pink
- Drying room: Orange/red
- (Colors are automatically generated based on room name)

**Searching Logs:**
- Use the search box to find specific events
- Filter by log type using the dropdown
- Click on a log entry to expand and see details

### Notes

Add notes to track:
- Plant observations
- Feeding schedules
- Deficiencies
- Growth milestones

## Settings

### Room Selection

Change the currently active grow room:
- Click on room selector
- Choose from available rooms
- Dashboard updates to show selected room's data

### Control Modes

Select the preferred control mode:
- Manual, VPD, PID, MPC
- Configure parameters for each mode

### Device Settings

**Own Device Sets**
- Map entities to device types
- Override automatic device detection

**Climate Devices**
- Select climate entities
- Configure min/max values

**Light Settings**
- Light control modes
- Dimming settings
- Sunrise/sunset phases
- UV, Far Red, Blue, Red spectrum controls

**Hydroponics**
- Pump settings
- Feeding schedules
- Nutrient dosing

**Target Values**
- Set optimal ranges for temperature, humidity, VPD
- Configure custom weights
- Set min/max limits

### Safe Mode

Enable Safe Mode to require confirmation before making changes:
- Prevents accidental device toggles
- Useful for critical grow periods

### Authentication

Login to premium features:
- Enter your credentials
- Access advanced controls
- Unlock premium features

## Troubleshooting

### Devices not responding

**Check:**
1. Is the device configured in Home Assistant?
2. Is the room selection correct?
3. Is Safe Mode enabled and requires confirmation?

**Solution:**
- Verify device entity IDs in Home Assistant
- Check room mapping
- Confirm or disable Safe Mode

### Missing sensors

**Check:**
1. Are sensors configured in Home Assistant?
2. Are they properly named?
3. Is the room filter set correctly?

**Solution:**
- Check sensor entity naming (should start with "sensor.")
- Verify room name matches in entity ID
- Try "All" filter to see if sensors appear

### Charts not loading

**Check:**
1. Is WebSocket connection established?
2. Are there historical records?

**Solution:**
- Refresh the page
- Check Home Assistant logs for errors
- Ensure sensors have been collecting data

### Connection Issues

**Symptoms:**
- Dashboard not updating
- Error messages in console
- Devices showing "unavailable"

**Check:**
1. Home Assistant is running
2. WebSocket connection is active
3. Access token is valid
4. Network connection is stable

**Solution:**
- Restart Home Assistant
- Refresh browser
- Check authentication
- Verify network connectivity

### Room colors not showing correctly

**Issue:** All rooms have same color

**Solution:**
- Refresh the page
- Colors are generated from room name hash
- Different room names = different colors

### White text on light backgrounds

**Issue:** Text hard to read on colored badges

**Solution:**
- This was fixed in v1.0.8
- Update to latest version
- Clear browser cache

## Tips & Best Practices

### For Best Results

1. **Start with Manual Mode** to understand your devices
2. **Gradually switch to automated modes** (VPD/PID)
3. **Monitor logs regularly** to catch issues early
4. **Set appropriate targets** based on plant stage
5. **Keep grow notes** for future reference

### Temperature & Humidity Guidelines

**Vegetative Stage:**
- Temperature: 22-26°C
- Humidity: 50-60%
- VPD: 0.8-1.0 kPa

**Flowering Stage:**
- Temperature: 20-24°C
- Humidity: 40-50%
- VPD: 1.2-1.5 kPa

**Drying/Curing:**
- Temperature: 18-21°C
- Humidity: 45-55%
- VPD: 0.9-1.2 kPa

### Light Guidelines

**Vegetative:**
- 18-24 hours light
- PPFD: 200-400 µmol/m²/s
- Blue spectrum for vegetative growth

**Flowering:**
- 12 hours light
- PPFD: 400-800 µmol/m²/s
- Red spectrum for flowering

## Getting Help

If you encounter issues not covered here:

1. Check Home Assistant logs for errors
2. Visit the OpenGrowBox community forum
3. Report bugs with details:
   - Browser version
   - Home Assistant version
   - OGB version
   - Steps to reproduce
   - Console errors

---

**Happy Growing! 🌱**
