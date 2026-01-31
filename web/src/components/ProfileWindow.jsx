import { useState, useEffect } from 'react';
import { obterDadosUsuario } from '../services/userService';
import { obterUsuarioAtual } from '../services/authService';
import { CORES } from '../config/cores';

export default function ProfileWindow({ onBack }) {
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const userAuth = obterUsuarioAtual();
      if (!userAuth) {
        alert('Usuário não autenticado. Por favor, faça login novamente.');
        return;
      }

      const dados = await obterDadosUsuario();
      
      if (dados) {
        setDadosUsuario({
          ...dados,
          uid: dados.uid || dados.id || userAuth.uid
        });
      } else {
        const dadosIniciais = {
          id: userAuth.uid,
          uid: userAuth.uid,
          name: userAuth.displayName || userAuth.name || '',
          email: userAuth.email || '',
          picture: userAuth.photoURL || userAuth.picture || '',
          createdAt: new Date().toISOString()
        };
        setDadosUsuario(dadosIniciais);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      const userAuth = obterUsuarioAtual();
      if (userAuth) {
        const dadosFallback = {
          id: userAuth.uid,
          uid: userAuth.uid,
          name: userAuth.displayName || userAuth.name || '',
          email: userAuth.email || '',
          picture: userAuth.photoURL || userAuth.picture || '',
          createdAt: 'Não disponível'
        };
        setDadosUsuario(dadosFallback);
      } else {
        alert('Erro ao carregar dados do perfil. Usuário não autenticado.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center' }}>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  const userAuth = obterUsuarioAtual();
  const fotoPerfil = dadosUsuario?.picture || userAuth?.photoURL || '';
  
  const uidExibido = userAuth?.uid || dadosUsuario?.uid || dadosUsuario?.id || 'Não disponível';
  
  let dataCriacao = 'Não disponível';
  if (dadosUsuario?.createdAt) {
    try {
      const date = new Date(dadosUsuario.createdAt);
      if (!isNaN(date.getTime())) {
        dataCriacao = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      console.error('Erro ao formatar data de criação:', e);
    }
  }
  
  let dataAtualizacao = 'Não disponível';
  if (dadosUsuario?.updatedAt) {
    try {
      const date = new Date(dadosUsuario.updatedAt);
      if (!isNaN(date.getTime())) {
        dataAtualizacao = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      console.error('Erro ao formatar data de atualização:', e);
    }
  }

  return (
    <div style={{ padding: '12px', backgroundColor: CORES.fundo, minHeight: '100vh' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            backgroundColor: CORES.botao,
            color: CORES.branco,
            border: 'none',
            padding: '10px',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Voltar
        </button>
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: CORES.branco,
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '24px',
          color: '#333',
          borderBottom: '2px solid ' + CORES.botao,
          paddingBottom: '8px'
        }}>
          Meu Perfil
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid #eee'
        }}>
          {fotoPerfil && (
            <img
              src={fotoPerfil}
              alt="Foto do perfil"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '4px solid ' + CORES.botao,
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            />
          )}
          {!fotoPerfil && (
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: CORES.botao,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: CORES.branco,
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              👤
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'block',
            marginBottom: '6px',
            color: '#666'
          }}>
            Nome:
          </label>
          <div style={{
            padding: '8px',
            fontSize: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            {dadosUsuario?.name || 'Não informado'}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'block',
            marginBottom: '6px',
            color: '#666'
          }}>
            E-mail:
          </label>
          <div style={{
            padding: '8px',
            fontSize: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            {dadosUsuario?.email || 'Não informado'}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'block',
            marginBottom: '6px',
            color: '#666'
          }}>
            UID do Firebase:
          </label>
          <div style={{
            padding: '8px',
            fontSize: '11px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}>
            {uidExibido}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '6px',
              color: '#666'
            }}>
              Conta criada em:
            </label>
            <div style={{
              padding: '8px',
              fontSize: '11px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              {dataCriacao}
            </div>
          </div>
          <div>
            <label style={{
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '6px',
              color: '#666'
            }}>
              Última atualização:
            </label>
            <div style={{
              padding: '8px',
              fontSize: '11px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              {dataAtualizacao}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
