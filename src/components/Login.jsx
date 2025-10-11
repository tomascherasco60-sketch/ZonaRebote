// Simple non-invasive Login modal for storefront (no Firebase here)
import { useState } from 'react';

export default function Login({ onClose, onLogin }) {
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // lightweight check for the original flow; if password is '1234' call onLogin
    if (password === '1234') {
      if (onLogin) onLogin();
      if (onClose) onClose();
    } else {
      alert('Contraseña incorrecta');
    }
  }

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', position: 'relative', width: '300px' }}>
      <button type="button" onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}>X</button>
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <input type="password" placeholder="Ingrese la contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#3498db', color: 'white', border: 'none' }}>Login</button>
      </form>
    </div>
  );
}
