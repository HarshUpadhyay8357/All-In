'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Place this component once in your root layout.
 * It runs on every page load and tries to silently restore the session
 * using the refresh token saved in localStorage.
 */
export default function SessionRestorer({ children }: { children: React.ReactNode }) {
  const { refreshToken, setAccessToken, setLoading, logout, isLoading, hasHydrated } = useAuthStore();

  useEffect(() => {
      if (!hasHydrated) return;

    const restoreSession = async () => {

      // No refresh token saved? User was never logged in (or logged out). Stop here.
      if (!refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Ask the server for a fresh access token using our saved refresh token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        setAccessToken(accessToken); // Got it — user is logged back in silently
      } catch (error) {
        // Refresh token expired or invalid — force logout, clear everything
        logout();
      } finally {
        setLoading(false); // Done checking, either way
      }
    };

    restoreSession();
  }, [hasHydrated]); // Runs once when the app first loads

  // While we're checking, show a simple loading state instead of flashing the login page
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0e1a',
        color: '#64748b',
        fontSize: '14px',
      }}>
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}