import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { obterUsuarioAtual } from './authService';

export async function verificarPermissaoItens() {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.log('Usuário não autenticado para verificar permissão');
    return false;
  }
  
  try {
    const appRef = collection(db, 'app');
    const appQuery = query(appRef, limit(10));
    const appSnap = await getDocs(appQuery);
    
    const userIdStr = String(user.uid);
    console.log('Verificando permissão para UID:', userIdStr);
    
    for (const doc of appSnap.docs) {
      const docData = doc.data();
      const userItem = docData.userItem || [];
      
      console.log('Documento app encontrado:', doc.id, 'userItem:', userItem);
      
      if (Array.isArray(userItem)) {
        for (const item of userItem) {
          const itemStr = String(item);
          console.log('Comparando:', itemStr, '===', userIdStr, '?', itemStr === userIdStr);
          if (itemStr === userIdStr) {
            console.log('Permissão encontrada!');
            return true;
          }
        }
      } else if (typeof userItem === 'string') {
        const itemStr = String(userItem);
        console.log('Comparando string:', itemStr, '===', userIdStr, '?', itemStr === userIdStr);
        if (itemStr === userIdStr) {
          console.log('Permissão encontrada!');
          return true;
        }
      }
    }
    
    console.log('Permissão não encontrada para UID:', userIdStr);
    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem do erro:', error.message);
    return false;
  }
}
