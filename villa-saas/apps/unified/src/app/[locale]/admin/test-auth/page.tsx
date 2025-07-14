'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      console.log('Testing auth...');
      const response = await apiClient.get('/api/users/me');
      console.log('Auth test response:', response);
      setResult(response);
    } catch (error) {
      console.error('Auth test error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testStripeOAuth = async () => {
    setLoading(true);
    try {
      console.log('Testing Stripe OAuth...');
      const response = await apiClient.get<{ url: string }>('/api/stripe/connect/oauth');
      console.log('Stripe OAuth response:', response);
      setResult(response);
    } catch (error) {
      console.error('Stripe OAuth error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Authentication</h1>
      
      <div className="space-y-4">
        <Button onClick={testAuth} disabled={loading}>
          Test Auth (/api/users/me)
        </Button>
        
        <Button onClick={testStripeOAuth} disabled={loading}>
          Test Stripe OAuth
        </Button>
      </div>

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}