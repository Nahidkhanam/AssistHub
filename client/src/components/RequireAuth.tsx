import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <p role="status" className="mx-auto max-w-3xl px-4 py-12">Loading your account…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (admin && user.role !== 'admin') {
    return <section className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-4xl font-bold text-brand">Admins only</h1><p className="mt-3">Your account does not have access to this page.</p></section>;
  }
  return <>{children}</>;
}
