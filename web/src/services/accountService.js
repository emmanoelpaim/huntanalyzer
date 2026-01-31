import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { obterUsuarioAtual } from './authService';
import { obterDadosUsuario } from './userService';

export async function carregarContas() {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.error('Usuário não autenticado ou UID não encontrado');
    return [];
  }
  
  try {
    const userId = user.uid;
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const accountsSnap = await getDocs(accountsRef);
    
    const contas = [];
    accountsSnap.forEach(doc => {
      contas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Contas carregadas para usuário ${userId}:`, contas.length);
    return contas;
  } catch (error) {
    console.error('Erro ao carregar contas:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
    return [];
  }
}

export async function gravarContas(contas) {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.error('Usuário não autenticado ou UID não encontrado');
    throw new Error('Usuário não autenticado');
  }
  
  try {
    const userId = user.uid;
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('Documento do usuário não existe, criando...');
      try {
        await obterDadosUsuario();
      } catch (initError) {
        console.error('Erro ao criar documento do usuário:', initError);
        const dadosIniciais = {
          email: user.email || '',
          name: user.displayName || '',
          picture: user.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userRef, dadosIniciais);
      }
    }
    
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const accountsSnap = await getDocs(accountsRef);
    
    const contasExistentes = {};
    accountsSnap.forEach(doc => {
      contasExistentes[doc.id] = doc;
    });
    
    const contasIdsExistentes = new Set(Object.keys(contasExistentes));
    const contasIdsNovos = new Set(contas.filter(conta => conta.id).map(conta => conta.id));
    
    for (const conta of contas) {
      const contaId = conta.id;
      const contaData = { ...conta };
      delete contaData.id;
      
      if (contaId && contasIdsExistentes.has(contaId)) {
        await setDoc(doc(accountsRef, contaId), contaData);
      } else {
        if (contaId) {
          await setDoc(doc(accountsRef, contaId), contaData);
        } else {
          await setDoc(doc(accountsRef), contaData);
        }
      }
    }
    
    for (const contaId of contasIdsExistentes) {
      if (!contasIdsNovos.has(contaId)) {
        await deleteDoc(doc(accountsRef, contaId));
      }
    }
    
    console.log(`Contas salvas com sucesso para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao gravar contas:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
    throw error;
  }
}

export async function obterTodosPersonagens() {
  const contas = await carregarContas();
  const personagens = [];
  
  for (const conta of contas) {
    const nomeConta = conta.nome || '';
    for (const personagem of conta.personagens || []) {
      const nomePersonagem = personagem.nome || '';
      if (nomePersonagem) {
        personagens.push(`${nomePersonagem} (${nomeConta})`);
      }
    }
  }
  
  return personagens.sort();
}
