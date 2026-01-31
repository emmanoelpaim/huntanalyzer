# Regras de Segurança do Firestore

## Problema: Erro "permission-denied"

Se você está recebendo o erro `permission-denied` ao tentar salvar contas, logs ou outros dados, significa que as regras de segurança do Firestore precisam ser configuradas.

## Como Configurar as Regras

### 1. Acesse o Firebase Console

1. Vá para https://console.firebase.google.com/
2. Selecione o projeto `lootanalyzer`
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras** (Rules)

### 2. Cole as Regras Abaixo

Substitua as regras existentes por estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /items/{itemId} {
      allow read, write: if request.auth != null;
    }
    match /app/{appId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /accounts/{accountId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /logs/{logId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        match /logHunt/{huntId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
      match /logs/{logId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 3. Publique as Regras

1. Clique no botão **Publicar** (Publish)
2. Aguarde a confirmação de que as regras foram publicadas

## Explicação das Regras

### `items/{itemId}`
- **Leitura**: Qualquer usuário autenticado pode ler
- **Escrita**: Qualquer usuário autenticado pode escrever

### `users/{userId}`
- **Leitura/Escrita**: Apenas o próprio usuário pode acessar seus dados
- Verifica se `request.auth.uid == userId`

### `users/{userId}/accounts/{accountId}`
- **Leitura/Escrita**: Apenas o dono da conta pode acessar
- Herda a verificação do documento pai

### `users/{userId}/accounts/{accountId}/logs/{logId}`
- **Leitura/Escrita**: Apenas o dono pode acessar seus logs
- Herda a verificação do documento pai

### `users/{userId}/accounts/{accountId}/logHunt/{huntId}`
- **Leitura/Escrita**: Apenas o dono pode acessar seus hunts
- Herda a verificação do documento pai

## Testando as Regras

Após publicar as regras:

1. Faça logout e login novamente na aplicação
2. Tente salvar uma conta
3. Verifique o console do navegador (F12) para ver se ainda há erros

## Regras Mais Restritivas (Opcional)

Se quiser restringir mais, você pode:

```javascript
// Permitir escrita apenas para usuários específicos
match /items/{itemId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    request.auth.uid in ['112809219381568527842', 'outro-uid-aqui'];
}
```

## Troubleshooting

### Erro persiste após configurar as regras?

1. **Verifique se está autenticado**: O erro pode ocorrer se não houver usuário logado
2. **Limpe o cache**: Faça logout e login novamente
3. **Verifique o UID**: Confirme que o `request.auth.uid` corresponde ao `userId` no Firestore
4. **Aguarde alguns segundos**: As regras podem levar alguns segundos para propagar

### Como verificar o UID do usuário?

1. Abra o console do navegador (F12)
2. Na aba Console, digite:
```javascript
firebase.auth().currentUser.uid
```
3. Compare com o `userId` no Firestore

## Regras Temporárias para Desenvolvimento (NÃO USE EM PRODUÇÃO)

⚠️ **ATENÇÃO**: Estas regras permitem acesso total. Use APENAS para desenvolvimento local.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**NUNCA use essas regras em produção!** Elas permitem que qualquer usuário autenticado acesse todos os dados de todos os usuários.
