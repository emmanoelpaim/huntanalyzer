import { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { salvarHunt, carregarHunts, excluirHunt } from '../services/huntService';
import { obterTodosPersonagens } from '../services/accountService';
import { format } from 'date-fns';
import { CORES } from '../config/cores';
import { useToast } from './Toast';
import Select2 from './Select2';

export default function HuntWindow({ onBack }) {
  const { showToast } = useToast();
  const [imagens, setImagens] = useState([]);
  const [imagensPreview, setImagensPreview] = useState([]);
  const [personagem, setPersonagem] = useState('');
  const [data, setData] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [itensExtraidos, setItensExtraidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processandoOCR, setProcessandoOCR] = useState(false);
  const [indiceProcessando, setIndiceProcessando] = useState(null);
  const [personagens, setPersonagens] = useState([]);
  const [hunts, setHunts] = useState([]);
  const [mostrarHunts, setMostrarHunts] = useState(false);
  const [expandedHunts, setExpandedHunts] = useState(new Set());
  const fileInputRef = useRef(null);

  useEffect(() => {
    carregarPersonagens();
    carregarHuntsSalvos();

    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            processarImagemColada(blob);
          }
          break;
        }
      }
    }

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  async function carregarPersonagens() {
    try {
      const lista = await obterTodosPersonagens();
      setPersonagens(lista);
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
    }
  }

  async function carregarHuntsSalvos() {
    try {
      const huntsData = await carregarHunts();
      setHunts(huntsData);
    } catch (error) {
      console.error('Erro ao carregar hunts:', error);
    }
  }

  function processarImagemColada(blob) {
    const file = new File([blob], `imagem-colada-${Date.now()}.png`, { type: blob.type });
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagens(prev => [...prev, file]);
      setImagensPreview(prev => [...prev, reader.result]);
    };
    reader.readAsDataURL(blob);
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagens(prev => [...prev, file]);
          setImagensPreview(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function removerImagem(index) {
    setImagens(prev => prev.filter((_, i) => i !== index));
    setImagensPreview(prev => prev.filter((_, i) => i !== index));
  }

  function limparNomeItem(nomeItem) {
    if (!nomeItem) return '';
    
    let limpo = nomeItem.trim();
    
    const palavrasUI = [
      'detalhes', 'detahes', 'detaihes', 'recargas', 'novo grupo', 'grupo', 'saque',
      'item', 'contagem', 'valor', 'ganho total', 'total',
      'página', 'redefinir', 'pokémon party', 'party'
    ];
    
    limpo = limpo.replace(/^['"`.,;:!?|~\[\]{}()]+\s*/g, '');
    limpo = limpo.replace(/^["`']+/, '');
    limpo = limpo.replace(/^[|:;~"`'\[\]{}()]+/g, '');
    limpo = limpo.replace(/^\d+\s+/g, '');
    limpo = limpo.replace(/^ey\s+/gi, '');
    limpo = limpo.replace(/^i\s+/g, '');
    limpo = limpo.replace(/^['"`.,;:!?]+\s*/g, '');
    limpo = limpo.replace(/^s\s+/gi, '');
    
    for (const palavra of palavrasUI) {
      const regexInicio = new RegExp(`^${palavra}\\s+`, 'i');
      limpo = limpo.replace(regexInicio, '');
      
      const regexMeio = new RegExp(`\\s+${palavra}\\s+`, 'i');
      limpo = limpo.replace(regexMeio, ' ');
    }
    
    limpo = limpo.replace(/^\s*[|:;~"`'\[\]{}()]+\s*/g, '');
    limpo = limpo.replace(/\s*[|:;~"`'\[\]{}()]+\s*$/g, '');
    limpo = limpo.replace(/^['"`.,;:!?]+\s*/g, '');
    limpo = limpo.replace(/\s*['"`.,;:!?]+\s*$/g, '');
    
    const palavras = limpo.split(/\s+/).filter(p => {
      const pLimpo = p.replace(/[|:;~"`'\[\]{}().,;:!?]/g, '').trim();
      if (pLimpo.length === 0) return false;
      
      const pLower = pLimpo.toLowerCase();
      
      if (palavrasUI.includes(pLower)) return false;
      if (/^\d+$/.test(pLimpo)) return false;
      if (pLower === 'i' || pLower === 'ey' || (pLower === 's' && palavras.length === 1)) return false;
      
      return true;
    });
    
    limpo = palavras.join(' ').trim();
    
    limpo = limpo.replace(/^['"`.,;:!?]+\s*/g, '');
    limpo = limpo.replace(/\s*['"`.,;:!?]+\s*$/g, '');
    limpo = limpo.replace(/^["`']+/, '');
    limpo = limpo.replace(/["`']+$/, '');
    
    if (limpo.length <= 1) {
      return '';
    }
    
    return limpo;
  }

  function parsearTabelaOCR(texto) {
    const linhas = texto.split('\n').filter(linha => linha.trim());
    const itens = [];
    
    let encontrouTabela = false;
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      if (linha.toLowerCase().includes('item') || linha.toLowerCase().includes('contagem') || linha.toLowerCase().includes('valor')) {
        encontrouTabela = true;
        continue;
      }
      
      if (!encontrouTabela) continue;
      
      if (linha.toLowerCase().includes('ganho total') || (linha.toLowerCase().includes('total') && linha.toLowerCase().includes('dl'))) {
        break;
      }
      
      if (linha.toLowerCase().includes('página') || linha.toLowerCase().includes('redefinir')) {
        break;
      }
      
      const partes = linha.split(/\s+/).filter(p => p.trim());
      
      if (partes.length < 2) continue;
      
      let valor = null;
      let contagem = null;
      let nomeItem = '';
      
      for (let j = partes.length - 1; j >= 0; j--) {
        let parteNum = partes[j].replace(/[^\d.,]/g, '');
        parteNum = parteNum.replace(',', '.');
        const num = parseFloat(parteNum);
        
        if (!isNaN(num) && num > 0) {
          if (valor === null) {
            valor = num;
          } else if (contagem === null && num < 10000 && num === Math.round(num)) {
            contagem = Math.round(num);
            nomeItem = partes.slice(0, j).join(' ').trim();
            break;
          }
        }
      }
      
      if (valor !== null && contagem !== null && nomeItem) {
        nomeItem = limparNomeItem(nomeItem);
        if (nomeItem) {
          if (valor > 1000) {
            valor = valor / 10;
          }
          itens.push({
            item: nomeItem,
            contagem: contagem,
            valor: valor
          });
        }
      } else if (partes.length >= 3) {
        const ultimo = partes[partes.length - 1];
        const penultimo = partes[partes.length - 2];
        
        let valorStr = ultimo.replace(/[^\d.,]/g, '');
        valorStr = valorStr.replace(',', '.');
        const valorNum = parseFloat(valorStr);
        
        let contagemStr = penultimo.replace(/[^\d]/g, '');
        const contagemNum = parseInt(contagemStr);
        
        if (!isNaN(valorNum) && valorNum > 0 && !isNaN(contagemNum) && contagemNum > 0 && contagemNum < 10000) {
          let valorFinal = valorNum;
          if (valorFinal > 1000) {
            valorFinal = valorFinal / 10;
          }
          nomeItem = partes.slice(0, -2).join(' ').trim();
          nomeItem = limparNomeItem(nomeItem);
          if (nomeItem) {
            itens.push({
              item: nomeItem,
              contagem: contagemNum,
              valor: valorFinal
            });
          }
        }
      } else if (partes.length === 2) {
        const ultimo = partes[partes.length - 1];
        let valorStr = ultimo.replace(/[^\d.,]/g, '');
        valorStr = valorStr.replace(',', '.');
        const valorNum = parseFloat(valorStr);
        
        let contagemStr = partes[0].replace(/[^\d]/g, '');
        const contagemNum = parseInt(contagemStr);
        
        if (!isNaN(valorNum) && valorNum > 0 && !isNaN(contagemNum) && contagemNum > 0 && contagemNum < 10000) {
          let valorFinal = valorNum;
          if (valorFinal > 1000) {
            valorFinal = valorFinal / 10;
          }
          nomeItem = partes.slice(0, -1).join(' ').trim();
          nomeItem = limparNomeItem(nomeItem);
          if (nomeItem && !/^\d+$/.test(nomeItem)) {
            itens.push({
              item: nomeItem,
              contagem: contagemNum,
              valor: valorFinal
            });
          }
        }
      }
    }
    
    return itens;
  }

  function consolidarItensDuplicados(itens) {
    const itensConsolidados = {};
    
    for (const item of itens) {
      const nomeItem = item.item?.trim().toLowerCase() || '';
      
      if (!nomeItem) continue;
      
      if (itensConsolidados[nomeItem]) {
        itensConsolidados[nomeItem].contagem += item.contagem || 0;
        itensConsolidados[nomeItem].valor += item.valor || 0;
      } else {
        itensConsolidados[nomeItem] = {
          item: item.item,
          contagem: item.contagem || 0,
          valor: item.valor || 0
        };
      }
    }
    
    return Object.values(itensConsolidados);
  }

  async function processarImagem(index) {
    if (index === undefined) {
      if (imagens.length === 0) {
        showToast('Por favor, selecione ou cole pelo menos uma imagem primeiro.', 'warning');
        return;
      }
      
      setProcessandoOCR(true);
      setItensExtraidos([]);
      
      const todosItens = [];
      
      for (let i = 0; i < imagens.length; i++) {
        setIndiceProcessando(i);
        try {
          const worker = await createWorker('eng', 1, {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`Progresso imagem ${i + 1}/${imagens.length}: ${Math.round(m.progress * 100)}%`);
              }
            }
          });

          const { data: { text } } = await worker.recognize(imagens[i]);
          await worker.terminate();

          console.log(`Texto extraído da imagem ${i + 1}:`, text);
          
          const itens = parsearTabelaOCR(text);
          console.log(`Itens extraídos da imagem ${i + 1}:`, itens);
          todosItens.push(...itens);
        } catch (error) {
          console.error(`Erro ao processar imagem ${i + 1}:`, error);
        }
      }
      
      setIndiceProcessando(null);
      setProcessandoOCR(false);
      
      if (todosItens.length === 0) {
        showToast('Nenhum item encontrado nas imagens. Verifique se as imagens contêm tabelas com colunas: Item, Contagem e Valor.', 'warning');
      } else {
        const itensConsolidados = consolidarItensDuplicados(todosItens);
        setItensExtraidos(itensConsolidados);
        
        if (itensConsolidados.length < todosItens.length) {
          const duplicadosRemovidos = todosItens.length - itensConsolidados.length;
          showToast(`${duplicadosRemovidos} item(ns) duplicado(s) consolidado(s).`, 'info');
        }
      }
    } else {
      if (index < 0 || index >= imagens.length) return;
      
      setProcessandoOCR(true);
      setIndiceProcessando(index);
      
      try {
        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`Progresso: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        const { data: { text } } = await worker.recognize(imagens[index]);
        await worker.terminate();

        console.log('Texto extraído:', text);
        
        const itens = parsearTabelaOCR(text);
        
        if (itens.length === 0) {
          showToast('Nenhum item encontrado nesta imagem.', 'warning');
        } else {
          setItensExtraidos(prev => {
            const itensAtuais = [...prev, ...itens];
            const itensConsolidados = consolidarItensDuplicados(itensAtuais);
            
            if (itensConsolidados.length < itensAtuais.length) {
              const duplicadosRemovidos = itensAtuais.length - itensConsolidados.length;
              setTimeout(() => {
                showToast(`${duplicadosRemovidos} item(ns) duplicado(s) consolidado(s).`, 'info');
              }, 100);
            }
            
            return itensConsolidados;
          });
        }
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        showToast('Erro ao processar a imagem. Tente novamente.', 'error');
      } finally {
        setProcessandoOCR(false);
        setIndiceProcessando(null);
      }
    }
  }

  async function salvarHuntData() {
    const nomePersonagemCompleto = personagem.trim();
    if (!nomePersonagemCompleto) {
      showToast('O campo "Nome do personagem" é obrigatório.', 'warning');
      return;
    }

    if (itensExtraidos.length === 0) {
      showToast('Nenhum item para salvar. Processe uma imagem primeiro.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const nomePersonagem = nomePersonagemCompleto.split(' (')[0];
      const horaAtual = format(new Date(), 'HH:mm:ss');
      const datetimeStr = `${data} ${horaAtual}`;

      const huntData = {
        datetime: datetimeStr,
        player: nomePersonagem,
        items: itensExtraidos,
        totalValor: itensExtraidos.reduce((sum, item) => sum + (item.valor || 0), 0),
        totalItens: itensExtraidos.reduce((sum, item) => sum + (item.contagem || 0), 0)
      };

      await salvarHunt(huntData);
      showToast('Hunt salvo com sucesso!', 'success');
      
      setItensExtraidos([]);
      setImagens([]);
      setImagensPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await carregarHuntsSalvos();
    } catch (error) {
      console.error('Erro ao salvar hunt:', error);
      showToast('Erro ao salvar hunt.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function excluirHuntData(huntId, accountId) {
    if (!window.confirm('Deseja realmente excluir este hunt?')) {
      return;
    }

    try {
      await excluirHunt(huntId, accountId);
      await carregarHuntsSalvos();
      showToast('Hunt excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir hunt:', error);
      showToast('Erro ao excluir hunt.', 'error');
    }
  }

  function toggleHunt(huntId) {
    setExpandedHunts(prev => {
      const novo = new Set(prev);
      if (novo.has(huntId)) {
        novo.delete(huntId);
      } else {
        novo.add(huntId);
      }
      return novo;
    });
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
        <button
          onClick={() => setMostrarHunts(!mostrarHunts)}
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
          {mostrarHunts ? 'Ocultar Hunts' : 'Ver Hunts Salvos'}
        </button>
      </div>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
        Analisador de Hunt
      </h2>

      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '10px', fontWeight: 'bold' }}>Nome do personagem: *</label>
        <div style={{ width: '300px' }}>
          <Select2
            value={personagem}
            onChange={setPersonagem}
            options={personagens}
            placeholder="Selecione ou digite o nome do personagem"
          />
        </div>
        
        <label style={{ fontSize: '10px', fontWeight: 'bold', marginLeft: '16px' }}>Data:</label>
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

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
          Selecione a imagem do hunt ou cole uma imagem (Ctrl+V):
        </label>
        <div style={{ 
          fontSize: '9px', 
          color: '#666', 
          marginBottom: '8px',
          fontStyle: 'italic'
        }}>
          💡 Dica: Você pode copiar uma imagem (Ctrl+C) e colar diretamente aqui (Ctrl+V)
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{
            fontSize: '10px',
            marginBottom: '8px'
          }}
        />
        {imagensPreview.length > 0 && (
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
              Imagens adicionadas ({imagensPreview.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {imagensPreview.map((preview, index) => (
                <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '150px', 
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }} 
                  />
                  <button
                    onClick={() => removerImagem(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: '#CC0000',
                      color: CORES.branco,
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remover imagem"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={() => processarImagem()}
            disabled={imagens.length === 0 || processandoOCR}
            style={{
              backgroundColor: (imagens.length === 0 || processandoOCR) ? '#ccc' : '#17a2b8',
              color: CORES.branco,
              border: 'none',
              padding: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: (imagens.length === 0 || processandoOCR) ? 'not-allowed' : 'pointer',
              opacity: processandoOCR ? 0.7 : 1
            }}
          >
            {processandoOCR 
              ? (indiceProcessando !== null 
                  ? `Processando ${indiceProcessando + 1}/${imagens.length}...` 
                  : 'Processando OCR...') 
              : `Processar Todas as Imagens (${imagens.length})`}
          </button>
          {imagens.length > 0 && (
            <button
              onClick={() => {
                setImagens([]);
                setImagensPreview([]);
                setItensExtraidos([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              style={{
                backgroundColor: '#6c757d',
                color: CORES.branco,
                border: 'none',
                padding: '10px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Limpar Todas as Imagens
            </button>
          )}
        </div>
      </div>

      {mostrarHunts && (
        <div style={{ marginBottom: '20px', backgroundColor: CORES.branco, padding: '12px', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Hunts Salvos:</h3>
          {hunts.length === 0 ? (
            <p style={{ fontSize: '10px', color: '#666' }}>Nenhum hunt salvo.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {hunts.map((hunt) => {
                const isExpanded = expandedHunts.has(hunt.id);
                return (
                  <div key={hunt.id} style={{ marginBottom: '8px' }}>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => toggleHunt(hunt.id)}
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
                          <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                            {hunt.datetime} - {hunt.player}
                          </div>
                          <div style={{ fontSize: '9px', color: '#666' }}>
                            {hunt.totalItens} itens | Total: {hunt.totalValor?.toFixed(2)} dl
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => excluirHuntData(hunt.id, hunt.account_id)}
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
                    {isExpanded && hunt.items && hunt.items.length > 0 && (
                      <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                        <div style={{
                          backgroundColor: '#f9f9f9',
                          borderRadius: '4px',
                          padding: '8px'
                        }}>
                          <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#e9e9e9' }}>
                                <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ddd' }}>Item</th>
                                <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>Contagem</th>
                                <th style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>Valor (dl)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {hunt.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: '4px', border: '1px solid #ddd' }}>{item.item}</td>
                                  <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>{item.contagem}</td>
                                  <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>{item.valor?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ backgroundColor: '#e9e9e9', fontWeight: 'bold' }}>
                                <td style={{ padding: '4px', border: '1px solid #ddd' }}>Total</td>
                                <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>
                                  {hunt.items.reduce((sum, item) => sum + (item.contagem || 0), 0)}
                                </td>
                                <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>
                                  {hunt.items.reduce((sum, item) => sum + (item.valor || 0), 0).toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {itensExtraidos.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
            Itens Extraídos ({itensExtraidos.length}):
          </h3>
          <div style={{
            backgroundColor: CORES.branco,
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ddd' }}>Item</th>
                  <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>Contagem</th>
                  <th style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>Valor (dl)</th>
                  <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd', width: '60px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensExtraidos.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => {
                          const novosItens = [...itensExtraidos];
                          novosItens[idx].item = e.target.value;
                          setItensExtraidos(novosItens);
                        }}
                        style={{
                          width: '100%',
                          padding: '2px',
                          fontSize: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '2px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <input
                        type="number"
                        value={item.contagem}
                        onChange={(e) => {
                          const novosItens = [...itensExtraidos];
                          novosItens[idx].contagem = parseInt(e.target.value) || 0;
                          setItensExtraidos(novosItens);
                        }}
                        min="0"
                        style={{
                          width: '60px',
                          padding: '2px',
                          fontSize: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '2px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                    <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={item.valor}
                        onChange={(e) => {
                          const novosItens = [...itensExtraidos];
                          novosItens[idx].valor = parseFloat(e.target.value) || 0;
                          setItensExtraidos(novosItens);
                        }}
                        min="0"
                        style={{
                          width: '80px',
                          padding: '2px',
                          fontSize: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '2px',
                          textAlign: 'right'
                        }}
                      />
                    </td>
                    <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => {
                          const novosItens = itensExtraidos.filter((_, i) => i !== idx);
                          setItensExtraidos(novosItens);
                        }}
                        style={{
                          backgroundColor: '#CC0000',
                          color: CORES.branco,
                          border: 'none',
                          padding: '2px 6px',
                          fontSize: '9px',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Remover item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  <td style={{ padding: '4px', border: '1px solid #ddd' }}>Total</td>
                  <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ddd' }}>
                    {itensExtraidos.reduce((sum, item) => sum + (item.contagem || 0), 0)}
                  </td>
                  <td style={{ padding: '4px', textAlign: 'right', border: '1px solid #ddd' }}>
                    {itensExtraidos.reduce((sum, item) => sum + (item.valor || 0), 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '4px', border: '1px solid #ddd' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setItensExtraidos([...itensExtraidos, { item: '', contagem: 1, valor: 0 }]);
              }}
              style={{
                backgroundColor: '#17a2b8',
                color: CORES.branco,
                border: 'none',
                padding: '6px 12px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Adicionar Item
            </button>
          </div>
          <button
            onClick={salvarHuntData}
            disabled={loading || !personagem.trim()}
            style={{
              backgroundColor: loading || !personagem.trim() ? '#ccc' : '#28a745',
              color: CORES.branco,
              border: 'none',
              padding: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: loading || !personagem.trim() ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Hunt'}
          </button>
        </div>
      )}
    </div>
  );
}
