import React, { useState, useMemo } from 'react';
import SelectCard from './SelectCard';
import SliderCard from './SliderCard';
import SwitchCard from './SwitchCard';
import TimeCard from './TimeCard';
import { useHomeAssistant } from "../../Context/HomeAssistantContext";


const dynamicFilters = {

  tent_mode: {
    selectEntity: 'ogb_tentmode_',
    activeInGroups: ['Main Control'], 
    conditions: {
      'Drying': {
        includeKeywords: ['drying'],
        excludeKeywords: ['vpd', 'plant', 'stage', 'light', 'co2', "m2", "leaf", 'feed', 'hydro'],
        additionalTooltips: {}
      },
      'VPD Perfection': {
        includeKeywords: ['leaf'],
        excludeKeywords: ['drying', "template", "target", "weigh", "feed", 'hydro'],
        additionalTooltips: {}
      },
      'PID Control': {
        includeKeywords: ['pid', 'proportional', 'integral', 'derivative'],
        excludeKeywords: ['drying', 'mpc',  'hydro','target'],
        additionalTooltips: {
          'ogb_pid_kp_': 'Proportional gain for PID controller',
          'ogb_pid_ki_': 'Integral gain for PID controller',
          'ogb_pid_kd_': 'Derivative gain for PID controller'
        }
      },
      'MPC Control': {
        includeKeywords: ['mpc', 'model', 'predictive'],
        excludeKeywords: ['drying', 'mpc', 'hydro','target'],
        additionalTooltips: {
          'ogb_mpc_horizon_': 'Prediction horizon for MPC controller',
          'ogb_mpc_control_': 'Control horizon for MPC controller'
        }
      },
      'VPD Target': {
        includeKeywords: ['leaf'],
        excludeKeywords: ['drying', "template", "weigh", 'hydro'],
        additionalTooltips: {}
      },
      'Disabled': {
        includeKeywords: ['Tent Mode'],
        excludeKeywords: ["hold", "device", "work", "ambient", "target", "vpd", 'hydro','drying','offset'],
        additionalTooltips: {}
      }
    }
  },

  light_control: {
    selectEntity: 'ogb_lightcontrol_',
    activeInGroups: ['Lights'], 
    conditions: {
      'NO': {
        includeKeywords: ["light"],
        excludeKeywords: ["vpd","min","max","sun","Time"],
        additionalTooltips: {}
      },
      'YES': {
        includeKeywords: ["light"],
        excludeKeywords: [],
        additionalTooltips: {}
      }
    }
  },

  light_control_min_max: {
    selectEntity: 'ogb_light_minmax_',
    activeInGroups: ['Lights'], 
    conditions: {
      'NO': {
        includeKeywords: ["lights"],
        excludeKeywords: ["volt"],
        additionalTooltips: {}
      },
      'YES': {
        includeKeywords: ["lights"],
        excludeKeywords: [],
        additionalTooltips: {}
      }
    }
  },

  co2_control: {
    selectEntity: 'ogb_co2_control_',
    activeInGroups: ['CO₂ Control'], 
    conditions: {
      'YES': {
        includeKeywords: [],
        excludeKeywords: [],
        additionalTooltips: {

        }
      },
      'NO': {
        includeKeywords: ["co2"],
        excludeKeywords: ["max","min","target"],
        additionalTooltips: {

        }
      }
    }
  },

  weight_control: {
    selectEntity: 'ogb_ownweights_',
    activeInGroups: ['Targets'], 
    conditions: {
      'YES': {
        includeKeywords: [],
        excludeKeywords: [],
        additionalTooltips: {

        }
      },
      'NO': {
        includeKeywords: [],
        excludeKeywords: ["temperature","humidity"],
        additionalTooltips: {}
      }
    }
  },

  minMax_control: {
    selectEntity: 'ogb_minmax_control_',
    activeInGroups: ['Targets'], 
    conditions: {
      'YES': {
        includeKeywords: [],
        excludeKeywords: [],
        additionalTooltips: {}
      },
      'NO': {
        includeKeywords: [],
        excludeKeywords: ["temp","hum"],
        additionalTooltips: {

        }
      }
    }
  },

  ventilation_control: {
    selectEntity: 'ogb_ventilation_minmax_',
    activeInGroups: ['Targets'],
    conditions: {
      'YES': {
        includeKeywords: [],
        excludeKeywords: [],
        additionalTooltips: {}
      },
      'NO': {
        includeKeywords: [],
        excludeKeywords: ["ventilation_duty"],
        additionalTooltips: {

        }
      }
    }
  },

  exhaust_control: {
    selectEntity: 'ogb_exhaust_minmax_',
    activeInGroups: ['Targets'], 
    conditions: {
      'YES': {
        includeKeywords: [],
        excludeKeywords: [],
        additionalTooltips: {}
      },
      'NO': {
        includeKeywords: [],
        excludeKeywords: ["exhaust_duty"],
        additionalTooltips: {

        }
      }
    }
  },

  intake_control: {
    selectEntity: 'ogb_intake_minmax_',
    activeInGroups: ['Targets'], 
    conditions: {
      'YES': {
        includeKeywords: [],
        excludeKeywords: [],
        additionalTooltips: {}
      },
      'NO': {
        includeKeywords: [],
        excludeKeywords: ["intake_duty"],
        additionalTooltips: {

        }
      }
    }
  },

  hydro_mode: {
    selectEntity: 'ogb_hydro_mode_',
    activeInGroups: ['Hydro Settings'], 
    conditions: {
      // NEXT IMPLEMENTATION 
      'Crop-Steering': {
        includeKeywords: ['crop', 'steering', 'dry', 'wet', 'shoot'],
        excludeKeywords: ['pump', 'leaf', 'duration', 'intervall', 'cycle', 'Retrive','drying'],
        additionalTooltips: {
          'ogb_crop_dry_back_': 'Set the dry-back percentage for crop steering cycles',
          'ogb_crop_wet_time_': 'Set duration for wet phase in crop steering',
          'ogb_crop_shoot_count_': 'Number of irrigation shots per day'
        }
      },
      'Hydro': {
        includeKeywords: ['hydro', 'pump', 'duration', 'intervall', 'cycle', 'Retrive'],
        excludeKeywords: ['crop', 'steering', 'dry', 'wet', 'shoot', 'food', 'leaf'],
        additionalTooltips: {
          'ogb_hydropumpduration_': 'Duration the hydro pump stays active',
          'ogb_hydropumpintervall_': 'Interval between hydro pump cycles'
        }
      },
      'Plant-Watering': {
        includeKeywords: ['hydro', 'pump', 'duration', 'intervall', 'cycle', 'Retrive'],
        excludeKeywords: ['crop', 'steering', 'dry', 'wet', 'shoot', 'food', 'leaf'],
        additionalTooltips: {
          'ogb_waterpump_device_select_': 'Select water pump for simple watering'
        }
      },
      'OFF': {
        includeKeywords: ["hydro"],
        excludeKeywords: ['crop', 'steering', 'dry', 'wet', 'shoot', 'food', 'leaf', 'duration', 'intervall', "cycle", "Retrive"],
        additionalTooltips: {}
      }
    }
  },
  
  feed_plan: {
    selectEntity: 'ogb_feed_plan_',
    activeInGroups: ['Feed Settings'],
    conditions: {
      'Tank Feed': {
        includeKeywords: ['feed', 'nutrient', 'ec', 'ph', 'tolerance', 'tank'],
        excludeKeywords: ['plant', 'individual', 'hydro'],
        additionalTooltips: {
          'ogb_feed_ec_target_': 'EC target for tank feeding system',
          'ogb_feed_ph_target_': 'pH target for tank feeding system'
        }
      },
      'Plant Feed': {
        includeKeywords: ['feed', 'nutrient', 'plant', 'individual'],
        excludeKeywords: ['tank', 'ec', 'ph', 'hydro'],
        additionalTooltips: {
          'ogb_feed_nutrient_a_': 'Nutrient A dosing per plant',
          'ogb_feed_nutrient_b_': 'Nutrient B dosing per plant'
        }
      },
      'Custom Mix': {
        includeKeywords: ['feed', 'nutrient', 'custom', 'mix', 'recipe'],
        excludeKeywords: [],
        additionalTooltips: {
          'ogb_feed_custom_recipe_': 'Define custom nutrient mixing recipe'
        }
      },
      'Disabled': {
        includeKeywords: ['feed'],
        excludeKeywords: ['target','nutrient','tolerance'],
        additionalTooltips: {}
      }
    }
  },

};

