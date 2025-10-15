import React, { useState } from 'react'
import initFirebase from '../firebase'
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'

export default function AdminLogin() {
  initFirebase()
  const auth = getAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // login correcto -> redirigir al dashboard admin
      window.location.href = '/admin' // ajustá según tu routing
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) return setError('Ingresá tu email para recuperar la contraseña')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setInfo('Email de recuperación enviado. Revisa tu bandeja.')
    } catch (err) {
      setError(err.message || 'No se pudo enviar el email de recuperación')
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 20, border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>Login Admin</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: 8 }} />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
          <button type="button" onClick={handleReset} style={{ padding: '8px 12px' }}>Recuperar contraseña</button>
        </div>
      </form>

      {error && <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div>}
      {info && <div style={{ marginTop: 12, color: 'green' }}>{info}</div>}

      <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
        Nota: iniciá sesión con una cuenta válida. Si tus reglas exigen custom claim "admin", asignalo desde el Admin SDK.
      </div>
    </div>
  )
}
