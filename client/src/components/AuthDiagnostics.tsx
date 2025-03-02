import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { checkAllApiEndpoints } from '../lib/auth-check';

export function AuthDiagnostics() {
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const checkResults = await checkAllApiEndpoints();
      setResults(checkResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-8">
      <h3 className="text-lg font-medium text-white mb-4">API Authentication Diagnostics</h3>
      
      <Button 
        onClick={runDiagnostics}
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Running Checks...' : 'Check API Authentication'}
      </Button>
      
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {results && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-2">Endpoint</th>
                <th className="px-4 py-2">Requires Auth</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results).map(([endpoint, data]) => (
                <tr key={endpoint} className="border-b border-gray-700">
                  <td className="px-4 py-2 font-medium">{endpoint}</td>
                  <td className="px-4 py-2">
                    {data.requiresAuth ? (
                      <span className="text-amber-400">Yes</span>
                    ) : (
                      <span className="text-green-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {data.statusCode === 200 ? (
                      <span className="text-green-400">{data.statusCode}</span>
                    ) : data.statusCode === 401 ? (
                      <span className="text-amber-400">{data.statusCode}</span>
                    ) : (
                      <span className="text-red-400">{data.statusCode}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{data.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-400">
        <p>This tool checks if API endpoints require authentication.</p>
        <p>Use it to diagnose authentication-related loading issues.</p>
      </div>
    </div>
  );
}
