import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { obterUsuarioAtual } from './authService';
import { carregarContas } from './accountService';

async function obterContaPorPersonagem(nomePersonagem) {
  const contas = await carregarContas();
  const nomePersonagemLimpo = nomePersonagem.split(" (")[0] || nomePersonagem;
  
  for (const conta of contas) {
    for (const personagem of conta.personagens || []) {
      if (personagem.nome?.trim() === nomePersonagemLimpo) {
        return conta.id;
      }
    }
  }
  return null;
}

export async function carregarHunts() {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.error('Usuário não autenticado ou UID não encontrado');
    return [];
  }
  
  try {
    const userId = user.uid;
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const accountsSnap = await getDocs(accountsRef);
    
    const hunts = [];
    
    for (const accountDoc of accountsSnap.docs) {
      const accountId = accountDoc.id;
      const huntsRef = collection(db, 'users', userId, 'accounts', accountId, 'logHunt');
      const huntsSnap = await getDocs(huntsRef);
      
      huntsSnap.forEach(huntDoc => {
        hunts.push({
          id: huntDoc.id,
          account_id: accountId,
          ...huntDoc.data()
        });
      });
    }
    
    return hunts;
  } catch (error) {
    console.error('Erro ao carregar hunts:', error);
    return [];
  }
}

export async function salvarHunt(huntData) {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.error('Usuário não autenticado ou UID não encontrado');
    throw new Error('Usuário não autenticado');
  }
  
  try {
    const userId = user.uid;
    let accountId = huntData.account_id;
    
    if (!accountId && huntData.player) {
      accountId = await obterContaPorPersonagem(huntData.player);
    }
    
    if (!accountId) {
      throw new Error('Conta não encontrada para o personagem');
    }
    
    const huntsRef = collection(db, 'users', userId, 'accounts', accountId, 'logHunt');
    const huntDataSemId = { ...huntData };
    delete huntDataSemId.id;
    delete huntDataSemId.account_id;
    
    if (huntData.id) {
      await setDoc(doc(db, 'users', userId, 'accounts', accountId, 'logHunt', huntData.id), huntDataSemId);
      return huntData.id;
    } else {
      const docRef = await addDoc(huntsRef, huntDataSemId);
      return docRef.id;
    }
  } catch (error) {
    console.error('Erro ao salvar hunt:', error);
    throw error;
  }
}

export async function excluirHunt(huntId, accountId) {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    const userId = user.uid;
    await deleteDoc(doc(db, 'users', userId, 'accounts', accountId, 'logHunt', huntId));
  } catch (error) {
    console.error('Erro ao excluir hunt:', error);
    throw error;
  }
}
