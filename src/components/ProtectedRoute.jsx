import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) return <div>Cargando...</div>
    if (!user) return <Navigate to="/admin/login" replace />

    return children
}
