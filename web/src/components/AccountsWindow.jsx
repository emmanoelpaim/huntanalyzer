import { useState, useEffect } from 'react';
import { carregarContas, gravarContas } from '../services/accountService';
import { CORES } from '../config/cores';
import { useToast } from './Toast';

export default function AccountsWindow({ onBack }) {
  const { showToast } = useToast();
  const [contas, setContas] = useState([]);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    senha: '',
    personagem: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const contasData = await carregarContas();
      setContas(contasData);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  }

  function selecionarConta(conta) {
    setContaSelecionada(conta);
    setFormData({
      nome: conta.nome || '',
      senha: conta.senha || '',
      personagem: ''
    });
  }

  function limparForm() {
    setContaSelecionada(null);
    setFormData({ nome: '', senha: '', personagem: '' });
  }

  async function salvarConta() {
    if (!formData.nome.trim()) {
      showToast('Nome da conta é obrigatório.', 'warning');
      return;
    }
    if (!formData.senha.trim()) {
      showToast('Senha é obrigatória.', 'warning');
      return;
    }

    try {
      const contasAtualizadas = [...contas];
      
      if (contaSelecionada) {
        const idx = contasAtualizadas.findIndex(c => c.id === contaSelecionada.id);
        if (idx >= 0) {
          contasAtualizadas[idx] = {
            ...contasAtualizadas[idx],
            nome: formData.nome,
            senha: formData.senha
          };
        }
      } else {
        contasAtualizadas.push({
          nome: formData.nome,
          senha: formData.senha,
          personagens: []
        });
      }

      await gravarContas(contasAtualizadas);
      await carregarDados();
      limparForm();
      showToast('Conta salva com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      console.error('Detalhes do erro:', error.code, error.message);
      let mensagemErro = 'Erro ao salvar conta.';
      if (error.code === 'permission-denied') {
        mensagemErro = 'Erro: Permissão negada. Verifique as regras do Firestore.';
      } else if (error.message) {
        mensagemErro = `Erro ao salvar conta: ${error.message}`;
      }
      showToast(mensagemErro, 'error');
    }
  }

  async function excluirConta() {
    if (!contaSelecionada) {
      showToast('Selecione uma conta para excluir.', 'warning');
      return;
    }

    if (!window.confirm(`Deseja realmente excluir a conta '${contaSelecionada.nome}'?`)) {
      return;
    }

    try {
      const contasAtualizadas = contas.filter(c => c.id !== contaSelecionada.id);
      await gravarContas(contasAtualizadas);
      await carregarDados();
      limparForm();
      showToast('Conta excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      showToast('Erro ao excluir conta.', 'error');
    }
  }

  async function adicionarPersonagem() {
    if (!contaSelecionada) {
      showToast('Selecione uma conta primeiro.', 'warning');
      return;
    }

    if (!formData.personagem.trim()) {
      showToast('Nome do personagem é obrigatório.', 'warning');
      return;
    }

    try {
      const contasAtualizadas = [...contas];
      const idx = contasAtualizadas.findIndex(c => c.id === contaSelecionada.id);
      
      if (idx >= 0) {
        if (!contasAtualizadas[idx].personagens) {
          contasAtualizadas[idx].personagens = [];
        }
        contasAtualizadas[idx].personagens.push({
          nome: formData.personagem.trim()
        });
        
        await gravarContas(contasAtualizadas);
        await carregarDados();
        setContaSelecionada(contasAtualizadas[idx]);
        setFormData({ ...formData, personagem: '' });
        showToast('Personagem adicionado com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro ao adicionar personagem:', error);
      showToast('Erro ao adicionar personagem.', 'error');
    }
  }

  async function excluirPersonagem(personagemNome) {
    if (!contaSelecionada) {
      return;
    }

    if (!window.confirm('Deseja realmente excluir este personagem?')) {
      return;
    }

    try {
      const contasAtualizadas = [...contas];
      const idx = contasAtualizadas.findIndex(c => c.id === contaSelecionada.id);
      
      if (idx >= 0) {
        contasAtualizadas[idx].personagens = contasAtualizadas[idx].personagens.filter(
          p => p.nome !== personagemNome
        );
        
        await gravarContas(contasAtualizadas);
        await carregarDados();
        setContaSelecionada(contasAtualizadas[idx]);
        showToast('Personagem excluído com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro ao excluir personagem:', error);
      showToast('Erro ao excluir personagem.', 'error');
    }
  }

  function copiarSenha(senha) {
    if (!senha) {
      showToast('Nenhuma senha para copiar.', 'warning');
      return;
    }

    navigator.clipboard.writeText(senha).then(() => {
      showToast('Senha copiada para a área de transferência!', 'success');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = senha;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('Senha copiada para a área de transferência!', 'success');
      } catch (err) {
        showToast('Erro ao copiar senha.', 'error');
      }
      document.body.removeChild(textarea);
    });
  }

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center' }}>
        <p>Carregando contas...</p>
      </div>
    );
  }

  const personagensSelecionados = contaSelecionada?.personagens || [];

  return (
    <div style={{ padding: '12px', backgroundColor: CORES.fundo, minHeight: '100vh' }}>
      <div style={{ marginBottom: '8px' }}>
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
        backgroundColor: CORES.branco,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '12px',
        border: '1px solid #ccc'
      }}>
        <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
          Cadastro de Conta
        </h3>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
            Nome da conta:
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
            Senha:
          </label>
          <input
            type="password"
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={limparForm}
            style={{
              backgroundColor: '#999',
              color: CORES.branco,
              border: 'none',
              padding: '8px',
              fontSize: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Limpar
          </button>
          <button
            onClick={salvarConta}
            style={{
              backgroundColor: CORES.botao,
              color: CORES.branco,
              border: 'none',
              padding: '8px',
              fontSize: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Salvar
          </button>
          <button
            onClick={excluirConta}
            disabled={!contaSelecionada}
            style={{
              backgroundColor: contaSelecionada ? '#CC0000' : '#ccc',
              color: CORES.branco,
              border: 'none',
              padding: '8px',
              fontSize: '10px',
              borderRadius: '4px',
              cursor: contaSelecionada ? 'pointer' : 'not-allowed'
            }}
          >
            Excluir
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: CORES.branco,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '12px',
        border: '1px solid #ccc'
      }}>
        <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
          Contas Cadastradas
        </h3>
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {contas.length === 0 ? (
            <p style={{ fontSize: '9px', color: '#666' }}>Nenhuma conta cadastrada.</p>
          ) : (
            contas.map((conta) => (
              <div
                key={conta.id}
                onClick={() => selecionarConta(conta)}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: contaSelecionada?.id === conta.id ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: contaSelecionada?.id === conta.id ? '2px solid ' + CORES.botao : '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{conta.nome}</div>
                  <div style={{ fontSize: '9px', color: '#666' }}>
                    Senha: {'*'.repeat(conta.senha?.length || 0)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copiarSenha(conta.senha);
                  }}
                  style={{
                    backgroundColor: '#007bff',
                    color: CORES.branco,
                    border: 'none',
                    padding: '4px 8px',
                    fontSize: '9px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Copiar Senha
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {contaSelecionada && (
        <div style={{
          backgroundColor: CORES.branco,
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #ccc'
        }}>
          <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
            Personagens da Conta: {contaSelecionada.nome}
          </h3>
          
          <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={formData.personagem}
              onChange={(e) => setFormData({ ...formData, personagem: e.target.value })}
              placeholder="Nome do personagem"
              style={{
                flex: 1,
                padding: '4px',
                fontSize: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={adicionarPersonagem}
              style={{
                backgroundColor: CORES.botao,
                color: CORES.branco,
                border: 'none',
                padding: '4px 8px',
                fontSize: '10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Adicionar
            </button>
          </div>

          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {personagensSelecionados.length === 0 ? (
              <p style={{ fontSize: '9px', color: '#666' }}>Nenhum personagem cadastrado.</p>
            ) : (
              personagensSelecionados.map((personagem, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    marginBottom: '4px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}
                >
                  <span style={{ fontSize: '10px' }}>{personagem.nome}</span>
                  <button
                    onClick={() => excluirPersonagem(personagem.nome)}
                    style={{
                      backgroundColor: '#CC0000',
                      color: CORES.branco,
                      border: 'none',
                      padding: '2px 6px',
                      fontSize: '9px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Excluir
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
