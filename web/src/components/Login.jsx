import { useState } from 'react';
import capaImage from '../assets/capa.jpg';
import { CORES } from '../config/cores';
import { fazerLoginGoogle } from '../services/authService';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const usuario = await fazerLoginGoogle();
      if (usuario) {
        onLoginSuccess(usuario);
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      console.error('Erro no login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        zIndex: 0
      }} />
      <img
        src={capaImage}
        alt="Background"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 0.5,
          pointerEvents: 'none'
        }}
      />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1
      }} />
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '50px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
        zIndex: 2,
        backdropFilter: 'blur(5px)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: CORES.preto,
          marginBottom: '8px'
        }}>
          Loot Analyzer
        </h1>

        <p style={{
          fontSize: '11px',
          color: '#666666',
          marginBottom: '20px'
        }}>
          Faça login com sua conta Google
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: CORES.botao,
            color: CORES.branco,
            border: 'none',
            padding: '12px 40px',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: '10px'
          }}
        >
          {loading ? 'Carregando...' : 'Entrar com Google'}
        </button>

        {error && (
          <p style={{ color: '#FF0000', fontSize: '9px', marginTop: '10px' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
