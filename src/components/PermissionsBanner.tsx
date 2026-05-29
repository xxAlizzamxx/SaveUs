import { AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function PermissionsBanner() {
  const { locationError, permissionsReady } = useApp();

  if (!permissionsReady || !locationError) return null;

  return (
    <div className="permissions-banner">
      <AlertCircle size={16} />
      <span>{locationError}</span>
    </div>
  );
}