const groupMappings = {
  'Main Control': {
    includeKeywords: ['vpd', 'plant', 'mode', 'leaf', 'ambient', 'area'],
    excludeKeywords: ['proportional', 'derivativ', 'integral', 'light', 'food', 'days', 'hydro', 'Count', 'Borrow'],
  },
  'Lights': {
    includeKeywords: ['light', 'sun'],
    excludeKeywords: ['Device'],
  },
  'CO₂ Control': {
    includeKeywords: ['co2'],
    excludeKeywords: ['Device'],
  },
  'Hydro Settings': {
    includeKeywords: ['pump', 'water', 'Hydro'],
    excludeKeywords: ['Device','nutrient'],
  },
  'Feed Settings': {
    includeKeywords: ['pump', 'feed', 'nutrient'],
    excludeKeywords: ['Device', 'water', 'hydro'],
  },
  'Special Settings': {
    includeKeywords: [''],
    excludeKeywords: [''],
  },
  'Targets': {
    includeKeywords: ['weight', 'min', 'max'],
    excludeKeywords: ['co2', 'Light', 'Inhaust'],
  },
  'Drying': {
    includeKeywords: ['drying'],
    excludeKeywords: [
      'device', 'vpd', 'temp', 'hum', 'co2', 'light',
      'sun', 'stage', 'plant', 'leaf', 'borrow', 'weigh',
    ],
  },
  'Controller Settings': {
    includeKeywords: ['pid', 'mpc', 'proportional', 'integral', 'derivative', 'horizon'],
    excludeKeywords: ['device'],
  },
};

