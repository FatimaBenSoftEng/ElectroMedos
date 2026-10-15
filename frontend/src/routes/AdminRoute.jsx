import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/common/Loader';

export default function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return <Loader fullPage />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
