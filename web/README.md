# Loot Analyzer - Versão Web

Versão web do Loot Analyzer construída com React + Firebase Web SDK.

## Instalação

```bash
cd web
npm install
```

## Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## Build para Produção

```bash
npm run build
```

Os arquivos estarão na pasta `dist/`

## Deploy no Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Estrutura do Projeto

```
web/
├── src/
│   ├── components/        # Componentes React
│   │   ├── Login.jsx
│   │   ├── Header.jsx
│   │   └── MainWindow.jsx
│   ├── services/          # Serviços adaptados do Python
│   │   ├── authService.js
│   │   ├── logService.js
│   │   ├── accountService.js
│   │   ├── itemsService.js
│   │   └── permissionsService.js
│   ├── utils/             # Utilitários adaptados
│   │   ├── extractors.js
│   │   └── formatters.js
│   ├── config/            # Configurações
│   │   ├── firebase.js
│   │   └── cores.js
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Entry point
├── package.json
└── vite.config.js
```

## Funcionalidades Implementadas

✅ **Autenticação**
- Login com Google via Firebase
- Verificação de sessão ativa
- Logout

✅ **Tela Principal**
- Análise de loot
- Salvamento de logs
- Lista de personagens dinâmica
- Integração completa com Firebase

✅ **Tela de Logs**
- Visualização de logs agrupados por dia
- Exclusão de dia completo
- Exclusão de derrotado específico
- Cálculo de valores

✅ **Tela de Contas**
- CRUD completo de contas
- Gerenciamento de personagens
- Interface intuitiva

✅ **Tela de Itens**
- CRUD completo de itens
- Importação de CSV e JSON
- Validação de duplicatas
- Exclusão em lote

✅ **Dashboard**
- Gráfico de valor total por dia
- Gráfico de valor por personagem
- Top 10 itens mais coletados
- Top 10 derrotados mais frequentes
- Filtros por data

✅ **Serviços**
- Todos os serviços adaptados do Python
- Mesma estrutura de dados
- Compatível com dados existentes

## Melhorias Futuras

- [ ] Melhorar estilização com CSS modules ou styled-components
- [ ] Adicionar mais loading states
- [ ] Implementar tratamento de erros mais robusto
- [ ] Adicionar exportação para Excel
- [ ] Implementar cache local
- [ ] Adicionar notificações toast
