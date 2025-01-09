// src/app/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/components/pages/DashboardPage';  // Fix the import path

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.push('/');
    }
  }, [router]);

  return <DashboardPage />;
}