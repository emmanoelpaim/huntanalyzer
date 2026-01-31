import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
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

export async function carregarLogs() {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.error('Usuário não autenticado ou UID não encontrado');
    return [];
  }
  
  try {
    const userId = user.uid;
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const accountsSnap = await getDocs(accountsRef);
    
    const logs = [];
    
    for (const accountDoc of accountsSnap.docs) {
      const accountId = accountDoc.id;
      const logsRef = collection(db, 'users', userId, 'accounts', accountId, 'logs');
      const logsSnap = await getDocs(logsRef);
      
      logsSnap.forEach(logDoc => {
        logs.push({
          id: logDoc.id,
          account_id: accountId,
          ...logDoc.data()
        });
      });
    }
    
    const logsAntigosRef = collection(db, 'users', userId, 'logs');
    const logsAntigosSnap = await getDocs(logsAntigosRef);
    
    for (const logDoc of logsAntigosSnap.docs) {
      const logData = { id: logDoc.id, ...logDoc.data() };
      const player = logData.player || '';
      const accountId = await obterContaPorPersonagem(player);
      
      if (accountId) {
        logData.account_id = accountId;
        const logDataSemId = { ...logData };
        delete logDataSemId.id;
        
        await setDoc(doc(db, 'users', userId, 'accounts', accountId, 'logs', logDoc.id), logDataSemId);
        await deleteDoc(doc(db, 'users', userId, 'logs', logDoc.id));
      }
      
      if (logData.account_id) {
        logs.push(logData);
      }
    }
    
    return logs;
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
    return [];
  }
}

export async function gravarLogs(logs) {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.error('Usuário não autenticado ou UID não encontrado');
    throw new Error('Usuário não autenticado');
  }
  
  try {
    const userId = user.uid;
    const accountsRef = collection(db, 'users', userId, 'accounts');
    
    const logsPorConta = {};
    
    for (const log of logs) {
      let accountId = log.account_id;
      if (!accountId) {
        const player = log.player || '';
        accountId = await obterContaPorPersonagem(player);
        if (accountId) {
          log.account_id = accountId;
        }
      }
      
      if (accountId) {
        if (!logsPorConta[accountId]) {
          logsPorConta[accountId] = [];
        }
        logsPorConta[accountId].push(log);
      }
    }
    
    for (const [accountId, logsConta] of Object.entries(logsPorConta)) {
      const logsRef = collection(db, 'users', userId, 'accounts', accountId, 'logs');
      const logsSnap = await getDocs(logsRef);
      
      const logsExistentes = {};
      logsSnap.forEach(doc => {
        logsExistentes[doc.id] = doc;
      });
      
      const logsIdsExistentes = new Set(Object.keys(logsExistentes));
      const logsIdsNovos = new Set(logsConta.filter(log => log.id).map(log => log.id));
      
      for (const log of logsConta) {
        const logId = log.id;
        const logData = { ...log };
        delete logData.id;
        delete logData.account_id;
        
        if (logId && logsIdsExistentes.has(logId)) {
          await setDoc(doc(db, 'users', userId, 'accounts', accountId, 'logs', logId), logData);
        } else {
          if (logId) {
            await setDoc(doc(db, 'users', userId, 'accounts', accountId, 'logs', logId), logData);
          } else {
            await setDoc(doc(logsRef), logData);
          }
        }
      }
      
      for (const logId of logsIdsExistentes) {
        if (!logsIdsNovos.has(logId)) {
          await deleteDoc(doc(db, 'users', userId, 'accounts', accountId, 'logs', logId));
        }
      }
    }
  } catch (error) {
    console.error('Erro ao gravar logs:', error);
    throw error;
  }
}
