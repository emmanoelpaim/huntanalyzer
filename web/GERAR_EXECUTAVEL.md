# Como Gerar Executável da Aplicação Web

Este guia explica como gerar um executável (.exe) da aplicação web usando Electron.

## Pré-requisitos

- Node.js instalado (versão 16 ou superior)
- npm ou yarn instalado

## Passo a Passo

### 1. Instalar Dependências do Electron

```bash
cd web
npm install
```

Isso instalará todas as dependências, incluindo Electron e Electron Builder.

### 2. Gerar Build da Aplicação Web

Primeiro, é necessário gerar o build de produção da aplicação React:

```bash
npm run build
```

Isso criará uma pasta `dist` com os arquivos otimizados da aplicação.

### 3. Gerar Executável

#### Para Windows (.exe):

```bash
npm run build:win
```

Isso gerará um instalador `.exe` na pasta `release`.

#### Para macOS (.dmg):

```bash
npm run build:mac
```

#### Para Linux (AppImage):

```bash
npm run build:linux
```

### 4. Testar o Executável Localmente

Antes de gerar o executável final, você pode testar localmente:

```bash
npm run build
npm run electron
```

## Estrutura de Arquivos

Após gerar o executável, você encontrará:

- `release/` - Pasta contendo os executáveis gerados
- `dist/` - Build da aplicação web (gerado pelo Vite)

## Distribuição

Para distribuir a aplicação:

1. **Windows**: Compartilhe o arquivo `.exe` da pasta `release`
2. **macOS**: Compartilhe o arquivo `.dmg` da pasta `release`
3. **Linux**: Compartilhe o arquivo `.AppImage` da pasta `release`

## Notas Importantes

- O executável ainda precisará de conexão com a internet para funcionar, pois usa Firebase
- O tamanho do executável será aproximadamente 100-150 MB (inclui Chromium)
- Certifique-se de que o Firebase está configurado corretamente antes de distribuir

## Solução de Problemas

### Erro ao gerar executável

Se houver erros, verifique:

1. Se todas as dependências foram instaladas (`npm install`)
2. Se o build foi gerado corretamente (`npm run build`)
3. Se há espaço em disco suficiente (o processo requer ~500MB temporários)

### Executável não abre

Verifique se:

1. O arquivo não está corrompido
2. As permissões estão corretas
3. O antivírus não está bloqueando
