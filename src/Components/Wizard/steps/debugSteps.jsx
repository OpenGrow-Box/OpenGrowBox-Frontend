import React, { useState, useEffect, useCallback } from 'react'

export const createDebugStepComponents = ({ icons, styles, connection, currentRoom }) => {
  const { MdDownload, MdRefresh } = icons
  const {
    StepContent,
    SettingGroup,
    SettingLabel,
    LogContainer,
    LogEntry,
    LogTime,
    LogLevel,
    LogSource,
    LogMessage,
    LogActions,
    ActionBtn,
    ReportFeatures,
    ReportFeature,
    SubmitButton,
  } = styles

  const logLevels = [
    { id: 'all', label: 'All', color: '#95a5a6' },
    { id: 'debug', label: 'Debug', color: '#9b59b6' },
    { id: 'info', label: 'Info', color: '#3498db' },
    { id: 'warning', label: 'Warning', color: '#f39c12' },
    { id: 'error', label: 'Error', color: '#e74c3c' },
  ]

  const DebugSettingsStep = ({ data, updateData }) => (
    <StepContent>
      <h3>Debug Tools</h3>
      <p>Tools for troubleshooting your OpenGrowBox system:</p>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '1rem', background: 'var(--glass-bg-secondary)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Log Viewer</h4>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>View real-time logs from your grow box</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--glass-bg-secondary)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Debug Data</h4>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>Request internal data from the system</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--glass-bg-secondary)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Generate Report</h4>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>Create a debug report for support</p>
        </div>
      </div>
    </StepContent>
  )

  const LogViewerStep = ({ data, updateData, connection, currentRoom }) => {
    const [logs, setLogs] = useState([])
    const [filterText, setFilterText] = useState('')
    const [levelFilter, setLevelFilter] = useState('all')
    const [loading, setLoading] = useState(false)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [error, setError] = useState(null)
    const [currentRequestId, setCurrentRequestId] = useState(null)

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
      
      setLoading(true)
      setError(null)
      const requestId = `log_fetch_${Date.now()}`
      setCurrentRequestId(requestId)
      console.log('[Wizard Debug] Fetching historical logs with requestId:', requestId, 'room:', currentRoom)
      
      try {
        // Subscribe to response FIRST, then send request
        const unsubscribe = await connection.subscribeEvents(
          (event) => {
            console.log('[Wizard Debug] Received ogbClientLogsResponse:', event?.data)
            if (event?.event_type === 'ogbClientLogsResponse') {
              // CRITICAL: Check if this is our response
              const eventRequestId = event.data?.requestId || event.data?.request_id
              
              if (eventRequestId !== requestId) {
                console.log('[Wizard Debug] Ignoring response - requestId mismatch:', eventRequestId, 'expected:', requestId)
                return
              }
              
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
                  isHistorical: true,
                }))
                console.log('[Wizard Debug] Parsed', historicalLogs.length, 'historical logs')
                setLogs(prev => {
                  const realtime = prev.filter(l => !l.isHistorical)
                  return [...realtime, ...historicalLogs.slice(0, 300)]
                })
              } else {
                console.log('[Wizard Debug] No logs in response, file might be empty')
                setLogs([])
              }
              setLoading(false)
              setIsInitialLoad(false)
              unsubscribe()
            }
          },
          'ogbClientLogsResponse'
        )

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
          setIsInitialLoad(false)
          unsubscribe()
        }, 15000)

        // Clear timeout if we get response
        return () => clearTimeout(timeoutId)

      } catch (e) {
        console.error('[Wizard Debug] Fetch historical logs failed:', e)
        setError(e.message || 'Failed to fetch logs')
        setLoading(false)
        setIsInitialLoad(false)
      }
    }, [connection, currentRoom])

    // Initial load - fetch historical logs
    useEffect(() => {
      console.log('[Wizard Debug] Initial load check - connection:', !!connection, 'currentRoom:', currentRoom, 'isInitialLoad:', isInitialLoad)
      if (connection && currentRoom && isInitialLoad) {
        fetchHistoricalLogs()
      }
    }, [connection, currentRoom, fetchHistoricalLogs, isInitialLoad])

    const handleRefresh = () => {
      setLogs([])
      fetchHistoricalLogs()
    }

    // Subscribe to realtime logs
    useEffect(() => {
      if (!connection) return

      let unsubscribe = null

      const setupSubscription = async () => {
        try {
          unsubscribe = await connection.subscribeEvents(
            (event) => {
              if (event?.event_type === 'LogForClient') {
                const eventData = event.data || {}
                const newLog = {
                  id: `realtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  time: event.time_fired ? new Date(event.time_fired).toLocaleTimeString() : new Date().toLocaleTimeString(),
                  level: (eventData.DebugType || eventData.type || 'INFO').toUpperCase(),
                  source: eventData.Name || eventData.name || currentRoom || 'OGB',
                  message: extractMessage(eventData),
                  raw: eventData,
                  type: eventData.DebugType || eventData.type,
                  isHistorical: false,
                }
                setLogs(prev => [newLog, ...prev.slice(0, 499)])
              }
            },
            'LogForClient'
          )
          console.log('[Wizard Debug] Subscribed to realtime LogForClient')
        } catch (e) {
          console.error('[Wizard Debug] Subscription failed:', e)
        }
      }

      setupSubscription()

      return () => {
        if (unsubscribe) {
          unsubscribe()
        }
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
        
        <LogContainer style={{ maxHeight: '400px', overflow: 'auto' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
              {logs.length === 0 ? 'Waiting for logs...' : 'No logs match filter'}
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

  // Debug Data Viewer Step - requests specific data from backend
  const DebugDataStep = ({ data, updateData, connection, currentRoom }) => {
    const [debugData, setDebugData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState('all')

    const requestOptions = [
      { id: 'all', label: 'All Data' },
      { id: 'plantStages', label: 'Plant Stages' },
      { id: 'tentData', label: 'Tent Data' },
      { id: 'vpd', label: 'VPD Data' },
      { id: 'mediums', label: 'Mediums' },
      { id: 'growData', label: 'Grow Data' },
      { id: 'control', label: 'Control Settings' },
    ]

    const requestDebugData = useCallback(async () => {
      if (!connection || !currentRoom) return

      setLoading(true)
      const requestId = `wizard_debug_${Date.now()}`

      try {
        // Subscribe to response
        const unsubscribe = await connection.subscribeEvents(
          (event) => {
            if (event?.event_type === 'ogbDebugInfoResponse' && event?.data?.room === currentRoom) {
              console.log('[Wizard Debug] Debug response:', event.data)
              if (event.data.success && event.data.data) {
                setDebugData(event.data.data)
              }
              setLoading(false)
            }
          },
          'ogbDebugInfoResponse'
        )

        // Send request
        connection.sendMessage({
          type: 'fire_event',
          event_type: 'giveDebugInfo',
          event_data: {
            room: currentRoom,
            request: selectedRequest,
            requestId: requestId,
          }
        })

        // Cleanup after timeout
        setTimeout(() => {
          unsubscribe()
          setLoading(false)
        }, 5000)

      } catch (e) {
        console.error('[Wizard Debug] Request failed:', e)
        setLoading(false)
      }
    }, [connection, currentRoom, selectedRequest])

    const exportDebugData = () => {
      if (!debugData) return
      const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ogb-debug-data-${selectedRequest}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }

    return (
      <StepContent>
        <h3>Debug Data Viewer</h3>
        <p>Request specific data from the OpenGrowBox datastore</p>

        <SettingGroup>
          <SettingLabel>Select Data to Request</SettingLabel>
          <select
            value={selectedRequest}
            onChange={(e) => setSelectedRequest(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg-secondary)',
              color: 'var(--main-text-color)',
            }}
          >
            {requestOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </SettingGroup>

        <LogActions>
          <ActionBtn onClick={requestDebugData} disabled={loading}>
            <MdRefresh /> {loading ? 'Loading...' : 'Request Data'}
          </ActionBtn>
          <ActionBtn onClick={exportDebugData} disabled={!debugData} $secondary>
            <MdDownload /> Export JSON
          </ActionBtn>
        </LogActions>

        {debugData && (
          <div style={{ marginTop: '1rem' }}>
            <SettingLabel>Response Data:</SettingLabel>
            <pre style={{
              background: 'var(--glass-bg-secondary)',
              padding: '1rem',
              borderRadius: '6px',
              maxHeight: '400px',
              overflow: 'auto',
              fontSize: '0.7rem',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
        )}
      </StepContent>
    )
  }

  const DebugReportStep = ({ data }) => {
    const generateReport = () => {
      const report = {
        timestamp: new Date().toISOString(),
        debugMode: data.debugMode,
        logLevel: data.logLevel,
        systemInfo: {
          appVersion: '1.0.0',
          haVersion: '2024.1.0',
          browser: navigator.userAgent,
          platform: navigator.platform,
        },
      }
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ogb-debug-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }

    return (
      <StepContent>
        <h3>Generate Debug Report</h3>
        <p>Create a comprehensive debug report including:</p>
        <ReportFeatures>
          <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> System configuration</ReportFeature>
          <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Recent error logs</ReportFeature>
          <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Warning messages</ReportFeature>
          <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Device states</ReportFeature>
          <ReportFeature><MdCheck style={{ color: 'var(--primary-accent)' }} /> Automation history</ReportFeature>
        </ReportFeatures>
        <SubmitButton onClick={generateReport}><MdDownload /> Generate & Download Report</SubmitButton>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
          This report can be attached to support requests for faster troubleshooting.
        </p>
      </StepContent>
    )
  }

  // Wrap steps to inject connection and currentRoom
  const LogViewerStepWithProps = (props) => <LogViewerStep {...props} connection={connection} currentRoom={currentRoom} />
  const DebugDataStepWithProps = (props) => <DebugDataStep {...props} connection={connection} currentRoom={currentRoom} />

  return { DebugSettingsStep, LogViewerStep: LogViewerStepWithProps, DebugDataStep: DebugDataStepWithProps, DebugReportStep }
}
