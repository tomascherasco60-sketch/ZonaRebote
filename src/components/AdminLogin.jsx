import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

// Simple admin credentials for development (hardcoded)
const ADMIN_EMAIL = 'juan.ignacio.grellet@gmail.com';
const ADMIN_PASSWORD = 'Juancho2401';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // For simplicity allow either the developer creds or actual firebase auth
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Open dashboard in new tab
        localStorage.setItem('isAdmin', '1');
        window.open('/admin/dashboard', '_blank');
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      // if successful, open dashboard
      localStorage.setItem('isAdmin', '1');
      window.open('/admin/dashboard', '_blank');
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  const handleQuick = () => {
    // Quick login using hardcoded dev creds
    localStorage.setItem('isAdmin', '1');
    window.open('/admin/dashboard', '_blank');
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
      <h2>Login Administrador</h2>
      <p>Usá credenciales de administrador para abrir el Dashboard en una nueva pestaña.</p>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <form onSubmit={handleLogin}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8 }} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ flex: 1, padding: 10, background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4 }}>Entrar</button>
        
        </div>
      </form>
    </div>
  );
}
