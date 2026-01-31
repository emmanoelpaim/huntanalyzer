# Analisador de Loot Pokémon

Aplicação para análise e gerenciamento de logs de loot de jogos.

## Estrutura do Projeto

```
loot_analyzer/
├── app.py                 # Ponto de entrada da aplicação
├── requirements.txt       # Dependências do projeto
├── README.md             # Este arquivo
├── data/                 # Dados da aplicação
│   └── logs.json         # Arquivo de logs salvos
├── images/                 # Imagens (criada automaticamente)
└── src/                   # Código fonte
    ├── __init__.py
    ├── config.py          # Configurações e constantes
    ├── utils/             # Utilitários
    │   ├── __init__.py
    │   ├── extractors.py   # Extração de loot e derrotados
    │   ├── formatters.py   # Formatação de datas
    │   └── images.py       # Carregamento de imagens Pokémon
    ├── services/          # Serviços de negócio
    │   ├── __init__.py
    │   ├── log_service.py  # Gerenciamento de logs
    │   └── export_service.py # Exportação para Excel
    └── ui/                # Interface gráfica
        ├── __init__.py
        ├── main_window.py  # Janela principal
        └── logs_window.py  # Janela de logs
```

## Instalação

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Execução

```bash
python app.py
```

## Gerar Executável

Para gerar um executável (.exe) no Windows:

1. Instale o PyInstaller:
```bash
pip install pyinstaller
```

2. Gere o executável usando o arquivo de especificação:
```bash
pyinstaller build_executable.spec
```

O executável será gerado na pasta `dist/LootAnalyzer.exe`

Alternativamente, use o comando direto:
```bash
pyinstaller --onefile --windowed --name LootAnalyzer --add-data "data;data" app.py
```

**Parâmetros:**
- `--onefile`: Gera um único arquivo executável
- `--windowed`: Oculta o console (para aplicações GUI)
- `--name`: Nome do executável
- `--add-data`: Inclui a pasta `data` no executável

## Funcionalidades

- Extração automática de loot e derrotados de mensagens de jogo
- Salvamento de logs com data, personagem e derrotado
- Visualização hierárquica de logs agrupados por dia e derrotado
- Exportação para Excel
- Interface temática Pokémon
