import { fazerLogout } from '../services/authService';
import { CORES } from '../config/cores';

export default function Header({ usuario, onLogout, onShowProfile }) {
  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair?')) {
      try {
        await fazerLogout();
        onLogout();
      } catch (error) {
        console.error('Erro no logout:', error);
      }
    }
  };

  return (
    <div style={{
      backgroundColor: CORES.vermelho,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{
          color: CORES.branco,
          fontSize: '16px',
          fontWeight: 'bold',
          margin: 0,
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          ⚡ Analisador de Loot Pokémon ⚡
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {usuario && (
          <div 
            onClick={onShowProfile}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {usuario.picture && (
              <img
                src={usuario.picture}
                alt={usuario.name || 'Usuário'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid ' + CORES.branco,
                  cursor: 'pointer'
                }}
              />
            )}
            <span style={{ color: CORES.branco, fontSize: '11px', fontWeight: '500' }}>
              👤 {usuario.name || usuario.email || 'Usuário'}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#CC0000',
            color: CORES.branco,
            border: 'none',
            padding: '8px 16px',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#AA0000'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#CC0000'}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
