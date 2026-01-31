import { useState, useEffect } from 'react';
import { verificarSessaoAtiva, obterUsuarioAtual } from './services/authService';
import { inicializarUsuario } from './services/initService';
import Login from './components/Login';
import Header from './components/Header';
import MainWindow from './components/MainWindow';
import LogsWindow from './components/LogsWindow';
import AccountsWindow from './components/AccountsWindow';
import ItemsWindow from './components/ItemsWindow';
import DashboardWindow from './components/DashboardWindow';
import ProfileWindow from './components/ProfileWindow';
import HuntWindow from './components/HuntWindow';
import { CORES } from './config/cores';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telaAtual, setTelaAtual] = useState('main');

  useEffect(() => {
    const unsubscribe = verificarSessaoAtiva(async (user) => {
      if (user) {
        setUsuario({
          id: user.uid,
          email: user.email,
          name: user.displayName,
          picture: user.photoURL
        });
        try {
          await inicializarUsuario();
        } catch (error) {
          console.error('Erro ao inicializar usuário:', error);
        }
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (usuarioData) => {
    setUsuario(usuarioData);
  };

  const handleLogout = () => {
    setUsuario(null);
    setTelaAtual('main');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: CORES.fundo
      }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: CORES.fundo }}>
      <Header 
        usuario={usuario} 
        onLogout={handleLogout}
        onShowProfile={() => setTelaAtual('profile')}
      />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {telaAtual === 'main' && (
          <MainWindow
            onShowLogs={() => setTelaAtual('logs')}
            onShowAccounts={() => setTelaAtual('accounts')}
            onShowItems={() => setTelaAtual('items')}
            onShowDashboard={() => setTelaAtual('dashboard')}
            onShowHunt={() => setTelaAtual('hunt')}
          />
        )}
        {telaAtual === 'logs' && (
          <LogsWindow onBack={() => setTelaAtual('main')} />
        )}
        {telaAtual === 'accounts' && (
          <AccountsWindow onBack={() => setTelaAtual('main')} />
        )}
        {telaAtual === 'items' && (
          <ItemsWindow onBack={() => setTelaAtual('main')} />
        )}
        {telaAtual === 'dashboard' && (
          <DashboardWindow onBack={() => setTelaAtual('main')} />
        )}
        {telaAtual === 'profile' && (
          <ProfileWindow onBack={() => setTelaAtual('main')} />
        )}
        {telaAtual === 'hunt' && (
          <HuntWindow onBack={() => setTelaAtual('main')} />
        )}
      </div>
    </div>
  );
}

export default App;
