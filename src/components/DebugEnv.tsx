import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugEnv() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [apiTestResult, setApiTestResult] = useState<string>('Not tested');

  useEffect(() => {
    // Get all import.meta.env variables
    const env: Record<string, string> = {};
    Object.keys(import.meta.env).forEach(key => {
      // Don't include the actual keys in output, just whether they exist
      if (key.includes('KEY') || key.includes('SECRET')) {
        env[key] = `[exists: ${!!import.meta.env[key]}]`;
      } else {
        env[key] = import.meta.env[key];
      }
    });
    setEnvVars(env);

    // Check auth status
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setAuthStatus(`Auth error: ${error.message}`);
        } else if (data?.session) {
          setAuthStatus(`Authenticated as ${data.session.user.email}`);
        } else {
          setAuthStatus('Not authenticated');
        }
      } catch (err) {
        setAuthStatus(`Auth check error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    checkAuth();
  }, []);

  const testApiConnection = async () => {
    setApiTestResult('Testing...');
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('API test error:', error);
        setApiTestResult(`API Error: ${error.message}`);
      } else {
        setApiTestResult(`API Connection Successful. Response: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error('API test exception:', err);
      setApiTestResult(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50 max-w-2xl">
      <h2 className="text-lg font-semibold mb-3">Environment Debugging</h2>
      
      <div className="mb-4">
        <h3 className="font-medium">Auth Status</h3>
        <div className="bg-white p-2 rounded border">{authStatus}</div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium">API Connection Test</h3>
        <div className="bg-white p-2 rounded border mb-2">{apiTestResult}</div>
        <button 
          onClick={testApiConnection}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test API Connection
        </button>
      </div>
      
      <div>
        <h3 className="font-medium">Environment Variables</h3>
        <pre className="bg-white p-2 rounded border overflow-auto text-xs">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
    </div>
  );
} 