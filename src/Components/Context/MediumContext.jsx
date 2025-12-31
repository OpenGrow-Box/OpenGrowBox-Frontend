import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useHomeAssistant } from './HomeAssistantContext';

const MediumContext = createContext();

export const MediumProvider = ({ children }) => {
  const { connection, entities, currentRoom, isConnectionValid } = useHomeAssistant();
  
  // State for mediums
  const [mediums, setMediums] = useState([]);
  const [currentMediumIndex, setCurrentMediumIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Editing state to prevent race conditions
  const [editingMediumIndex, setEditingMediumIndex] = useState(null);
  const [editingFields, setEditingFields] = useState(new Set());
  const pendingUpdatesRef = useRef(new Map()); // Track pending updates
  const updateTimeoutRef = useRef(null);

  // Get current medium
  const currentMedium = mediums[currentMediumIndex] || null;

  // Check if a specific field is being edited
  const isFieldEditing = useCallback((field) => {
    return editingFields.has(field);
  }, [editingFields]);

  // Start editing a field - prevents backend overwrites
  const startEditing = useCallback((field) => {
    setEditingFields(prev => new Set([...prev, field]));
  }, []);

  // Stop editing a field
  const stopEditing = useCallback((field) => {
    setEditingFields(prev => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  // Stop editing all fields
  const stopEditingAll = useCallback(() => {
    setEditingFields(new Set());
  }, []);

  // Request medium plants data from backend (optional - backend will auto-emit on init)
  const requestMediumsData = useCallback(async () => {
    if (!isConnectionValid() || !currentRoom) {
      return;
    }

    try {
      // Try to request data, but don't fail if service doesn't exist
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'request_medium_plants_data',
        service_data: {
          room: currentRoom,
        },
      });
    } catch (error) {
      // Service might not exist - that's OK, backend will emit MediumPlantsUpdate on init
      console.warn('request_medium_plants_data service not available (backend will auto-emit):', error.message);
    }
  }, [connection, currentRoom, isConnectionValid]);

  // Optimistic update helper - updates local state immediately
  const applyOptimisticUpdate = useCallback((mediumIndex, updates) => {
    setMediums(prev => {
      if (mediumIndex < 0 || mediumIndex >= prev.length) return prev;
      
      const updated = [...prev];
      updated[mediumIndex] = {
        ...updated[mediumIndex],
        ...updates,
        // Handle nested dates object
        dates: updates.dates ? {
          ...updated[mediumIndex].dates,
          ...updates.dates,
        } : updated[mediumIndex].dates,
      };
      return updated;
    });
  }, []);

  // Rollback optimistic update on error
  const rollbackUpdate = useCallback((mediumIndex, previousData) => {
    setMediums(prev => {
      if (mediumIndex < 0 || mediumIndex >= prev.length) return prev;
      
      const updated = [...prev];
      updated[mediumIndex] = previousData;
      return updated;
    });
  }, []);

  // Refs to track editing state without triggering re-renders
  const editingFieldsRef = useRef(new Set());
  const currentMediumIndexRef = useRef(0);
  
  // Keep refs in sync with state
  useEffect(() => {
    editingFieldsRef.current = editingFields;
  }, [editingFields]);
  
  useEffect(() => {
    currentMediumIndexRef.current = currentMediumIndex;
  }, [currentMediumIndex]);

  // Listen for MediumPlantsUpdate and MediumPlantUpdate events
  // IMPORTANT: Only depend on connection and currentRoom to prevent re-subscribing
  useEffect(() => {
    if (!connection || !currentRoom) {
      setLoading(false);
      return;
    }

    let unsubscribePlants = null;
    let unsubscribePlant = null;

    const setupListeners = async () => {
      try {
        console.log(`[MediumContext] Setting up listeners for room: ${currentRoom}`);
        
        // Listen for all plants update
        unsubscribePlants = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            
            if (data.Name === currentRoom && data.plants && Array.isArray(data.plants)) {
              console.log(`[MediumContext] MediumPlantsUpdate: ${data.plants.length} mediums for ${currentRoom}`);
              
              // Use refs to check editing state without causing re-renders
              const isEditing = editingFieldsRef.current.size > 0;
              const editingIdx = currentMediumIndexRef.current;
              
              if (!isEditing) {
                // Not editing - just update
                setMediums(data.plants);
              } else {
                // Merge update while preserving edited fields
                setMediums(prev => {
                  return data.plants.map((plant, idx) => {
                    const existing = prev[idx];
                    if (!existing || idx !== editingIdx) {
                      return plant;
                    }
                    
                    // Preserve locally edited fields
                    const preserved = {};
                    const fields = editingFieldsRef.current;
                    
                    if (fields.has('plant_name')) preserved.plant_name = existing.plant_name;
                    if (fields.has('plant_strain')) preserved.plant_strain = existing.plant_strain;
                    if (fields.has('breeder_bloom_days') && existing.dates) {
                      preserved.dates = { ...plant.dates, breederbloomdays: existing.dates?.breederbloomdays };
                    }
                    if (fields.has('grow_start') && existing.dates) {
                      preserved.dates = { ...(preserved.dates || plant.dates), growstartdate: existing.dates?.growstartdate };
                    }
                    if (fields.has('bloom_switch') && existing.dates) {
                      preserved.dates = { ...(preserved.dates || plant.dates), bloomswitchdate: existing.dates?.bloomswitchdate };
                    }
                    
                    return { ...plant, ...preserved };
                  });
                });
              }
              
              setLoading(false);
              setError(null);
            }
          },
          'MediumPlantsUpdate'
        );

        // Listen for single medium update
        unsubscribePlant = await connection.subscribeEvents(
          (event) => {
            const data = event.data;
            
            if (data.Name === currentRoom && data.medium_name) {
              const isEditing = editingFieldsRef.current.size > 0;
              
              setMediums(prev => {
                const index = prev.findIndex(m => m.medium_name === data.medium_name);
                const editingIdx = currentMediumIndexRef.current;
                
                // Skip if editing this medium
                if (isEditing && index === editingIdx) {
                  console.log('[MediumContext] Ignoring update for medium being edited');
                  return prev;
                }
                
                console.log(`[MediumContext] MediumPlantUpdate: ${data.medium_name}`);
                const updated = [...prev];
                
                if (index !== -1) {
                  updated[index] = { ...updated[index], ...data };
                } else {
                  updated.push(data);
                }
                
                return updated;
              });
            }
          },
          'MediumPlantUpdate'
        );
        
        console.log('[MediumContext] Event listeners registered successfully');

        // Request initial data
        try {
          await connection.sendMessagePromise({
            type: 'call_service',
            domain: 'opengrowbox',
            service: 'request_medium_plants_data',
            service_data: { room: currentRoom },
          });
        } catch (e) {
          console.warn('request_medium_plants_data not available:', e.message);
        }

        // Stop loading after 3 seconds
        const loadingTimer = setTimeout(() => setLoading(false), 3000);
        return () => clearTimeout(loadingTimer);

      } catch (err) {
        console.error('Error setting up medium listeners:', err);
        setError('Failed to connect to medium data stream');
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribePlants) {
        try { unsubscribePlants(); } catch (e) { /* ignore */ }
      }
      if (unsubscribePlant) {
        try { unsubscribePlant(); } catch (e) { /* ignore */ }
      }
    };
  }, [connection, currentRoom]); // Only re-subscribe when connection or room changes!

  // Reset when room changes
  useEffect(() => {
    setMediums([]);
    setCurrentMediumIndex(0);
    setLoading(true);
    setError(null);
    stopEditingAll();
  }, [currentRoom, stopEditingAll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Update medium plant dates with optimistic update
  const updateMediumPlantDates = async (mediumIndex, updates, options = {}) => {
    if (!isConnectionValid() || !currentRoom) {
      throw new Error('No connection available');
    }

    const { optimistic = true, stopEditingOnSuccess = true } = options;
    
    // Store previous state for rollback
    const previousMedium = mediums[mediumIndex] ? { ...mediums[mediumIndex] } : null;
    
    // Apply optimistic update
    if (optimistic && previousMedium) {
      // Convert field names for optimistic update
      const optimisticData = {};
      if (updates.plant_name !== undefined) optimisticData.plant_name = updates.plant_name;
      if (updates.plant_strain !== undefined) optimisticData.plant_strain = updates.plant_strain;
      if (updates.plant_stage !== undefined) optimisticData.plant_stage = updates.plant_stage;
      if (updates.plant_type !== undefined) optimisticData.plant_type = updates.plant_type;
      
      // Handle date fields in nested dates object
      if (updates.breeder_bloom_days !== undefined || updates.grow_start !== undefined || updates.bloom_switch !== undefined) {
        optimisticData.dates = { ...previousMedium.dates };
        if (updates.breeder_bloom_days !== undefined) optimisticData.dates.breederbloomdays = updates.breeder_bloom_days;
        if (updates.grow_start !== undefined) optimisticData.dates.growstartdate = updates.grow_start;
        if (updates.bloom_switch !== undefined) optimisticData.dates.bloomswitchdate = updates.bloom_switch;
      }
      
      applyOptimisticUpdate(mediumIndex, optimisticData);
    }

    try {
      await connection.sendMessagePromise({
        type: 'call_service',
        domain: 'opengrowbox',
        service: 'update_medium_plant_dates',
        service_data: {
          room: currentRoom,
          medium_index: mediumIndex,
          ...updates,
        },
      });
      
      // Stop editing the fields that were updated
      if (stopEditingOnSuccess) {
        Object.keys(updates).forEach(field => stopEditing(field));
      }
      
      console.log('[MediumContext] Update successful:', updates);
      
    } catch (error) {
      console.error('Failed to update medium plant dates:', error);
      
      // Rollback on error
      if (optimistic && previousMedium) {
        rollbackUpdate(mediumIndex, previousMedium);
      }
      
      throw error;
    }
  };

  // Debounced update for input fields
  const debouncedUpdate = useCallback((mediumIndex, updates, delay = 500) => {
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Store pending updates
    const key = `${mediumIndex}`;
    const pending = pendingUpdatesRef.current.get(key) || {};
    pendingUpdatesRef.current.set(key, { ...pending, ...updates });
    
    // Schedule the update
    updateTimeoutRef.current = setTimeout(async () => {
      const allUpdates = pendingUpdatesRef.current.get(key);
      pendingUpdatesRef.current.delete(key);
      
      if (allUpdates && Object.keys(allUpdates).length > 0) {
        try {
          await updateMediumPlantDates(mediumIndex, allUpdates);
        } catch (error) {
          console.error('Debounced update failed:', error);
        }
      }
    }, delay);
  }, [updateMediumPlantDates]);

  // Update specific plant field for a medium
  const updatePlantField = async (mediumIndex, field, value) => {
    return updateMediumPlantDates(mediumIndex, { [field]: value });
  };

  const value = {
    // State
    mediums,
    currentMedium,
    currentMediumIndex,
    setCurrentMediumIndex,
    loading,
    error,
    
    // Editing state management
    editingFields,
    isFieldEditing,
    startEditing,
    stopEditing,
    stopEditingAll,
    
    // Update functions
    updateMediumPlantDates,
    updatePlantField,
    debouncedUpdate,
    applyOptimisticUpdate,
    
    // Data fetching
    requestMediumsData,
  };

  return (
    <MediumContext.Provider value={value}>
      {children}
    </MediumContext.Provider>
  );
};

export const useMedium = () => {
  const context = useContext(MediumContext);
  if (!context) {
    throw new Error('useMedium must be used within a MediumProvider');
  }
  return context;
};

export default MediumProvider;
