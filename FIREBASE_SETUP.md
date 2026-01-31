# Configuração do Firebase

Status da configuração do Firebase para o Loot Analyzer.

## ✅ Status dos Arquivos

- ✅ `firebase_config.json` - **CRIADO** (Service Account)
- ✅ `client_secrets.json` - **CRIADO** (OAuth2)
- ✅ `firebase_web_config.json` - **CRIADO** (Informações do projeto)

## 1. Informações do Projeto

Projeto: **lootanalyzer**
- Project ID: lootanalyzer
- Auth Domain: lootanalyzer.firebaseapp.com

## 2. Arquivo de Credenciais do Firebase (firebase_config.json) ✅

**STATUS: CONCLUÍDO**

O arquivo `firebase_config.json` já foi criado na raiz do projeto com as credenciais de Service Account.

**Importante**: Este arquivo contém uma chave privada e não deve ser compartilhado ou versionado no Git.

## 3. Configuração OAuth2 para Google Login (client_secrets.json) ✅

**STATUS: CONCLUÍDO**

O arquivo `client_secrets.json` já foi criado na raiz do projeto com as credenciais OAuth2.

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto **lootanalyzer**
3. Vá em **APIs e Serviços** > **Credenciais**
4. Clique em **Criar Credenciais** > **ID do cliente OAuth 2.0**
5. Configure:
   - Tipo de aplicativo: **Aplicativo da Web**
   - Nome: Loot Analyzer
   - URIs de redirecionamento autorizados: `http://localhost:8080/callback`
6. Após criar, copie o **Client ID** e **Client Secret**
7. Crie um arquivo `client_secrets.json` na raiz do projeto com o seguinte formato:

```json
{
  "client_id": "seu-client-id.apps.googleusercontent.com",
  "client_secret": "seu-client-secret",
  "project_id": "lootanalyzer",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "redirect_uris": ["http://localhost:8080/callback"]
}
```

**Nota**: Substitua `seu-client-id` e `seu-client-secret` pelos valores obtidos no passo 6.

## 4. Ativar Serviços no Firebase ⚠️

**STATUS: VERIFICAR**

Certifique-se de que os seguintes serviços estão ativados no Firebase Console:

1. **Firestore Database**:
   - Acesse: https://console.firebase.google.com/project/lootanalyzer/firestore
   - Se ainda não criado, clique em **Criar banco de dados**
   - Escolha o modo de produção ou teste (para desenvolvimento, pode usar modo teste)
   - Selecione uma localização (ex: us-central1)

2. **Authentication**:
   - Acesse: https://console.firebase.google.com/project/lootanalyzer/authentication
   - Se ainda não ativado, clique em **Começar**
   - Na aba **Sign-in method**, habilite **Google**
   - Configure o email de suporte do projeto (pode usar seu email)

3. **⚠️ CONFIGURAR REGRAS DE SEGURANÇA DO FIRESTORE (OBRIGATÓRIO)**:
   - Acesse: https://console.firebase.google.com/project/lootanalyzer/firestore/rules
   - Clique na aba **Regras** (Rules)
   - **Substitua** as regras existentes pelas regras abaixo
   - Clique em **Publicar** (Publish)
   
   **Regras necessárias:**
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
         }
         match /logs/{logId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
   }
   ```
   
   **Veja `web/FIRESTORE_RULES.md` para instruções detalhadas e troubleshooting.**

## 5. Estrutura do Firestore

O aplicativo criará automaticamente as seguintes coleções:

**Coleções de nível superior:**
- `items` - Itens (compartilhados entre todos os usuários)
- `users` - Usuários

**Estrutura dentro de users:**
- `users/{userId}/accounts` - Contas do usuário
  - `users/{userId}/accounts/{accountId}/logs` - Logs da conta
  - `users/{userId}/accounts/{accountId}/personagens` - Personagens da conta

**Resumo:**
- `items` - Coleção independente com todos os itens
- `users/{userId}/accounts/{accountId}/logs` - Logs organizados por conta
- `users/{userId}/accounts/{accountId}/personagens` - Personagens organizados por conta

## 6. Resumo dos Arquivos Necessários

Na raiz do projeto, você precisa ter:

1. ✅ `firebase_config.json` - **CRIADO** - Credenciais de Service Account
2. ✅ `client_secrets.json` - **CRIADO** - Credenciais OAuth2
3. ✅ `firebase_web_config.json` - **CRIADO** - Informações do projeto (opcional, para referência)

## 7. Próximos Passos

Para completar a configuração, você precisa:

1. ✅ **Arquivo `client_secrets.json` criado** - Concluído!
2. ⚠️ **Verificar/Ativar os serviços no Firebase** (Firestore e Authentication) conforme seção 4

Após verificar/ativar os serviços do Firebase, o aplicativo estará totalmente configurado e pronto para uso!
