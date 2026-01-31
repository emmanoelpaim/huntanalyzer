# Configuração do GitHub Pages

Este projeto está configurado para fazer deploy automático no GitHub Pages.

## Configuração Inicial

1. No repositório do GitHub, vá em **Settings** > **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. O workflow será executado automaticamente quando você fizer push para a branch `master` ou `main`

## Como Funciona

- O workflow `.github/workflows/deploy.yml` é acionado automaticamente em cada push
- Ele faz build do projeto na pasta `web/`
- O resultado é publicado na branch `gh-pages` automaticamente
- O site ficará disponível em: `https://[seu-usuario].github.io/loot_analyzer/`

## Build Manual

Para testar o build localmente:

```bash
cd web
npm install
npm run build
```

O build será gerado na pasta `web/dist/`.

## Notas

- O `vite.config.js` está configurado para usar o base path correto automaticamente
- Se você renomear o repositório, o base path será ajustado automaticamente
- O workflow usa Node.js 18 e cache de dependências para builds mais rápidos
