import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { carregarLogs } from '../services/logService';
import { carregarItens } from '../services/itemsService';
import { parse, format, startOfWeek, endOfWeek } from 'date-fns';
import { CORES } from '../config/cores';

export default function DashboardWindow({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dadosGraficos, setDadosGraficos] = useState({
    valoresPorDia: [],
    valoresPorPersonagem: [],
    topItens: [],
    topDerrotados: []
  });

  useEffect(() => {
    const hoje = new Date();
    const diasParaSegunda = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1;
    const ultimaSegunda = new Date(hoje);
    ultimaSegunda.setDate(hoje.getDate() - diasParaSegunda);
    const domingo = new Date(ultimaSegunda);
    domingo.setDate(ultimaSegunda.getDate() + 6);

    setDataInicio(format(ultimaSegunda, 'dd/MM/yyyy'));
    setDataFim(format(domingo, 'dd/MM/yyyy'));
  }, []);

  useEffect(() => {
    if (dataInicio && dataFim) {
      atualizarGraficos();
    }
  }, [dataInicio, dataFim]);

  function extrairQuantidadeENome(itemStr) {
    const match = itemStr.match(/^(\d+)\s+(.+)$/);
    if (match) {
      return [parseInt(match[1]), match[2].trim()];
    }
    return [1, itemStr.trim()];
  }


  async function atualizarGraficos() {
    setLoading(true);
    try {
      const logs = await carregarLogs();

      let dataInicioDt = null;
      let dataFimDt = null;

      try {
        if (dataInicio) {
          dataInicioDt = parse(dataInicio, 'dd/MM/yyyy', new Date());
        }
        if (dataFim) {
          dataFimDt = parse(dataFim, 'dd/MM/yyyy', new Date());
          dataFimDt.setHours(23, 59, 59);
        }
      } catch (error) {
        console.error('Erro ao parsear datas:', error);
      }

      const valoresPorDia = {};
      const valoresPorPersonagem = {};
      const itensContagem = {};
      const derrotadosContagem = {};
      const itensCache = await carregarItens();

      function buscarValorItemCache(derrotado, nomeItem) {
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

      function calcularValorItemSync(derrotado, itemStr) {
        const [quantidade, nomeItem] = extrairQuantidadeENome(itemStr);
        const valorUnitario = buscarValorItemCache(derrotado, nomeItem);
        return quantidade * valorUnitario;
      }

      for (const log of logs) {
        const dataStr = log.datetime || '';
        let dtLog = null;
        let chaveData = 'Sem data';

        if (dataStr) {
          try {
            const dataParte = dataStr.split(' ')[0];
            dtLog = parse(dataParte, 'dd/MM/yyyy', new Date());
            chaveData = format(dtLog, 'dd/MM/yyyy');
          } catch {
            chaveData = dataParte || 'Sem data';
          }
        }

        if (dataInicioDt && dtLog && dtLog < dataInicioDt) continue;
        if (dataFimDt && dtLog && dtLog > dataFimDt) continue;

        const personagem = log.player || 'Sem nome';
        const derrotado = log.defeated || '';
        const itens = log.items || [];

        let valorTotalLog = 0;
        for (const item of itens) {
          const [quantidade, nomeItem] = extrairQuantidadeENome(item);
          itensContagem[nomeItem] = (itensContagem[nomeItem] || 0) + quantidade;

          if (derrotado) {
            const valorItem = calcularValorItemSync(derrotado, item);
            valorTotalLog += valorItem;
          }
        }

        if (derrotado) {
          derrotadosContagem[derrotado] = (derrotadosContagem[derrotado] || 0) + 1;
        }

        valoresPorDia[chaveData] = (valoresPorDia[chaveData] || 0) + valorTotalLog;
        valoresPorPersonagem[personagem] = (valoresPorPersonagem[personagem] || 0) + valorTotalLog;
      }

      const valoresPorDiaArray = Object.entries(valoresPorDia)
        .sort()
        .map(([data, valor]) => ({ data, valor: parseFloat(valor.toFixed(2)) }));

      const valoresPorPersonagemArray = Object.entries(valoresPorPersonagem)
        .map(([personagem, valor]) => ({ personagem, valor: parseFloat(valor.toFixed(2)) }))
        .sort((a, b) => b.valor - a.valor);

      const topItens = Object.entries(itensContagem)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      const topDerrotados = Object.entries(derrotadosContagem)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      setDadosGraficos({
        valoresPorDia: valoresPorDiaArray,
        valoresPorPersonagem: valoresPorPersonagemArray,
        topItens,
        topDerrotados
      });
    } catch (error) {
      console.error('Erro ao atualizar gráficos:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center' }}>
        <p>Carregando gráficos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', backgroundColor: CORES.fundo, minHeight: '100vh' }}>
      <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '10px' }}>Data Início:</label>
        <input
          type="text"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          style={{
            width: '120px',
            padding: '4px',
            fontSize: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <label style={{ fontSize: '10px', marginLeft: '8px' }}>Data Fim:</label>
        <input
          type="text"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          style={{
            width: '120px',
            padding: '4px',
            fontSize: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={atualizarGraficos}
          style={{
            backgroundColor: CORES.botao,
            color: CORES.branco,
            border: 'none',
            padding: '8px',
            fontSize: '10px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          Atualizar Gráficos
        </button>
        <button
          onClick={onBack}
          style={{
            backgroundColor: CORES.botao,
            color: CORES.branco,
            border: 'none',
            padding: '8px',
            fontSize: '10px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          Voltar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={{ backgroundColor: CORES.branco, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
            Valor Total por Dia
          </h3>
          {dadosGraficos.valoresPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dadosGraficos.valoresPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke={CORES.botao} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', fontSize: '9px' }}>Sem dados disponíveis</p>
          )}
        </div>

        <div style={{ backgroundColor: CORES.branco, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
            Valor Total por Personagem
          </h3>
          {dadosGraficos.valoresPorPersonagem.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dadosGraficos.valoresPorPersonagem}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="personagem" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="valor" fill={CORES.botao} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', fontSize: '9px' }}>Sem dados disponíveis</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ backgroundColor: CORES.branco, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
            Top 10 Itens Mais Coletados
          </h3>
          {dadosGraficos.topItens.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={dadosGraficos.topItens}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="nome" type="category" width={100} fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#FF6B6B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', fontSize: '9px' }}>Sem dados disponíveis</p>
          )}
        </div>

        <div style={{ backgroundColor: CORES.branco, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
            Top 10 Derrotados Mais Frequentes
          </h3>
          {dadosGraficos.topDerrotados.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={dadosGraficos.topDerrotados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="nome" type="category" width={100} fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', fontSize: '9px' }}>Sem dados disponíveis</p>
          )}
        </div>
      </div>
    </div>
  );
}
