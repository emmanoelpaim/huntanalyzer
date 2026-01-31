import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { obterUsuarioAtual } from './authService';

export async function obterDadosUsuario() {
  const user = obterUsuarioAtual();
  if (!user) {
    console.error('Usuário não autenticado');
    return null;
  }

  try {
    const userId = user.uid;
    if (!userId) {
      console.error('ID do usuário não encontrado');
      return null;
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return { 
        id: userSnap.id, 
        uid: userId,
        email: data.email || user.email || '',
        name: data.name || user.displayName || '',
        picture: data.picture || user.photoURL || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    } else {
      const dadosIniciais = {
        email: user.email || '',
        name: user.displayName || '',
        picture: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      try {
        await setDoc(userRef, dadosIniciais);
        console.log('Documento do usuário criado com sucesso:', userId);
        return { 
          id: userId, 
          uid: userId,
          ...dadosIniciais 
        };
      } catch (createError) {
        console.error('Erro ao criar documento do usuário:', createError);
        console.error('Código do erro:', createError.code);
        console.error('Mensagem do erro:', createError.message);
        return { 
          id: userId, 
          uid: userId,
          ...dadosIniciais 
        };
      }
    }
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    console.error('Detalhes do erro:', error.message, error.code);
    throw error;
  }
}

export async function atualizarDadosUsuario(dados) {
  const user = obterUsuarioAtual();
  if (!user) throw new Error('Usuário não autenticado');

  try {
    const userRef = doc(db, 'users', user.uid);
    const dadosAtualizados = {
      ...dados,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, dadosAtualizados);
    return dadosAtualizados;
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    throw error;
  }
}