const ControllCollection = ({ option }) => {
  const { entities, currentRoom } = useHomeAssistant();
  const [currentControl, setCurrentControl] = useState('Home');

  const entityTooltips = {
    [`ogb_plantstage_${currentRoom?.toLowerCase()}`]: 'Set the current plant stage. Lights will adjust to the new min/max if dimmable.',
    [`ogb_tentmode_${currentRoom?.toLowerCase()}`]: 'Select a grow mode to activate automated control. Check the wiki for detailed mode descriptions.',
    [`ogb_holdvpdnight_${currentRoom?.toLowerCase()}`]: 'Enable to control VPD during nighttime. If disabled, all devices will turn off at night.',
    [`ogb_dryingmodes_${currentRoom?.toLowerCase()}`]: 'Select your preferred drying technique. Make sure Tent Mode is set to "Drying".',
    [`ogb_workmode_${currentRoom?.toLowerCase()}`]: 'Use this mode when working on your plants. It will dim the lights and reduce device activity until you deactivate it again.',

    [`ogb_leaftemp_offset_${currentRoom?.toLowerCase()}`]: 'Override the detected leaf temperature by automation if needed.',
    [`ogb_vpdtarget_${currentRoom?.toLowerCase()}`]: 'Set your target VPD. Works only in "Targeted VPD" Tent Mode.',
    [`ogb_vpdtolerance_${currentRoom?.toLowerCase()}`]: 'Adjust tolerance between Targeted VPD and Perfect VPD.',

    [`ogb_lightcontrol_${currentRoom?.toLowerCase()}`]: 'Enable to control lights via OpenGrowBox.',
    [`ogb_vpdlightcontrol_${currentRoom?.toLowerCase()}`]: 'If enabled, light intensity will shift between min/max to help regulate VPD.',

    [`ogb_lightontime_${currentRoom?.toLowerCase()}`]: 'Set the time to turn on the lights (e.g. 20:00:00). Requires Light Control enabled.',
    [`ogb_lightofftime_${currentRoom?.toLowerCase()}`]: 'Set the time to turn off the lights (e.g. 08:00:00). Requires Light Control enabled.',

    [`ogb_sunrisetime_${currentRoom?.toLowerCase()}`]: 'Set sunrise phase duration (e.g. 00:30:00). Requires dimmable lights and Light Control.',
    [`ogb_sunsettime_${currentRoom?.toLowerCase()}`]: 'Set sunset phase duration (e.g. 00:30:00). Requires dimmable lights and Light Control.',

    [`ogb_light_minmax_${currentRoom?.toLowerCase()}`]: 'Enable to use custom min/max light voltage. Set values before enabling.',
    [`ogb_light_volt_min_${currentRoom?.toLowerCase()}`]: 'Set the minimum voltage. Requires Light Min/Max enabled.',
    [`ogb_light_volt_max_${currentRoom?.toLowerCase()}`]: 'Set the maximum voltage. Requires Light Min/Max enabled.',

    [`ogb_co2_control_${currentRoom?.toLowerCase()}`]: 'Enable CO₂-based environmental control.',
    [`ogb_co2minvalue_${currentRoom?.toLowerCase()}`]: 'Set minimum CO₂ value.',
    [`ogb_co2maxvalue_${currentRoom?.toLowerCase()}`]: 'Set maximum CO₂ value.',
    [`ogb_co2targetvalue_${currentRoom?.toLowerCase()}`]: 'Set target CO₂ value.',

    [`ogb_ownweights_${currentRoom?.toLowerCase()}`]: 'Enable to define custom temperature/humidity weights (e.g. 1:1.25 in late flower).',
    [`ogb_minmax_control_${currentRoom?.toLowerCase()}`]: 'Enable to set custom min/max values for controllers.',
    [`ogb_exhaust_minmax_${currentRoom?.toLowerCase()}`]: 'Enable to set custom exhaust min/max values.',
    [`ogb_intake_minmax_${currentRoom?.toLowerCase()}`]: 'Enable to set custom intake min/max values.',
    [`ogb_ventilation_minmax_${currentRoom?.toLowerCase()}`]: 'Enable to set custom ventilation min/max values.',

    [`ogb_temperatureweight_${currentRoom?.toLowerCase()}`]: 'Set custom temperature weight. Requires custom weights enabled.',
    [`ogb_humidityweight_${currentRoom?.toLowerCase()}`]: 'Set custom humidity weight. Requires custom weights enabled.',
    [`ogb_mintemp_${currentRoom?.toLowerCase()}`]: 'Set custom minimum temperature. Requires Min/Max Control enabled.',
    [`ogb_maxtemp_${currentRoom?.toLowerCase()}`]: 'Set custom maximum temperature. Requires Min/Max Control enabled.',
    [`ogb_minhum_${currentRoom?.toLowerCase()}`]: 'Set custom minimum humidity. Requires Min/Max Control enabled.',
    [`ogb_maxhum_${currentRoom?.toLowerCase()}`]: 'Set custom maximum humidity. Requires Min/Max Control enabled.',

    [`ogb_exhaust_duty_max_${currentRoom?.toLowerCase()}`]: 'Set custom max duty cycle for exhaust. Requires Exhaust Min/Max enabled.',
    [`ogb_exhaust_duty_min_${currentRoom?.toLowerCase()}`]: 'Set custom min duty cycle for exhaust. Requires Exhaust Min/Max enabled.',
    [`ogb_intake_duty_max_${currentRoom?.toLowerCase()}`]: 'Set custom max duty cycle for intake. Requires Exhaust Min/Max enabled.',
    [`ogb_intake_duty_min_${currentRoom?.toLowerCase()}`]: 'Set custom min duty cycle for intake. Requires Exhaust Min/Max enabled.',
   
    [`ogb_ventilation_duty_max_${currentRoom?.toLowerCase()}`]: 'Set custom max duty cycle for ventilation. Requires Ventilation Min/Max enabled.',
    [`ogb_ventilation_duty_min_${currentRoom?.toLowerCase()}`]: 'Set custom min duty cycle for ventilation. Requires Ventilation Min/Max enabled.',

    [`ogb_hydro_mode_${currentRoom?.toLowerCase()}`]: 'Enable for plant watering or hydro systems. Watering defaults to always cycling.',
    [`ogb_hydro_cycle_${currentRoom?.toLowerCase()}`]: 'Enable to use interval and duration for water cycling.',
    [`ogb_hydropumpduration_${currentRoom?.toLowerCase()}`]: 'Set how long the pump stays active. Requires Hydro Mode and cycling enabled.',
    [`ogb_hydropumpintervall_${currentRoom?.toLowerCase()}`]: 'Set pump pause interval. Requires Hydro Mode and cycling enabled.',

    [`ogb_hydro_retrive_${currentRoom?.toLowerCase()}`]: 'Enable for Retrive Water System.',
    [`ogb_hydroretriveintervall_${currentRoom?.toLowerCase()}`]: 'Set pump pause interval for Retrive.',
    [`ogb_hydroretriveduration_${currentRoom?.toLowerCase()}`]: 'Set how long the pump stays active in Retrive',

    [`ogb_feed_plan_${currentRoom?.toLowerCase()}`]: 'Select your tank Feed/Plant Feed plan',

    [`ogb_feed_ec_target_${currentRoom?.toLowerCase()}`]: 'Set your EC Target',
    [`ogb_feed_ph_target_${currentRoom?.toLowerCase()}`]: 'Set your PH Target',
    [`ogb_feed_tolerance_ec_${currentRoom?.toLowerCase()}`]: 'Set your EC Tolerance in %',
    [`ogb_feed_tolerance_ph_${currentRoom?.toLowerCase()}`]: 'Set your PH Tolerance in %',

    [`ogb_feed_nutrient_a_${currentRoom?.toLowerCase()}`]: 'Set your Pump ML value it Provides on x/ML',
    [`ogb_feed_nutrient_b_${currentRoom?.toLowerCase()}`]: 'Set your Pump ML value it Provides on x/ML',
    [`ogb_feed_nutrient_c_${currentRoom?.toLowerCase()}`]: 'Set your Pump ML value it Provides on x/ML',
    [`ogb_feed_nutrient_w_${currentRoom?.toLowerCase()}`]: 'Set your Pump ML value it Provides on x/ML',
    [`ogb_feed_nutrient_x_${currentRoom?.toLowerCase()}`]: 'Set your Pump ML value it Provides on x/ML',
    [`ogb_feed_nutrient_y_${currentRoom?.toLowerCase()}`]: 'Set your Pump ML value it Provides on x/ML',
    [`ogb_feed_nutrient_ph_${currentRoom?.toLowerCase()}`]: 'Set your Pump ML value it Provides on x/ML',

    [`ogb_owndevicesets_${currentRoom?.toLowerCase()}`]: 'Enable to manually map entities to device types. Default uses naming convention.',
    [`ogb_light_device_select_${currentRoom?.toLowerCase()}`]: 'Select a light entity. Requires Own Device Sets enabled.',
    [`ogb_exhaust_device_select_${currentRoom?.toLowerCase()}`]: 'Select an exhaust entity. Requires Own Device Sets enabled.',
    [`ogb_intake_device_select_${currentRoom?.toLowerCase()}`]: 'Select an intake entity. Requires Own Device Sets enabled.',
    [`ogb_vents_device_select_${currentRoom?.toLowerCase()}`]: 'Select a ventilation entity. Requires Own Device Sets enabled.',
    [`ogb_humidifier_device_select_${currentRoom?.toLowerCase()}`]: 'Select a humidifier entity. Requires Own Device Sets enabled.',
    [`ogb_dehumidifier_device_select_${currentRoom?.toLowerCase()}`]: 'Select a dehumidifier entity. Requires Own Device Sets enabled.',
    [`ogb_heater_device_select_${currentRoom?.toLowerCase()}`]: 'Select a heater entity. Requires Own Device Sets enabled.',
    [`ogb_cooler_device_select_${currentRoom?.toLowerCase()}`]: 'Select a cooler entity. Requires Own Device Sets enabled.',
    [`ogb_climate_device_select_${currentRoom?.toLowerCase()}`]: 'Select a climate device. Requires Own Device Sets enabled. (Currently not working)',
    [`ogb_waterpump_device_select_${currentRoom?.toLowerCase()}`]: 'Select a water pump entity. Requires Own Device Sets enabled.',

    [`ogb_grow_area_m2_${currentRoom?.toLowerCase()}`]: 'Enter your m2 Space where you growing in',
    [`ogb_ambientcontrol_${currentRoom?.toLowerCase()}`]: 'Will be take care of the state of your Ambient( "NOT WORKING RIGHT NOW")',
    [`ogb_vpd_devicedampening_${currentRoom?.toLowerCase()}`]: 'Enable Device Cooldowns for any device see Wiki to check the cooldowns.',
  };

  // 🎯 Dynamische Filter-Logik - NUR FÜR AKTUELLE GRUPPE
  const getActiveDynamicFilters = useMemo(() => {
    const activeFilters = {
      includeKeywords: [],
      excludeKeywords: [],
      additionalTooltips: {}
    };

    // Nur Filter anwenden, die für die aktuelle Gruppe (option) aktiv sind
    Object.entries(dynamicFilters).forEach(([filterKey, filterConfig]) => {
      // 🔥 Prüfen ob dieser Filter in der aktuellen Gruppe aktiv sein soll
      if (!filterConfig.activeInGroups.includes(option)) {
        return; // Skip diesen Filter, er ist nicht für diese Gruppe
      }

      const selectEntityId = `select.${filterConfig.selectEntity}${currentRoom?.toLowerCase()}`;
      const selectEntity = entities[selectEntityId];
      
      if (selectEntity && selectEntity.state) {
        const selectedCondition = filterConfig.conditions[selectEntity.state];
        
        if (selectedCondition) {
          activeFilters.includeKeywords.push(...selectedCondition.includeKeywords);
          activeFilters.excludeKeywords.push(...selectedCondition.excludeKeywords);
          Object.assign(activeFilters.additionalTooltips, selectedCondition.additionalTooltips);
          
          console.log(`🎯 Active Filter in "${option}": ${filterKey} = ${selectEntity.state}`);
        }
      }
    });

    return activeFilters;
  }, [entities, currentRoom, option]); // 🔥 option als Dependency hinzugefügt

  // 📋 Merge tooltips
  const mergedTooltips = useMemo(() => {
    return {
      ...entityTooltips,
      ...Object.fromEntries(
        Object.entries(getActiveDynamicFilters.additionalTooltips).map(([key, value]) => [
          `${key}${currentRoom?.toLowerCase()}`,
          value
        ])
      )
    };
  }, [entityTooltips, getActiveDynamicFilters, currentRoom]);

  const formatTitle = (title) => {
    return title
      .replace(/^OGB_/, '')
      .replace(/_/g, ' ')
      .replace(new RegExp(`${currentRoom}$`, 'i'), '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const filterEntitiesByKeywords = (
    entities,
    includeKeywords,
    excludeKeywords,
    currentRoom,
    dynamicFilters
  ) => {
    // Combine static and dynamic keywords
    const allIncludeKeywords = [...includeKeywords, ...dynamicFilters.includeKeywords];
    const allExcludeKeywords = [...excludeKeywords, ...dynamicFilters.excludeKeywords];

    return Object.entries(entities)
      .filter(([key]) => {
        const lowerKey = key.toLowerCase();
        
        const matchesInclude =
          allIncludeKeywords.length === 0 ||
          allIncludeKeywords.some((keyword) =>
            lowerKey.includes(keyword.toLowerCase())
          );
        
        const matchesExclude = allExcludeKeywords.some((keyword) =>
          lowerKey.includes(keyword.toLowerCase())
        );
        
        const roomMatches = currentRoom
          ? lowerKey.includes(currentRoom.toLowerCase())
          : true;
        
        return matchesInclude && !matchesExclude && roomMatches;
      })
      .map(([key, entity]) => {
        const cleanKey = entity.entity_id.split('.').pop();
        const tooltip = mergedTooltips[cleanKey] || '';

        return {
          title: formatTitle(entity.attributes?.friendly_name || entity.entity_id),
          entity_id: entity.entity_id,
          attributes: entity.attributes || {},
          options: entity.attributes?.options || [],
          min: entity.attributes?.min || 0,
          max: entity.attributes?.max || 100,
          step: entity.attributes?.step || 1,
          state: entity?.state || 50,
          unit: entity.attributes?.unit_of_measurement || '',
          tooltip,
        };
      });
  };

  const group = groupMappings[option];
  const includedKeywords = group ? group.includeKeywords : [];
  const excludedKeywords = group ? group.excludeKeywords : [];

  const dropdownEntities = filterEntitiesByKeywords(
    entities,
    includedKeywords,
    excludedKeywords,
    currentRoom,
    getActiveDynamicFilters
  ).filter(
    (entity) =>
      entity.entity_id.startsWith('select.') && entity.options.length > 0
  );

  const sliderEntities = filterEntitiesByKeywords(
    entities,
    includedKeywords,
    excludedKeywords,
    currentRoom,
    getActiveDynamicFilters
  ).filter(
    (entity) => entity.entity_id.startsWith('number.') && entity.max > entity.min
  );

  const timeEntities = filterEntitiesByKeywords(
    entities,
    includedKeywords,
    excludedKeywords,
    currentRoom,
    getActiveDynamicFilters
  ).filter((entity) => entity.entity_id.startsWith('time.'));

  const switchEntities = filterEntitiesByKeywords(
    entities,
    includedKeywords,
    excludedKeywords,
    currentRoom,
    getActiveDynamicFilters
  ).filter((entity) => entity.entity_id.startsWith('switch.'));

  return (
    <div>
      {currentControl !== 'Home' ? (
        <></>
      ) : (
        <>
          {switchEntities.length > 0 && (
            <SwitchCard entities={switchEntities} />
          )}
          {dropdownEntities.length > 0 && (
            <SelectCard entities={dropdownEntities} />
          )}
          {sliderEntities.length > 0 && (
            <SliderCard entities={sliderEntities} />
          )}
          {timeEntities.length > 0 && <TimeCard entities={timeEntities} />}
        </>
      )}
    </div>
  );
};

export default ControllCollection;