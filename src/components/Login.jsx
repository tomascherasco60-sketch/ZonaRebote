import { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (password === '1234') {
      onLogin();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  return (
    <div className="login">
      <h2>Admin Login</h2>
      <input
        type="password"
        placeholder="Ingrese la contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}