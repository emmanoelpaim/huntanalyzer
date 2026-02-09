import { useState, useEffect } from 'react';
import { carregarLogs, gravarLogs } from '../services/logService';
import { carregarItens } from '../services/itemsService';
import { exportarParaExcel, setToastFunction } from '../services/exportService';
import { formatarDataPtbr, obterChaveDiaPlayer } from '../utils/formatters';
import { CORES } from '../config/cores';
import { useToast } from './Toast';

export default function LogsWindow({ onBack }) {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dadosTree, setDadosTree] = useState({});
  const [expandedDerrotados, setExpandedDerrotados] = useState(new Set());

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    setToastFunction(showToast);
  }, [showToast]);

  async function carregarDados() {
    setLoading(true);
    try {
      const logsData = await carregarLogs();
      setLogs(logsData);
      const treeData = await processarLogs(logsData);
      setDadosTree(treeData);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function processarLogs(logsData) {
    const itensCache = await carregarItens();
    
    function buscarValorItem(derrotado, nomeItem) {
      const nomeItemLower = nomeItem.toLowerCase();
      const derrotadoLower = derrotado.toLowerCase();

      for (const item of itensCache) {
        if (item.derrotado?.toLowerCase() === derrotadoLower &&
            item.nome_item?.toLowerCase() === nomeItemLower) {
          return item.valor || 0;
        }
      }

      const terminacoesPlurais = ['as', 'es', 'is', 'os', 'us', 's'];
      for (const terminacao of terminacoesPlurais) {
        if (nomeItemLower.endsWith(terminacao) && nomeItemLower.length > terminacao.length) {
          const nomeSingular = nomeItemLower.slice(0, -terminacao.length);
          for (const item of itensCache) {
            if (item.derrotado?.toLowerCase() === derrotadoLower &&
                item.nome_item?.toLowerCase() === nomeSingular) {
              return item.valor || 0;
            }
          }
        }
      }

      return 0;
    }

    function calcularValorItem(derrotado, itemStr) {
      const match = itemStr.match(/^(\d+)\s+(.+)$/);
      const quantidade = match ? parseInt(match[1]) : 1;
      const nomeItem = match ? match[2].trim() : itemStr.trim();
      const valorUnitario = buscarValorItem(derrotado, nomeItem);
      return quantidade * valorUnitario;
    }

    const logsPorDiaPlayer = {};
    
    for (const log of logsData) {
      const chave = obterChaveDiaPlayer(log);
      if (!logsPorDiaPlayer[chave]) {
        logsPorDiaPlayer[chave] = [];
      }
      logsPorDiaPlayer[chave].push(log);
    }

    const treeData = {};
    for (const [chave, logsDiaPlayer] of Object.entries(logsPorDiaPlayer)) {
      const dataPtbr = formatarDataPtbr(logsDiaPlayer[0].datetime);
      const player = logsDiaPlayer[0].player || 'Sem nome';
      const totalItensDia = logsDiaPlayer.reduce((sum, log) => sum + (log.items?.length || 0), 0);
      
      let valorTotalDia = 0;
      const derrotadosPorNome = {};
      
      for (const log of logsDiaPlayer) {
        const derrotado = log.defeated;
        if (derrotado) {
          if (!derrotadosPorNome[derrotado]) {
            derrotadosPorNome[derrotado] = [];
          }
          derrotadosPorNome[derrotado].push(log);
          
          if (log.items) {
            for (const item of log.items) {
              valorTotalDia += calcularValorItem(derrotado, item);
            }
          }
        }
      }

      const diaId = `dia-${chave}`;
      treeData[diaId] = {
        tipo: 'dia',
        logs: logsDiaPlayer,
        texto: `${dataPtbr} - ${player} (${totalItensDia} itens)`,
        valorTotal: valorTotalDia
      };

      for (const [derrotadoNome, logsDerrotado] of Object.entries(derrotadosPorNome)) {
        let valorTotalDerrotado = 0;
        for (const log of logsDerrotado) {
          if (log.items) {
            for (const item of log.items) {
              valorTotalDerrotado += calcularValorItem(derrotadoNome, item);
            }
          }
        }
        
        const derrotadoId = `${diaId}-${derrotadoNome}`;
        treeData[derrotadoId] = {
          tipo: 'derrotado',
          logs: logsDerrotado,
          texto: derrotadoNome,
          parent: diaId,
          valorTotal: valorTotalDerrotado
        };
      }
    }

    return treeData;
  }

  async function excluirDia(diaId) {
    if (!window.confirm('Deseja realmente excluir todos os logs deste dia?')) {
      return;
    }

    const dados = dadosTree[diaId];
    if (dados?.tipo !== 'dia') return;

    try {
      const logsAtuais = await carregarLogs();
      const chave = obterChaveDiaPlayer(dados.logs[0]);
      const logsFiltrados = logsAtuais.filter(log => obterChaveDiaPlayer(log) !== chave);
      
      await gravarLogs(logsFiltrados);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir dia:', error);
      showToast('Erro ao excluir logs.', 'error');
    }
  }

  async function excluirDerrotado(derrotadoId) {
    if (!window.confirm('Deseja realmente excluir todos os logs deste derrotado?')) {
      return;
    }

    const dados = dadosTree[derrotadoId];
    if (dados?.tipo !== 'derrotado') return;

    try {
      const logsAtuais = await carregarLogs();
      const logsIdsRemover = new Set(dados.logs.map(log => log.id).filter(Boolean));
      const logsFiltrados = logsAtuais.filter(log => !logsIdsRemover.has(log.id));
      
      await gravarLogs(logsFiltrados);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir derrotado:', error);
      showToast('Erro ao excluir logs.', 'error');
    }
  }

  function calcularValorItem(derrotado, itemStr) {
    const match = itemStr.match(/^(\d+)\s+(.+)$/);
    const quantidade = match ? parseInt(match[1]) : 1;
    const nomeItem = match ? match[2].trim() : itemStr.trim();
    
    return { quantidade, nomeItem };
  }

  function toggleDerrotado(derrotadoId) {
    setExpandedDerrotados(prev => {
      const novo = new Set(prev);
      if (novo.has(derrotadoId)) {
        novo.delete(derrotadoId);
      } else {
        novo.add(derrotadoId);
      }
      return novo;
    });
  }

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center' }}>
        <p>Carregando logs...</p>
      </div>
    );
  }

  const dias = Object.entries(dadosTree).filter(([_, dados]) => dados.tipo === 'dia');

  return (
    <div style={{ padding: '12px', backgroundColor: CORES.fundo, minHeight: '100vh' }}>
      <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
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
        <button
          onClick={exportarParaExcel}
          style={{
            backgroundColor: '#28a745',
            color: CORES.branco,
            border: 'none',
            padding: '10px',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          Exportar para Excel
        </button>
      </div>

      <h2 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
        Logs agrupados por dia:
      </h2>

      <div style={{
        backgroundColor: CORES.branco,
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        maxHeight: '70vh',
        overflow: 'auto'
      }}>
        {dias.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Nenhum log encontrado.</p>
        ) : (
          dias.map(([diaId, dadosDia]) => (
            <div key={diaId} style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f0f0f0',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '4px'
              }}>
                <div>
                  <strong style={{ fontSize: '10px', fontWeight: 'bold' }}>
                    {dadosDia.texto}
                  </strong>
                  {dadosDia.valorTotal > 0 && (
                    <span style={{ fontSize: '9px', color: '#28a745', marginLeft: '8px', fontWeight: 'bold' }}>
                      Valor Total: {dadosDia.valorTotal.toFixed(2)} K
                    </span>
                  )}
                </div>
                <button
                  onClick={() => excluirDia(diaId)}
                  style={{
                    backgroundColor: '#CC0000',
                    color: CORES.branco,
                    border: 'none',
                    padding: '4px 8px',
                    fontSize: '9px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Excluir Dia
                </button>
              </div>
              
              {Object.entries(dadosTree)
                .filter(([id, dados]) => dados.parent === diaId)
                .map(([derrotadoId, dadosDerrotado]) => {
                  const isExpanded = expandedDerrotados.has(derrotadoId);
                  return (
                    <div key={derrotadoId} style={{ marginLeft: '20px', marginTop: '4px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => toggleDerrotado(derrotadoId)}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #ccc',
                              padding: '2px 6px',
                              fontSize: '10px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              minWidth: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={isExpanded ? 'Colapsar' : 'Expandir'}
                          >
                            {isExpanded ? '−' : '+'}
                          </button>
                          <div>
                            <strong style={{ fontSize: '9px', fontWeight: 'bold' }}>
                              {dadosDerrotado.texto}
                            </strong>
                            {dadosDerrotado.valorTotal > 0 && (
                              <span style={{ fontSize: '8px', color: '#28a745', marginLeft: '8px', fontWeight: 'bold' }}>
                                {dadosDerrotado.valorTotal.toFixed(2)} K
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => excluirDerrotado(derrotadoId)}
                          style={{
                            backgroundColor: '#CC0000',
                            color: CORES.branco,
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '9px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                      
                      {isExpanded && dadosDerrotado.logs.map((log, idx) => (
                        <div key={idx} style={{ marginLeft: '20px', fontSize: '9px', color: '#666', marginTop: '4px' }}>
                          {log.items?.map((item, itemIdx) => (
                            <div key={itemIdx} style={{ padding: '2px 0' }}>{item}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
