import { AuthProvider } from './hooks/AuthProvider';
import { useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist text-sm font-semibold text-slate-600">
        Loading command center
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
