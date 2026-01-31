import { obterDadosUsuario } from './userService';
import { obterUsuarioAtual } from './authService';

export async function inicializarUsuario() {
  const user = obterUsuarioAtual();
  if (!user || !user.uid) {
    console.log('Usuário não autenticado, pulando inicialização');
    return;
  }

  try {
    console.log('Inicializando documento do usuário:', user.uid);
    await obterDadosUsuario();
    console.log('Documento do usuário inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar usuário:', error);
  }
}
