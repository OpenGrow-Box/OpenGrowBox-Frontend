import React, { useState, useEffect, useCallback, useRef } from 'react'

export const createDebugStepComponents = ({ icons, styles, connection, currentRoom }) => {
  const { MdDownload, MdRefresh, MdCheck } = icons
  const {
    StepContent,
    LogContainer,
    LogEntry,
    LogTime,
    LogLevel,
    LogSource,
    LogMessage,
  } = styles

  const logLevels = [
    { id: 'all', label: 'All', color: '#95a5a6' },
    { id: 'debug', label: 'Debug', color: '#9b59b6' },
    { id: 'info', label: 'Info', color: '#3498db' },
    { id: 'warning', label: 'Warning', color: '#f39c12' },
    { id: 'error', label: 'Error', color: '#e74c3c' },
  ]

  const DebugWelcomeStep = ({ data, updateData, nextStep }) => {
    const selectTool = (tool) => {
      updateData({ selectedDebugTool: tool })
      nextStep()
    }

    const ToolCard = ({ tool, title, description, icon }) => (
      <div 
        onClick={() => selectTool(tool)}
        style={{ 
          padding: '1rem', 
          background: 'var(--glass-bg-secondary)', 
          borderRadius: '8px',
          cursor: 'pointer',
          border: data.selectedDebugTool === tool ? '2px solid var(--primary-accent)' : '2px solid transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>{title}</h4>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>{description}</p>
      </div>
    )

    return (
      <StepContent>
        <h3>Debug Tools</h3>
        <p>Select a tool to troubleshoot your OpenGrowBox system:</p>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <ToolCard 
            tool="logViewer" 
            title="Log Viewer" 
            description="View real-time and historical logs"
            icon="📋"
          />
        </div>
      </StepContent>
    )
  }

  const LogViewerStep = ({ data, updateData, connection, currentRoom }) => {
    const [logs, setLogs] = useState([])
    const [filterText, setFilterText] = useState('')
    const [levelFilter, setLevelFilter] = useState('all')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const hasLoadedRef = useRef(false)
    const historyUnsubscribeRef = useRef(null)
    const currentRequestIdRef = useRef(null)  // Track only current request - no memory leak

    // Helper to ensure logs are sorted by timestamp (newest first)
    const sortLogsNewestFirst = (logsArray) => {
      return [...logsArray].sort((a, b) => {
        // Convert ISO timestamp string to milliseconds for proper sorting
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return timeB - timeA // Neueste zuerst
      })
    }

    // Helper to extract message from various log data formats
    const extractMessage = (logData) => {
      if (!logData) return ''
      
      // Try different message field variations
      if (typeof logData === 'string') {
        try {
          const parsed = JSON.parse(logData)
          return parsed.Message || parsed.message || parsed.msg || logData.substring(0, 150)
        } catch {
          return logData.substring(0, 150)
        }
      }
      
      if (typeof logData === 'object') {
        return logData.Message || logData.message || logData.msg || logData.Message || JSON.stringify(logData).substring(0, 150)
      }
      
      return String(logData).substring(0, 150)
    }

    // Fetch historical logs from backend file
    const fetchHistoricalLogs = useCallback(async () => {
      if (!connection) {
        console.log('[Wizard Debug] No connection, skipping fetch')
        return
      }
      
      // Cleanup previous subscription
      if (historyUnsubscribeRef.current) {
        console.log('[Wizard Debug] Cleaning up previous subscription')
        historyUnsubscribeRef.current.then((unsub) => {
          if (unsub) unsub()
        }).catch(() => {})
        historyUnsubscribeRef.current = null
      }
      
      setLoading(true)
      setError(null)
      const requestId = `log_fetch_${Date.now()}`
      console.log('[Wizard Debug] Fetching historical logs with requestId:', requestId, 'room:', currentRoom)

      // Store current request ID
      currentRequestIdRef.current = requestId

      let unsubscribed = false
      const safeUnsubscribe = () => {
        if (!unsubscribed) {
          unsubscribed = true
          return true
        }
        return false
      }
      
      try {
        // Subscribe to response FIRST, then send request
        const unsubscribePromise = connection.subscribeEvents(
          (event) => {
            console.log('[Wizard Debug] Received ogbClientLogsResponse:', event?.data)
            if (event?.event_type === 'ogbClientLogsResponse') {
              // CRITICAL: Check if this is our response
              const eventRequestId = event.data?.requestId || event.data?.request_id

              // Ignore if requestId doesn't match current request
              if (eventRequestId !== currentRequestIdRef.current) {
                console.log('[Wizard Debug] Ignoring response - requestId mismatch:', eventRequestId, 'expected:', currentRequestIdRef.current)
                return
              }

              console.log('[Wizard Debug] Processing response for requestId:', requestId)
              console.log('[Wizard Debug] Log response:', event.data)

              if (event.data?.error) {
                console.error('[Wizard Debug] Error response:', event.data.error)
                setError(event.data.error)
              } else if (event.data?.logs) {
                const historicalLogs = (event.data.logs || []).map((log, idx) => ({
                  id: `hist_${log.timestamp}_${idx}`,
                  time: log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
                  level: (log.type || 'INFO').toUpperCase(),
                  source: log.room || currentRoom || 'OGB',
                  message: extractMessage(log.data),
                  raw: log.data,
                  type: log.type,
                  timestamp: log.timestamp,
                  isHistorical: true,
                }))
                console.log('[Wizard Debug] Parsed', historicalLogs.length, 'historical logs')
                setLogs(prev => {
                  const realtime = prev.filter(l => !l.isHistorical)
                  const existingTimestamps = new Set(realtime.map(l => l.timestamp))
                  const newHistorical = historicalLogs.filter(l => !existingTimestamps.has(l.timestamp))

                  // Combine and sort: newest first
                  const combined = [...newHistorical, ...realtime]
                  const sorted = sortLogsNewestFirst(combined)
                  return sorted.slice(0, 300)
                })

                // Scroll to top after loading logs
                setTimeout(() => {
                  const container = document.querySelector('[data-log-container="true"]')
                  if (container) {
                    console.log('[Wizard Debug] Scrolling to top of log container')
                    container.scrollTop = 0
                  }
                }, 100)

                hasLoadedRef.current = true
              } else {
                console.log('[Wizard Debug] No logs in response, file might be empty')
                hasLoadedRef.current = true
              }
              setLoading(false)
              if (safeUnsubscribe()) {
                unsubscribePromise.then((unsub) => {
                  if (unsub) unsub()
                }).catch(() => {})
              }
            } else if (event.data?.error) {
              // Error response - still mark as loaded to avoid stuck "Loading"
              console.error('[Wizard Debug] Error response:', event.data.error)
              setError(event.data.error)
              hasLoadedRef.current = true
              setLoading(false)
              if (safeUnsubscribe()) {
                unsubscribePromise.then((unsub) => {
                  if (unsub) unsub()
                }).catch(() => {})
              }
            }
          },
          'ogbClientLogsResponse'
        )
        
        historyUnsubscribeRef.current = unsubscribePromise

        // Send request 
        console.log('[Wizard Debug] Sending getOGBClientLogs request')
        connection.sendMessage({
          type: 'fire_event',
          event_type: 'getOGBClientLogs',
          event_data: {
            room: currentRoom || 'all',
            limit: 500,
            requestId: requestId,
          }
        })

        // Timeout after 15 seconds
        const timeoutId = setTimeout(() => {
          console.log('[Wizard Debug] Timeout - stopping loading')
          setLoading(false)
          hasLoadedRef.current = true  // Mark as loaded even on timeout
          if (safeUnsubscribe()) {
            unsubscribePromise.then((unsub) => {
              if (unsub) unsub()
            }).catch(() => {})
          }
        }, 15000)

        // Clear timeout if we get response
        return () => {
          clearTimeout(timeoutId)
          historyUnsubscribeRef.current = null
        }

      } catch (e) {
        console.error('[Wizard Debug] Fetch historical logs failed:', e)
        setError(e.message || 'Failed to fetch logs')
        setLoading(false)
        hasLoadedRef.current = true  // Mark as loaded even on error
      }
    }, [connection, currentRoom])

    // Initial load - fetch historical logs (only once per component mount)
    useEffect(() => {
      console.log('[Wizard Debug] Initial load check - connection:', !!connection, 'currentRoom:', currentRoom, 'hasLoaded:', hasLoadedRef.current)

      // Only fetch if: connection exists, room exists, and hasn't been loaded yet
      if (connection && currentRoom && !hasLoadedRef.current) {
        console.log('[Wizard Debug] Starting historical log fetch...')
        fetchHistoricalLogs()
      }

      // DO NOT reset hasLoadedRef on unmount - this causes re-fetch on tab switch
      // The ref persists across mounts to prevent duplicate fetches
    }, [])  // Empty deps - only run once on mount

    const handleRefresh = () => {
      // Reset hasLoadedRef to allow refetch
      hasLoadedRef.current = false
      setLogs(prev => prev.filter(l => !l.isHistorical))
      fetchHistoricalLogs()
    }

    // Subscribe to realtime logs
    useEffect(() => {
      if (!connection) return

      let unsubscribePromise = connection.subscribeEvents(
        (event) => {
          if (event?.event_type === 'LogForClient') {
            const eventData = event.data || {}
            const timestamp = Date.now()
            const newLog = {
              id: `realtime_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
              time: event.time_fired ? new Date(event.time_fired).toLocaleTimeString() : new Date(timestamp).toLocaleTimeString(),
              level: (eventData.DebugType || eventData.type || 'INFO').toUpperCase(),
              source: eventData.Name || eventData.name || currentRoom || 'OGB',
              message: extractMessage(eventData),
              raw: eventData,
              type: eventData.DebugType || eventData.type,
              timestamp: timestamp,
              isHistorical: false,
            }

            setLogs(prev => {
              const combined = [newLog, ...prev]
              const sorted = sortLogsNewestFirst(combined)
              const result = sorted.slice(0, 500)

              // Scroll to top when new realtime log arrives
              setTimeout(() => {
                const container = document.querySelector('[data-log-container="true"]')
                if (container) {
                  container.scrollTop = 0
                }
              }, 50)

              return result
            })
          }
        },
        'LogForClient'
      )

      console.log('[Wizard Debug] Subscribed to realtime LogForClient')

      return () => {
        unsubscribePromise.then((unsubscribe) => {
          if (unsubscribe) unsubscribe()
        }).catch(() => {})
      }
    }, [connection, currentRoom])

    const filteredLogs = logs.filter((log) => {
      // Level filter
      if (levelFilter !== 'all' && log.level?.toLowerCase() !== levelFilter) return false

      // Text search - search in message, source, level, and raw data
      if (filterText) {
        const searchLower = filterText.toLowerCase()
        const searchableText = [
          log.message,
          log.source,
          log.level,
          JSON.stringify(log.raw)
        ].join(' ').toLowerCase()

        return searchableText.includes(searchLower)
      }
      return true
    })
    // No need to sort here - logs are already sorted in state

    const downloadLogs = () => {
      const logText = filteredLogs.map((l) => `[${l.time}] [${l.level}] [${l.source}] ${l.message}`).join('\n')
      const blob = new Blob([logText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ogb-logs-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }

    const clearLogs = () => setLogs([])

    return (
      <StepContent>
        <h3>Log Viewer</h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter logs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg-secondary)',
              color: 'var(--main-text-color)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {logLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => setLevelFilter(level.id)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                border: 'none',
                background: levelFilter === level.id ? level.color : 'var(--glass-bg-secondary)',
                color: levelFilter === level.id ? '#fff' : 'var(--main-text-color)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button onClick={handleRefresh} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary-accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MdRefresh /> Load Logs
          </button>
          <button onClick={downloadLogs} disabled={logs.length === 0} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: logs.length === 0 ? 'var(--glass-bg-secondary)' : 'var(--primary-accent)', color: '#fff', cursor: logs.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MdDownload /> Export
          </button>
          <button onClick={clearLogs} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--main-text-color)', cursor: 'pointer' }}>
            Clear
          </button>
        </div>
        
        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>
          {filteredLogs.length} logs | Total: {logs.length} {loading && '| Loading...'}
        </div>
        
        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(231,76,60,0.2)', borderRadius: '6px', marginBottom: '0.5rem', color: '#e74c3c' }}>
            Error: {error}
          </div>
        )}
        
        <LogContainer style={{ maxHeight: '400px', overflow: 'auto' }} data-log-container="true">
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
              {loading ? (
                'Loading logs...'
              ) : logs.length === 0 ? (
                'No logs available'
              ) : (
                'No logs match filter'
              )}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogEntry key={log.id} level={log.level?.toLowerCase()}>
                <LogTime>{log.time}</LogTime>
                <LogLevel level={log.level?.toLowerCase()}>{log.level}</LogLevel>
                <LogSource>[{log.source}]</LogSource>
                <LogMessage title={JSON.stringify(log.raw, null, 2)}>{log.message}</LogMessage>
              </LogEntry>
            ))
          )}
        </LogContainer>
      </StepContent>
    )
  }

  // Wrap steps to inject connection and currentRoom
  const LogViewerStepWithProps = (props) => <LogViewerStep {...props} connection={connection} currentRoom={currentRoom} />

  return { DebugWelcomeStep, LogViewerStep: LogViewerStepWithProps }
}
