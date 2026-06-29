'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function RootPage() {
  const router = useRouter();
  const { accessToken, isLoading, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated || isLoading) return;

    if (accessToken) {
      router.replace('/lobby');
    } else {
      router.replace('/login');
    }
  }, [hasHydrated, isLoading, accessToken, router]);

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