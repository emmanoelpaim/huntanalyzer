import { useState, useEffect } from 'react';
import { carregarItens, gravarItens, itemExiste } from '../services/itemsService';
import { CORES } from '../config/cores';

export default function ItemsWindow({ onBack }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    derrotado: '',
    nome_item: '',
    valor: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      console.log('ItemsWindow: Iniciando carregamento de itens...');
      const itensData = await carregarItens();
      console.log('ItemsWindow: Itens recebidos:', itensData.length);
      const itensOrdenados = itensData.sort((a, b) => (a.id || 0) - (b.id || 0));
      setItens(itensOrdenados);
      console.log('ItemsWindow: Itens ordenados e definidos no estado');
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      console.error('Detalhes do erro:', error.code, error.message);
      alert('Erro ao carregar itens. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  }

  function selecionarItem(item) {
    setItemSelecionado(item);
    setFormData({
      derrotado: item.derrotado || '',
      nome_item: item.nome_item || '',
      valor: String(item.valor || 0)
    });
  }

  function limparForm() {
    setItemSelecionado(null);
    setFormData({ derrotado: '', nome_item: '', valor: '' });
  }

  async function salvarItem() {
    if (!formData.derrotado.trim() || !formData.nome_item.trim() || !formData.valor.trim()) {
      alert('Todos os campos são obrigatórios.');
      return;
    }

    const valor = parseFloat(formData.valor.replace(',', '.'));
    if (isNaN(valor)) {
      alert('Valor inválido. Use números com ponto ou vírgula como separador decimal.');
      return;
    }

    try {
      const itensAtualizados = [...itens];
      
      if (itemSelecionado) {
        const idx = itensAtualizados.findIndex(i => i.id === itemSelecionado.id);
        if (idx >= 0) {
          if ((itensAtualizados[idx].derrotado?.toLowerCase() !== formData.derrotado.toLowerCase() ||
               itensAtualizados[idx].nome_item?.toLowerCase() !== formData.nome_item.toLowerCase()) &&
              itemExiste(itensAtualizados, formData.derrotado, formData.nome_item)) {
            alert('Já existe um item com este nome para este derrotado.');
            return;
          }
          
          itensAtualizados[idx] = {
            ...itensAtualizados[idx],
            derrotado: formData.derrotado,
            nome_item: formData.nome_item,
            valor: valor
          };
        }
      } else {
        if (itemExiste(itensAtualizados, formData.derrotado, formData.nome_item)) {
          alert('Já existe um item com este nome para este derrotado.');
          return;
        }

        const novoId = Math.max(...itensAtualizados.map(i => i.id || 0), 0) + 1;
        itensAtualizados.push({
          id: novoId,
          derrotado: formData.derrotado,
          nome_item: formData.nome_item,
          valor: valor
        });
      }

      await gravarItens(itensAtualizados);
      await carregarDados();
      limparForm();
      alert('Item salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item.');
    }
  }

  async function excluirItem() {
    if (!itemSelecionado) {
      alert('Selecione um item para excluir.');
      return;
    }

    if (!window.confirm('Deseja realmente excluir este item?')) {
      return;
    }

    try {
      const itensAtualizados = itens.filter(i => i.id !== itemSelecionado.id);
      await gravarItens(itensAtualizados);
      await carregarDados();
      limparForm();
      alert('Item excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item.');
    }
  }

  async function excluirTodosItens() {
    if (itens.length === 0) {
      alert('Não há itens para excluir.');
      return;
    }

    if (!window.confirm(`Deseja realmente excluir todos os ${itens.length} itens?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await gravarItens([]);
      await carregarDados();
      limparForm();
      alert('Todos os itens foram excluídos com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir itens:', error);
      alert('Erro ao excluir itens.');
    }
  }

  async function importarArquivo(event) {
    const file = event.target.files[0];
    if (!file) return;

    const texto = await file.text();
    let dados = [];

    try {
      if (file.name.endsWith('.json')) {
        dados = JSON.parse(texto);
        if (!Array.isArray(dados)) {
          alert('O arquivo JSON deve conter um array de objetos.');
          return;
        }
      } else if (file.name.endsWith('.csv')) {
        const linhas = texto.split('\n');
        for (const linha of linhas) {
          const partes = linha.split(',').map(p => p.trim());
          if (partes.length >= 3) {
            dados.push({
              derrotado: partes[0],
              nome_item: partes[1],
              valor: parseFloat(partes[2].replace(',', '.')) || 0
            });
          }
        }
      } else {
        alert('Formato de arquivo não suportado. Use CSV ou JSON.');
        return;
      }

      let itensImportados = 0;
      let itensDuplicados = 0;
      const itensAtualizados = [...itens];

      for (const itemData of dados) {
        const derrotado = (itemData.derrotado || '').trim();
        const nomeItem = (itemData.nome_item || '').trim();
        const valor = parseFloat(String(itemData.valor || 0).replace(',', '.')) || 0;

        if (!derrotado || !nomeItem) continue;

        if (itemExiste(itensAtualizados, derrotado, nomeItem)) {
          itensDuplicados++;
          continue;
        }

        const novoId = Math.max(...itensAtualizados.map(i => i.id || 0), 0) + 1;
        itensAtualizados.push({
          id: novoId,
          derrotado,
          nome_item: nomeItem,
          valor
        });
        itensImportados++;
      }

      await gravarItens(itensAtualizados);
      await carregarDados();

      let mensagem = `Importação concluída!\n\nItens importados: ${itensImportados}`;
      if (itensDuplicados > 0) {
        mensagem += `\nItens duplicados ignorados: ${itensDuplicados}`;
      }
      alert(mensagem);
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      alert('Erro ao importar arquivo.');
    }

    event.target.value = '';
  }

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center' }}>
        <p>Carregando itens...</p>
      </div>
    );
  }

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
      </div>

      <div style={{
        backgroundColor: CORES.branco,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '12px',
        border: '1px solid #ccc'
      }}>
        <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
          Importar Itens (CSV ou JSON)
        </h3>
        <input
          type="file"
          accept=".csv,.json"
          onChange={importarArquivo}
          style={{ fontSize: '10px' }}
        />
      </div>

      <div style={{
        backgroundColor: CORES.branco,
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '12px',
        border: '1px solid #ccc'
      }}>
        <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
          Adicionar Item Manualmente
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
              Derrotado:
            </label>
            <input
              type="text"
              value={formData.derrotado}
              onChange={(e) => setFormData({ ...formData, derrotado: e.target.value })}
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
              Nome do Item:
            </label>
            <input
              type="text"
              value={formData.nome_item}
              onChange={(e) => setFormData({ ...formData, nome_item: e.target.value })}
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
              Valor:
            </label>
            <input
              type="text"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={salvarItem}
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
            {itemSelecionado ? 'Atualizar' : 'Adicionar'}
          </button>
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
            onClick={excluirItem}
            disabled={!itemSelecionado}
            style={{
              backgroundColor: itemSelecionado ? '#CC0000' : '#ccc',
              color: CORES.branco,
              border: 'none',
              padding: '8px',
              fontSize: '10px',
              borderRadius: '4px',
              cursor: itemSelecionado ? 'pointer' : 'not-allowed'
            }}
          >
            Excluir
          </button>
          <button
            onClick={excluirTodosItens}
            style={{
              backgroundColor: '#CC0000',
              color: CORES.branco,
              border: 'none',
              padding: '8px',
              fontSize: '10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Excluir Todos
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: CORES.branco,
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc'
      }}>
        <h3 style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
          Itens Importados ({itens.length})
        </h3>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ddd' }}>Derrotado</th>
                <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ddd' }}>Nome do Item</th>
                <th style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                    Nenhum item cadastrado.
                  </td>
                </tr>
              ) : (
                itens.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => selecionarItem(item)}
                    style={{
                      backgroundColor: itemSelecionado?.id === item.id ? '#e3f2fd' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>{item.id}</td>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>{item.derrotado}</td>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>{item.nome_item}</td>
                    <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>
                      {item.valor?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
