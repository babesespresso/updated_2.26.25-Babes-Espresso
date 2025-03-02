import React, { useState, useEffect } from 'react';
import { 
  getExtensionDiagnostics, 
  enableBypassMode, 
  disableBypassMode, 
  isBypassModeEnabled 
} from '../lib/extension-diagnostics';

interface DiagnosticsProps {
  onClose?: () => void;
}

const ExtensionDiagnostics: React.FC<DiagnosticsProps> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<Record<string, any> | null>(null);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Get initial diagnostics
    const initialDiagnostics = getExtensionDiagnostics();
    setDiagnostics(initialDiagnostics);
    
    // Check if bypass mode is enabled
    setBypassEnabled(isBypassModeEnabled());
    
    // Set up interval to refresh diagnostics
    const intervalId = setInterval(() => {
      setDiagnostics(getExtensionDiagnostics());
      setBypassEnabled(isBypassModeEnabled());
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    setDiagnostics(getExtensionDiagnostics());
    setBypassEnabled(isBypassModeEnabled());
  };

  const handleToggleBypass = () => {
    if (bypassEnabled) {
      disableBypassMode();
    } else {
      enableBypassMode();
    }
    setBypassEnabled(!bypassEnabled);
  };

  const handleCopyReport = () => {
    const report = JSON.stringify(diagnostics, null, 2);
    navigator.clipboard.writeText(report)
      .then(() => alert('Diagnostic report copied to clipboard'))
      .catch(err => console.error('Failed to copy report:', err));
  };

  if (!diagnostics) {
    return <div>Loading diagnostics...</div>;
  }

  return (
    <div className="extension-diagnostics" style={{
      position: 'fixed',
      bottom: expanded ? '0' : 'auto',
      right: '0',
      width: expanded ? '100%' : '300px',
      maxWidth: expanded ? '100%' : '300px',
      maxHeight: expanded ? '100%' : '300px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '10px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      zIndex: 9999,
      overflow: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: '1px solid #ddd',
        paddingBottom: '5px'
      }}>
        <h3 style={{ margin: 0 }}>Extension Diagnostics</h3>
        <div>
          <button 
            onClick={() => setExpanded(!expanded)} 
            style={{ marginRight: '5px', fontSize: '12px' }}
          >
            {expanded ? 'Minimize' : 'Expand'}
          </button>
          {onClose && (
            <button onClick={onClose} style={{ fontSize: '12px' }}>Close</button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ 
          padding: '5px', 
          backgroundColor: diagnostics.hasBlockedScripts ? '#ffebee' : '#e8f5e9',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>Status: </strong> 
          {diagnostics.hasBlockedScripts 
            ? 'Extension conflicts detected' 
            : 'No extension conflicts detected'}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={handleToggleBypass} 
            style={{ 
              backgroundColor: bypassEnabled ? '#4caf50' : '#f44336',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            {bypassEnabled ? 'Disable Bypass Mode' : 'Enable Bypass Mode'}
          </button>
          <button onClick={handleRefresh} style={{ marginRight: '5px' }}>Refresh</button>
          <button onClick={handleCopyReport}>Copy Report</button>
        </div>
      </div>

      {expanded && (
        <div>
          <h4>Blocked Scripts</h4>
          {diagnostics.hasBlockedScripts ? (
            <div>
              <p>Last blocked script: <code>{diagnostics.blockedExtensionScript || 'None'}</code></p>
              <details>
                <summary>Blocked Scripts ({diagnostics.blockedScripts?.length || 0})</summary>
                <pre style={{ maxHeight: '100px', overflow: 'auto' }}>
                  {JSON.stringify(diagnostics.blockedScripts, null, 2)}
                </pre>
              </details>
              <details>
                <summary>Blocked Fetches ({diagnostics.blockedFetches?.length || 0})</summary>
                <pre style={{ maxHeight: '100px', overflow: 'auto' }}>
                  {JSON.stringify(diagnostics.blockedFetches, null, 2)}
                </pre>
              </details>
              <details>
                <summary>Blocked Dynamic Scripts ({diagnostics.blockedDynamicScripts?.length || 0})</summary>
                <pre style={{ maxHeight: '100px', overflow: 'auto' }}>
                  {JSON.stringify(diagnostics.blockedDynamicScripts, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p>No scripts have been blocked</p>
          )}

          <h4>Browser Information</h4>
          <pre style={{ maxHeight: '100px', overflow: 'auto' }}>
            {JSON.stringify(diagnostics.browserInfo, null, 2)}
          </pre>

          <h4>Storage Status</h4>
          <pre>
            localStorage available: {diagnostics.localStorage?.available ? 'Yes' : 'No'}<br />
            sessionStorage available: {diagnostics.sessionStorage?.available ? 'Yes' : 'No'}<br />
            Bypass Mode: {bypassEnabled ? 'Enabled' : 'Disabled'}
          </pre>

          <h4>Full Diagnostic Report</h4>
          <details>
            <summary>View Full Report</summary>
            <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ExtensionDiagnostics;
