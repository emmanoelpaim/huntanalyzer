# Instalação e Execução - Versão Web

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## Passos para Executar

### 1. Instalar Dependências

```bash
cd web
npm install
```

### 2. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### 3. Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão na pasta `dist/`

## Estrutura Criada

```
web/
├── src/
│   ├── components/
│   │   ├── Login.jsx          ✅ Login com Google
│   │   ├── Header.jsx         ✅ Cabeçalho com logout
│   │   └── MainWindow.jsx     ✅ Tela principal funcional
│   ├── services/              ✅ Todos os serviços adaptados
│   │   ├── authService.js
│   │   ├── logService.js
│   │   ├── accountService.js
│   │   ├── itemsService.js
│   │   └── permissionsService.js
│   ├── utils/                 ✅ Utilitários adaptados
│   │   ├── extractors.js
│   │   └── formatters.js
│   ├── config/
│   │   ├── firebase.js        ✅ Firebase configurado
│   │   └── cores.js
│   ├── App.jsx                ✅ App principal
│   └── main.jsx
├── package.json
├── vite.config.js
└── index.html
```

## Funcionalidades Implementadas

✅ **Autenticação**
- Login com Google via Firebase
- Verificação de sessão ativa
- Logout

✅ **Tela Principal**
- Análise de loot
- Salvamento de logs
- Lista de personagens
- Integração completa com Firebase

✅ **Serviços**
- Todos os serviços adaptados do Python
- Mesma estrutura de dados
- Compatível com dados existentes

## Funcionalidades Completas

✅ **Tela de Logs**
- Visualização agrupada por dia/derrotado
- Exclusão de dia completo
- Exclusão de derrotado específico
- Cálculo e exibição de valores totais
- Exportação para Excel (CSV)

✅ **Tela de Contas**
- CRUD completo de contas
- Gerenciamento de personagens
- Copiar senha para área de transferência
- Interface intuitiva

✅ **Tela de Itens**
- CRUD completo de itens
- Importação de CSV e JSON
- Validação de duplicatas
- Exclusão em lote
- Tabela interativa

✅ **Dashboard**
- Gráfico de linha: Valor Total por Dia
- Gráfico de barras: Valor Total por Personagem
- Gráfico horizontal: Top 10 Itens Mais Coletados
- Gráfico horizontal: Top 10 Derrotados Mais Frequentes
- Filtros por data (início e fim)
- Atualização dinâmica

✅ **Melhorias Visuais**
- Header melhorado com foto do usuário
- Cálculo de valores na tela de Logs
- Botão de exportação para Excel
- Interface mais polida e responsiva

## Deploy

### Firebase Hosting

1. Instalar Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Fazer login:
```bash
firebase login
```

3. Inicializar hosting:
```bash
firebase init hosting
```

4. Build e deploy:
```bash
npm run build
firebase deploy --only hosting
```

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

Arraste a pasta `dist` para o Netlify ou use:
```bash
npm run build
netlify deploy --prod --dir=dist
```
