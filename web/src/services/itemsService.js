import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { obterUsuarioAtual } from './authService';

export async function carregarItens() {
  try {
    const user = obterUsuarioAtual();
    if (!user) {
      console.warn('Usuário não autenticado ao carregar itens');
      return [];
    }

    const itemsRef = collection(db, 'items');
    const itemsSnap = await getDocs(itemsRef);
    
    console.log('Carregando itens da coleção items...');
    console.log('Usuário autenticado:', user.uid);
    console.log('Documentos encontrados:', itemsSnap.size);
    
    const itens = [];
    itemsSnap.forEach(doc => {
      const itemData = doc.data();
      const docId = doc.id;
      
      let itemId = itemData.id;
      
      if (!itemId) {
        const itemIdNumerico = parseInt(docId);
        if (!isNaN(itemIdNumerico)) {
          itemId = itemIdNumerico;
        } else {
          console.warn('Documento sem ID numérico válido:', docId, itemData);
          return;
        }
      }
      
      itens.push({
        id: itemId,
        derrotado: itemData.derrotado || '',
        nome_item: itemData.nome_item || '',
        valor: itemData.valor || 0
      });
    });
    
    console.log('Itens carregados com sucesso:', itens.length);
    if (itens.length > 0) {
      console.log('Primeiro item exemplo:', itens[0]);
    }
    return itens;
  } catch (error) {
    console.error('Erro ao carregar itens:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.code === 'permission-denied') {
      console.error('ERRO: Permissão negada. Verifique as regras do Firestore.');
    }
    
    return [];
  }
}

export async function gravarItens(itens) {
  try {
    const itemsRef = collection(db, 'items');
    const itemsSnap = await getDocs(itemsRef);
    
    const itemsExistentes = {};
    itemsSnap.forEach(doc => {
      const docData = doc.data();
      const itemIdNumerico = docData.id;
      if (itemIdNumerico) {
        itemsExistentes[itemIdNumerico] = doc.id;
      } else {
        const itemIdNumerico = parseInt(doc.id);
        if (!isNaN(itemIdNumerico)) {
          itemsExistentes[itemIdNumerico] = doc.id;
        }
      }
    });
    
    const itemsIdsNumericosExistentes = new Set(Object.keys(itemsExistentes).map(Number));
    const itemsIdsNumericosNovos = new Set(itens.filter(item => item.id).map(item => item.id));
    
    const maxIdExistente = itemsIdsNumericosExistentes.size > 0 
      ? Math.max(...itemsIdsNumericosExistentes) 
      : 0;
    const maxIdNovo = itens.length > 0 
      ? Math.max(...itens.map(i => i.id || 0)) 
      : 0;
    let proximoId = Math.max(maxIdExistente, maxIdNovo) + 1;
    
    for (const item of itens) {
      let itemIdNumerico = item.id;
      if (!itemIdNumerico) {
        itemIdNumerico = proximoId;
        item.id = itemIdNumerico;
        proximoId++;
      }
      
      const itemData = {
        derrotado: item.derrotado || '',
        nome_item: item.nome_item || '',
        valor: item.valor || 0,
        id: itemIdNumerico
      };
      
      const docIdFirestore = String(itemIdNumerico);
      await setDoc(doc(itemsRef, docIdFirestore), itemData);
    }
    
    for (const itemIdNumerico of itemsIdsNumericosExistentes) {
      if (!itemsIdsNumericosNovos.has(itemIdNumerico)) {
        const docIdFirestore = String(itemIdNumerico);
        await deleteDoc(doc(itemsRef, docIdFirestore));
      }
    }
  } catch (error) {
    console.error('Erro ao gravar itens:', error);
    throw error;
  }
}

export function itemExiste(itens, derrotado, nomeItem) {
  return itens.some(item => 
    item.derrotado?.toLowerCase() === derrotado.toLowerCase() && 
    item.nome_item?.toLowerCase() === nomeItem.toLowerCase()
  );
}

export async function obterDerrotadosUnicos() {
  const itens = await carregarItens();
  const derrotados = new Set();
  
  for (const item of itens) {
    const derrotado = item.derrotado?.trim();
    if (derrotado) {
      derrotados.add(derrotado);
    }
  }
  
  return Array.from(derrotados).sort();
}
