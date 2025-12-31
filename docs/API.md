# API Reference - OpenGrowBox GUI

Complete reference for WebSocket events, entity naming, and service calls.

## Table of Contents

- [WebSocket Events](#websocket-events)
- [Entity Naming Conventions](#entity-naming-conventions)
- [Service Calls](#service-calls)
- [Event Data Structures](#event-data-structures)

## WebSocket Events

### State Changed Event

Emitted when any entity state changes in Home Assistant.

**Event Type:** `state_changed`

**Structure:**
```javascript
{
  event_type: "state_changed",
  data: {
    entity_id: "sensor.temperature_flower",
    old_state: {
      entity_id: "sensor.temperature_flower",
      state: "24.5",
      attributes: {
        unit_of_measurement: "°C",
        friendly_name: "Temperature",
        device_class: "temperature"
      },
      last_changed: "2025-12-29T10:00:00Z",
      last_updated: "2025-12-29T10:00:00Z"
    },
    new_state: {
      entity_id: "sensor.temperature_flower",
      state: "25.0",
      attributes: {
        unit_of_measurement: "°C",
        friendly_name: "Temperature",
        device_class: "temperature"
      },
      last_changed: "2025-12-29T10:05:00Z",
      last_updated: "2025-12-29T10:05:00Z"
    }
  },
  origin: "LOCAL",
  time_fired: "2025-12-29T10:05:00Z"
}
```

**Usage:**
```jsx
connection.subscribeEvents((event) => {
  const { entity_id, new_state } = event.data;
  if (entity_id.startsWith('sensor.')) {
    // Update sensor display
  }
}, 'state_changed');
```

### Log For Client Event

Emitted when backend sends a log entry to the frontend.

**Event Type:** `LogForClient`

**Structure:**
```javascript
{
  event_type: "LogForClient",
  time_fired: "2025-12-29T10:05:00Z",
  data: {
    // Room identification
    room: "flower tent",
    Name: "flower tent",
    room_name: "flower tent",

    // Optional message
    message: "VPD adjusted to optimal range",

    // Sensor readings
    VPD: 1.2,
    AvgTemp: 24.5,
    AvgHum: 55,

    // Device action
    Device: "Exhaust Fan",
    Action: "increase",
    capability: "fan",
    Cycle: true,

    // Light device data
    Dimmable: true,
    Voltage: 75,
    SunRise: true,
    SunSet: false,

    // Pump data
    Duration: 30,
    Interval: 300,
    FlowRate: 2.5,
    Runtime: 7200,
    CyclesToday: 24,

    // VPD Night Hold
    NightVPDHold: "Active",
    Name: "flower tent",

    // Deviation data
    tempDeviation: 0.5,
    humDeviation: -2,

    // Medium/plant data
    medium: true,
    medium_type: "COCOx3",
    medium_moisture: 45,
    medium_temp: 22,
    medium_ec: 1.8,
    medium_ph: 6.2,
    medium_sensors_total: 3,

    // Hydro mode
    Mode: "Hydro",
    Active: true,
    Cycle: true,
    Devices: {
      count: 2,
      devEntities: ["pump.nutrient", "pump.water"]
    },

    // Controller data
    controllerType: "PID",
    status: "active",
    message: "Optimizing climate",
    controlCommands: [
      {
        device: "Exhaust Fan",
        action: "increase",
        reason: "Temperature above target",
        priority: "high",
        timestamp: "2025-12-29T10:05:00Z"
      }
    ],
    pidStates: {
      vpd: {
        adaptiveHistory: [
          { time: 1234567890, value: 1.2 }
        ]
      }
    },

    // Crop steering
    Type: "CSLOG",
    Message: "Adjusting for week 3 of flowering",

    // Emergency
    blocked_actions: 5,
    emergency_conditions: [
      "Temperature too high",
      "Humidity too low"
    ],

    // Rotation
    rotation_success: true,

    // Missing pumps
    Type: "INVALID PUMPS"
  }
}
```

**Usage:**
```jsx
connection.subscribeEvents((event) => {
  const log = {
    room: event.data.room || event.data.Name,
    date: formatDateTime(event.time_fired),
    info: JSON.stringify(event.data)
  };
  setLogs(prev => [log, ...prev.slice(0, 50)]);
}, 'LogForClient');
```

### Medium Plants Update Event

Emitted when plant/medium data is updated.

**Event Type:** `MediumPlantsUpdate`

**Structure:**
```javascript
{
  event_type: "MediumPlantsUpdate",
  time_fired: "2025-12-29T10:05:00Z",
  data: {
    Name: "flower tent",
    plants: [
      {
        id: 1,
        name: "Gelato",
        stage: "flowering",
        daysInStage: 15,
        height: 85,
        health: "good"
      }
    ]
  }
}
```

**Usage:**
```jsx
connection.subscribeEvents((event) => {
  if (event.data.plants && Array.isArray(event.data.plants)) {
    setPlants(event.data.plants);
  }
}, 'MediumPlantsUpdate');
```

## Entity Naming Conventions

### Sensors

**Format:** `sensor.ogb_<sensor_type>_<room>`

**Examples:**
```
sensor.ogb_temperature_flower
sensor.ogb_humidity_veg
sensor.ogb_vpd_drying
sensor.ogb_dew_flower
sensor.ogb_co2_flower
sensor.ogb_duty_cycle_exhaust
sensor.ogb_soil_moisture_flower
```

**Sensor Types:**
- `temperature` - Air temperature
- `humidity` - Relative humidity
- `vpd` - Vapor pressure deficit
- `dew` - Dew point
- `co2` - Carbon dioxide
- `soil_moisture` - Soil/medium moisture
- `soil_ec` - Electrical conductivity
- `soil_ph` - pH level
- `light_intensity` - Light intensity
- `ppfd` - Photosynthetic photon flux density
- `dli` - Daily light integral
- `tank_level` - Water tank level
- `duty_cycle` - Fan/pump duty cycle

### Devices

**Lights:** `switch.ogb_<device>_<room>`, `light.ogb_<device>_<room>`
```
switch.ogb_led_1_flower
light.ogb_led_main_veg
```

**Fans:** `switch.ogb_<device>_<room>`, `fan.ogb_<device>_<room>`
```
switch.ogb_exhaust_flower
fan.ogb_intake_veg
```

**Climate:** `switch.ogb_<device>_<room>`, `climate.ogb_<device>_<room>`
```
switch.ogb_heater_flower
switch.ogb_humidifier_veg
switch.ogb_dehumidifier_drying
climate.ogb_climate_control_flower
```

**Pumps:** `switch.ogb_<device>_<room>`
```
switch.ogb_pump_nutrient_flower
switch.ogb_pump_water_veg
```

### Controls (Input Number)

**Format:** `number.ogb_<control>_<room>`

**Temperature Controls:**
```
number.ogb_mintemp_flower
number.ogb_maxtemp_flower
number.ogb_temperatureweight_flower
```

**Humidity Controls:**
```
number.ogb_minhum_flower
number.ogb_maxhum_flower
number.ogb_humidityweight_flower
```

**VPD Controls:**
```
number.ogb_vpdtarget_flower
```

**CO2 Controls:**
```
number.ogb_co2minvalue_flower
number.ogb_co2maxvalue_flower
number.ogb_co2targetvalue_flower
```

**Fan Controls:**
```
number.ogb_exhaust_duty_max_flower
number.ogb_exhaust_duty_min_flower
number.ogb_intake_duty_max_flower
number.ogb_intake_duty_min_flower
```

**Light Controls:**
```
number.ogb_ontime_flower
number.ogb_offtime_flower
number.ogb_sunrisetime_flower
number.ogb_sunsettime_flower
number.ogb_light_volt_min_flower
number.ogb_light_volt_max_flower
```

**Light Spectrum Controls:**
```
number.ogb_light_farred_start_duration_flower
number.ogb_light_farred_end_duration_flower
number.ogb_light_farred_intensity_flower
number.ogb_light_uv_delay_start_flower
number.ogb_light_uv_stop_before_end_flower
number.ogb_light_uv_max_duration_flower
number.ogb_light_uv_intensity_flower
number.ogb_light_blue_morning_boost_flower
number.ogb_light_blue_evening_reduce_flower
number.ogb_light_blue_transition_flower
number.ogb_light_red_morning_reduce_flower
number.ogb_light_red_evening_boost_flower
number.ogb_light_red_transition_flower
```

**Hydroponic Controls:**
```
number.ogb_hydropumpduration_flower
number.ogb_hydropumpintervall_flower
number.ogb_hydroretriveintervall_flower
number.ogb_hydroretriveduration_flower
```

**Feeding Controls:**
```
number.ogb_feed_ec_target_flower
number.ogb_feed_ph_target_flower
number.ogb_feed_tolerance_ec_flower
number.ogb_feed_tolerance_ph_flower
number.ogb_feed_nutrient_a_flower
number.ogb_feed_nutrient_b_flower
number.ogb_feed_nutrient_c_flower
number.ogb_feed_nutrient_w_flower
number.ogb_feed_nutrient_x_flower
number.ogb_feed_nutrient_y_flower
number.ogb_feed_nutrient_ph_flower
```

### Controls (Input Select)

**Format:** `select.ogb_<control>_<room>`

**Mode Controls:**
```
select.ogb_tentmode_flower
select.ogb_lightcontrol_flower
select.ogb_light_controltype_flower
select.ogb_light_ledtype_flower
select.ogb_co2_control_flower
```

**Light Spectrum Toggles:**
```
select.ogb_light_farred_enabled_flower
select.ogb_light_uv_enabled_flower
select.ogb_light_blue_enabled_flower
select.ogb_light_red_enabled_flower
```

**Enable Toggles:**
```
select.ogb_light_minmax_flower
select.ogb_ownweights_flower
select.ogb_minmax_control_flower
select.ogb_exhaust_minmax_flower
select.ogb_intake_minmax_flower
select.ogb_ventilation_minmax_flower
select.ogb_hydro_mode_flower
select.ogb_hydro_cycle_flower
select.ogb_hydro_retrive_flower
select.ogb_owndevicesets_flower
select.ogb_vpd_devicedampening_flower
```

### System Entities

```
select.ogb_rooms                    # Room selection
text.ogb_accesstoken               # Premium access token
input_text.ogb_server_url           # Backend server URL
```

## Service Calls

### Switch Service

**Turn On:**
```jsx
await callService('switch', 'turn_on', {
  entity_id: 'switch.ogb_led_1_flower'
});
```

**Turn Off:**
```jsx
await callService('switch', 'turn_off', {
  entity_id: 'switch.ogb_led_1_flower'
});
```

**Toggle:**
```jsx
await callService('switch', 'toggle', {
  entity_id: 'switch.ogb_led_1_flower'
});
```

### Light Service

**Turn On:**
```jsx
await callService('light', 'turn_on', {
  entity_id: 'light.ogb_led_main_veg',
  brightness: 200,  // 0-255
  transition: 2
});
```

**Turn Off:**
```jsx
await callService('light', 'turn_off', {
  entity_id: 'light.ogb_led_main_veg',
  transition: 2
});
```

**Set Brightness:**
```jsx
await callService('light', 'turn_on', {
  entity_id: 'light.ogb_led_main_veg',
  brightness: 150
});
```

### Fan Service

**Set Speed:**
```jsx
await callService('fan', 'set_percentage', {
  entity_id: 'fan.ogb_exhaust_flower',
  percentage: 75
});
```

**Turn On/Off:**
```jsx
await callService('fan', 'turn_on', {
  entity_id: 'fan.ogb_exhaust_flower'
});
```

### Input Number Service

**Set Value:**
```jsx
await callService('input_number', 'set_value', {
  entity_id: 'number.ogb_mintemp_flower',
  value: 20
});
```

### Input Select Service

**Select Option:**
```jsx
await callService('input_select', 'select_option', {
  entity_id: 'select.ogb_tentmode_flower',
  option: 'VPD Perfection'
});
```

### Climate Service

**Set Temperature:**
```jsx
await callService('climate', 'set_temperature', {
  entity_id: 'climate.ogb_climate_control_flower',
  temperature: 24
});
```

**Set HVAC Mode:**
```jsx
await callService('climate', 'set_hvac_mode', {
  entity_id: 'climate.ogb_climate_control_flower',
  hvac_mode: 'cool'
});
```

### Automation Service

**Trigger Automation:**
```jsx
await callService('automation', 'trigger', {
  entity_id: 'automation.grow_lights_on'
});
```

**Reload Automations:**
```jsx
await callService('automation', 'reload', {});
```

## Event Data Structures

### Sensor Data

**Temperature, Humidity, VPD:**
```javascript
{
  VPD: 1.2,              // Vapor pressure deficit (kPa)
  AvgTemp: 24.5,          // Average temperature (°C)
  AvgHum: 55,             // Average humidity (%)
  AvgDew: 15.2           // Average dew point (°C)
}
```

**CO2:**
```javascript
{
  co2: 800                // CO2 level (ppm)
}
```

**Soil/Medium:**
```javascript
{
  moisture: 45,            // Soil moisture (%)
  temp: 22,               // Soil temperature (°C)
  ec: 1.8,               // Electrical conductivity (mS/cm)
  ph: 6.2                 // pH level
}
```

**Light:**
```javascript
{
  intensity: 500,          // Light intensity (lux)
  ppfd: 350,             // PPFD (µmol/m²/s)
  dli: 25.5              // Daily light integral (mol/m²/d)
}
```

### Device Action Data

**Fan/Climate Device:**
```javascript
{
  Device: "Exhaust Fan",
  Action: "increase",
  capability: "fan",
  Cycle: true
}
```

**Light Device:**
```javascript
{
  Device: "LED Main",
  Action: "on",
  capability: "light",
  Dimmable: true,
  Voltage: 75,            // 0-100%
  SunRise: true,         // Sunrise phase active
  SunSet: false          // Sunset phase active
}
```

**Pump Device:**
```javascript
{
  Device: "Nutrient Pump",
  Action: "start",
  capability: "pump",
  Cycle: true,
  Duration: 30,          // Seconds
  Interval: 300,         // Seconds
  FlowRate: 2.5,         // L/min
  Runtime: 7200,         // Total runtime today (seconds)
  CyclesToday: 24        // Number of cycles today
}
```

### Controller Data

**PID Controller:**
```javascript
{
  controllerType: "PID",
  status: "active",
  message: "Optimizing climate",
  controlCommands: [
    {
      device: "Exhaust Fan",
      action: "increase",
      reason: "Temperature above target",
      priority: "high",     // high, medium, low
      timestamp: "2025-12-29T10:05:00Z"
    }
  ],
  pidStates: {
    vpd: {
      adaptiveHistory: [
        {
          time: 1735453500,
          value: 1.2
        }
      ],
      // Other PID states...
    }
  }
}
```

### Hydro Data

**Hydro Mode:**
```javascript
{
  Mode: "Hydro",
  Active: true,
  Cycle: true,
  Devices: {
    count: 2,
    devEntities: [
      "switch.ogb_pump_nutrient_flower",
      "switch.ogb_pump_water_veg"
    ]
  }
}
```

### Emergency Data

```javascript
{
  blocked_actions: 5,
  emergency_conditions: [
    "Temperature too high: 28°C",
    "Humidity too low: 30%",
    "VPD critical: 2.0 kPa"
  ]
}
```

### Medium/Plant Data

```javascript
{
  medium: true,
  medium_type: "COCOx3",
  medium_moisture: 45,
  medium_temp: 22,
  medium_ec: 1.8,
  medium_ph: 6.2,
  medium_sensors_total: 3,
  plants: [
    {
      id: 1,
      name: "Gelato",
      stage: "flowering",
      daysInStage: 15,
      height: 85,
      health: "good"
    }
  ]
}
```

### Night VPD Data

```javascript
{
  NightVPDHold: "Active",  // Active, NotActive, etc.
  Name: "flower tent"
}
```

### Deviation Data

```javascript
{
  tempDeviation: 0.5,     // Difference from target (°C)
  humDeviation: -2         // Difference from target (%)
}
```

## Error Codes

### Connection Errors

**`ERR_CONNECTION_REFUSED`**
- Home Assistant not accessible
- Check HA is running
- Verify network connection

**`ERR_INVALID_AUTH`**
- Invalid or expired token
- Re-authenticate with Home Assistant
- Update access token

**`ERR_CONNECTION_TIMEOUT`**
- Connection timed out
- Check network stability
- Increase timeout

### Service Errors

**`ERR_ENTITY_NOT_FOUND`**
- Entity ID doesn't exist
- Verify entity ID spelling
- Check entity exists in HA

**`ERR_SERVICE_NOT_FOUND`**
- Service not available for entity
- Check domain/service combination
- Verify entity type supports service

**`ERR_INVALID_VALUE`**
- Invalid value provided
- Check value range
- Verify data type

### Data Errors

**`ERR_MISSING_DATA`**
- Required data not provided
- Verify event structure
- Check backend logs

**`ERR_INVALID_DATA`**
- Data format incorrect
- Validate data structure
- Check data types

---

**End of API Reference**
