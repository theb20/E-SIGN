import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState('login') // 'login' | 'register'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (tab === 'login') await login(email, password)
      else await register(email, password, name)
      navigate('/')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded flex items-center justify-center bg-[#FA0F00]">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 20 20">
              <path d="M3 3h9l5 5v9H3V3z" fill="white" opacity="0.95" />
              <path d="M12 3v6h5" stroke="rgba(200,0,0,0.5)" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <span className="text-[#1B1B1B] text-lg font-bold tracking-widest">E·SIGN</span>
        </div>

        <div className="bg-white border border-[#E8E8E8]" style={{ borderRadius: '2px' }}>
          <div className="h-1 rounded-t-sm bg-[#1473E6]" />

          {/* Tabs */}
          <div className="flex border-b border-[#E8E8E8]">
            {[{ id: 'login', label: 'Connexion' }, { id: 'register', label: 'Créer un compte' }].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(null) }}
                className={`flex-1 py-3 text-[13px] font-semibold transition-colors border-b-2 -mb-px ${
                  tab === t.id
                    ? 'border-[#1473E6] text-[#1473E6]'
                    : 'border-transparent text-[#888] hover:text-[#333]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {tab === 'register' && (
              <div>
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Nom complet</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jean Dupont" required
                  className="w-full border border-[#CCCCCC] px-3 py-2 text-[13px] focus:outline-none focus:border-[#1473E6] transition-colors"
                  style={{ borderRadius: '2px' }}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.fr" required
                className="w-full border border-[#CCCCCC] px-3 py-2 text-[13px] focus:outline-none focus:border-[#1473E6] transition-colors"
                style={{ borderRadius: '2px' }}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Mot de passe</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full border border-[#CCCCCC] px-3 py-2 text-[13px] focus:outline-none focus:border-[#1473E6] transition-colors"
                style={{ borderRadius: '2px' }}
              />
            </div>

            {error && (
              <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 text-white text-[13px] font-semibold transition-all disabled:opacity-50"
              style={{ background: '#1473E6', borderRadius: '2px' }}
            >
              {loading ? 'Chargement…' : tab === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#AAAAAA] mt-4">
          En vous connectant, vous acceptez les conditions d'utilisation.
        </p>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/invalid-credential':    'Email ou mot de passe incorrect.',
    'auth/user-not-found':        'Aucun compte avec cet email.',
    'auth/wrong-password':        'Mot de passe incorrect.',
    'auth/email-already-in-use':  'Un compte existe déjà avec cet email.',
    'auth/weak-password':         'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/invalid-email':         'Email invalide.',
    'auth/too-many-requests':     'Trop de tentatives. Réessayez plus tard.',
    'auth/operation-not-allowed': 'Connexion par email non activée. Contactez l\'administrateur.',
    'auth/network-request-failed':'Erreur réseau. Vérifiez votre connexion.',
  }
  return map[code] ?? `Erreur : ${code}`
}
