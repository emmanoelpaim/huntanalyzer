import { useState, useEffect } from 'react';
import { extrairTudo, extrairDerrotadoEItens } from '../utils/extractors';
import { carregarLogs, gravarLogs } from '../services/logService';
import { obterTodosPersonagens, carregarContas } from '../services/accountService';
import { obterDerrotadosUnicos } from '../services/itemsService';
import { verificarPermissaoItens } from '../services/permissionsService';
import { format } from 'date-fns';
import { CORES } from '../config/cores';
import { useToast } from './Toast';
import SelectDerrotadoModal from './SelectDerrotadoModal';
import Select2 from './Select2';
import capaHomeImage from '../assets/capa-home.jpg';

export default function MainWindow({ onShowLogs, onShowAccounts, onShowItems, onShowDashboard, onShowHunt }) {
  const { showToast } = useToast();
  const [personagem, setPersonagem] = useState('');
  const [data, setData] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [entrada, setEntrada] = useState('');
  const [personagens, setPersonagens] = useState([]);
  const [derrotadoManual, setDerrotadoManual] = useState(null);
  const [temPermissaoItens, setTemPermissaoItens] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarModalDerrotado, setMostrarModalDerrotado] = useState(false);
  const [derrotadosDisponiveis, setDerrotadosDisponiveis] = useState([]);

  useEffect(() => {
    carregarPersonagens();
    verificarPermissao();
  }, []);

  async function carregarPersonagens() {
    try {
      const lista = await obterTodosPersonagens();
      setPersonagens(lista);
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
    }
  }

  async function verificarPermissao() {
    try {
      const permissao = await verificarPermissaoItens();
      setTemPermissaoItens(permissao);
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
    }
  }

  function limpar() {
    setEntrada('');
    setPersonagem('');
    setData(format(new Date(), 'dd/MM/yyyy'));
    setDerrotadoManual(null);
  }

  async function salvarLog() {
    const nomePersonagemCompleto = personagem.trim();
    if (!nomePersonagemCompleto) {
      showToast('O campo "Nome do personagem" é obrigatório.', 'warning');
      return;
    }

    const nomePersonagem = nomePersonagemCompleto.split(' (')[0];
    const textoOriginal = entrada.trim();
    if (!textoOriginal) {
      showToast('O campo "Cole a mensagem completa" é obrigatório.', 'warning');
      return;
    }

    const itensExtraidos = extrairTudo(textoOriginal);
    if (itensExtraidos.length === 0) {
      showToast('Nenhum loot ou alvo encontrado na mensagem.', 'warning');
      return;
    }

    const [derrotado, itens] = extrairDerrotadoEItens(textoOriginal);
    const derrotadoFinal = derrotado || derrotadoManual;

    if (!itens.length && !derrotadoFinal) {
      showToast('Nenhum item ou derrotado para salvar.', 'warning');
      return;
    }

    if (!derrotadoFinal) {
      const resposta = window.confirm('Nenhum derrotado encontrado. Deseja adicionar um derrotado antes de salvar?');
      if (resposta) {
        const derrotados = await obterDerrotadosUnicos();
        if (derrotados.length === 0) {
          showToast('Nenhum derrotado disponível.', 'warning');
          return;
        }
        setDerrotadosDisponiveis(derrotados);
        setMostrarModalDerrotado(true);
        return;
      }
    }

    await salvarLogComDados(nomePersonagem, itens, derrotadoFinal);
  }

  async function salvarLogComDados(nomePersonagem, itens, derrotado) {
    setLoading(true);
    try {
      const horaAtual = format(new Date(), 'HH:mm:ss');
      const datetimeStr = `${data} ${horaAtual}`;

      const nomePersonagemLimpo = nomePersonagem.split(' (')[0];
      const contas = await carregarContas();
      let accountId = null;
      
      for (const conta of contas) {
        for (const personagem of conta.personagens || []) {
          if (personagem.nome?.trim() === nomePersonagemLimpo) {
            accountId = conta.id;
            break;
          }
        }
        if (accountId) break;
      }

      const logs = await carregarLogs();
      const logEntry = {
        datetime: datetimeStr,
        items: itens,
        player: nomePersonagem
      };

      if (derrotado) {
        logEntry.defeated = derrotado;
      }

      if (accountId) {
        logEntry.account_id = accountId;
      }

      logs.push(logEntry);
      await gravarLogs(logs);

      showToast(`Log gravado em ${datetimeStr}.`, 'success');
      setEntrada('');
      setDerrotadoManual(null);
    } catch (error) {
      console.error('Erro ao salvar log:', error);
      showToast('Erro ao salvar log.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const logValido = entrada.trim().length > 0;

  async function handleDerrotadoSelecionado(derrotado) {
    setMostrarModalDerrotado(false);
    if (!derrotado) return;
    
    const nomePersonagemCompleto = personagem.trim();
    if (!nomePersonagemCompleto) {
      showToast('O campo "Nome do personagem" é obrigatório.', 'warning');
      return;
    }
    
    const nomePersonagem = nomePersonagemCompleto.split(' (')[0];
    const textoOriginal = entrada.trim();
    
    const [_, itens] = extrairDerrotadoEItens(textoOriginal);
    setDerrotadoManual(derrotado);
    await salvarLogComDados(nomePersonagem, itens, derrotado);
  }

  function handleCancelarDerrotado() {
    setMostrarModalDerrotado(false);
  }

  return (
    <div style={{ 
      padding: '12px', 
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${capaHomeImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 0.5,
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '10px', fontWeight: 'bold', color: CORES.branco }}>Nome do personagem: *</label>
        <div style={{ width: '300px' }}>
          <Select2
            value={personagem}
            onChange={setPersonagem}
            options={personagens}
            placeholder="Selecione ou digite o nome do personagem"
          />
        </div>
        
        <label style={{ fontSize: '10px', fontWeight: 'bold', marginLeft: '16px', color: CORES.branco }}>Data:</label>
        <input
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={{
            width: '120px',
            padding: '4px',
            fontSize: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: CORES.branco }}>
        Cole a mensagem completa: *
      </label>
      <textarea
        value={entrada}
        onChange={(e) => setEntrada(e.target.value)}
        rows={6}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          marginBottom: '12px',
          fontFamily: 'inherit'
        }}
      />

      <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={limpar}
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
          Limpar
        </button>
        <button
          onClick={salvarLog}
          disabled={!logValido || loading}
          style={{
            backgroundColor: logValido ? CORES.botao : '#ccc',
            color: CORES.branco,
            border: 'none',
            padding: '10px',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: logValido ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Salvando...' : 'Salvar log'}
        </button>
        <button
          onClick={onShowLogs}
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
          Ver logs
        </button>
        <button
          onClick={onShowAccounts}
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
          Contas
        </button>
        <button
          onClick={onShowItems}
          disabled={!temPermissaoItens}
          style={{
            backgroundColor: temPermissaoItens ? CORES.botao : '#ccc',
            color: CORES.branco,
            border: 'none',
            padding: '10px',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: temPermissaoItens ? 'pointer' : 'not-allowed'
          }}
        >
          Itens
        </button>
        <button
          onClick={onShowDashboard}
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
          Dashboard
        </button>
        <button
          onClick={onShowHunt}
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
          Analisar Hunt
        </button>
      </div>
      </div>

      {mostrarModalDerrotado && (
        <SelectDerrotadoModal
          derrotados={derrotadosDisponiveis}
          onSelect={handleDerrotadoSelecionado}
          onCancel={handleCancelarDerrotado}
        />
      )}
    </div>
  );
}
