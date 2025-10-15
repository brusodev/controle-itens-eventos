# Controle de Itens e Eventos

Sistema de controle de ordens de serviço para eventos e alimentação.

## 📁 Estrutura do Projeto

```
controle-itens-eventos/
├── backend/                    # API Flask e lógica do servidor
│   ├── routes/                # Rotas da API
│   ├── static/                # Arquivos estáticos (CSS, JS)
│   ├── templates/             # Templates HTML
│   ├── migrations/            # Scripts de migração do banco
│   ├── tests/                 # Arquivos de teste
│   ├── utils/                 # Scripts utilitários
│   ├── models.py              # Modelos do banco de dados
│   ├── pdf_generator.py       # Gerador de PDFs
│   ├── app.py                 # Aplicação principal
│   └── requirements.txt       # Dependências Python
├── docs/                      # Documentação e guias
│   ├── README.md             # Documentação principal
│   ├── DOCUMENTACAO.md       # Documentação técnica
│   ├── GUIA_DIAGNOSTICO_OS.md
│   ├── GUIA_MIGRACAO.md
│   └── ... (outros arquivos .md)
├── frontend/                  # Arquivos do frontend
│   ├── index.html            # Página principal
│   ├── styles.css            # Estilos CSS
│   ├── app.js                # Lógica JavaScript principal
│   ├── api-client.js         # Cliente da API
│   └── MELHORIAS_RESPONSIVIDADE.css/js
├── scripts/                   # Scripts auxiliares e utilitários
│   ├── fix_buttons.py        # Script de correção de botões
│   ├── itens.json            # Dados de itens (backup/amostra)
│   └── importar-os-antigas.html # Script de importação
├── instance/                  # Banco de dados SQLite
├── venv/                      # Ambiente virtual Python
└── timbrado.png              # Logo/timbrado para PDFs
```

## 🚀 Como Executar

### Pré-requisitos
- Python 3.8+
- Pip

### Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd controle-itens-eventos
   ```

2. **Instale as dependências:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Execute as migrações do banco (se necessário):**
   ```bash
   cd backend/migrations
   python migrate_add_diarias.py
   python migrate_add_observacoes.py
   python migrate_add_fiscal_tipo.py
   ```

4. **Execute a aplicação:**
   ```bash
   python app.py
   ```

5. **Acesse no navegador:**
   ```
   http://127.0.0.1:5100
   ```

## 📋 Funcionalidades

- ✅ Controle de ordens de serviço
- ✅ Gestão de estoque por região
- ✅ Geração de PDFs com layout profissional
- ✅ Sistema de diárias e quantidades
- ✅ Campo de observações nas O.S.
- ✅ Tipos de fiscal (Contrato/Técnico)
- ✅ Impressão direta do navegador

## 🛠️ Desenvolvimento

### Estrutura de Pastas

- **`backend/`**: Contém toda a lógica do servidor Flask
  - **`migrations/`**: Scripts para migração e atualização do banco de dados
  - **`tests/`**: Arquivos de teste automatizados
  - **`utils/`**: Scripts utilitários para manutenção e diagnóstico
- **`docs/`**: Documentação completa do projeto e correções
- **`frontend/`**: Arquivos estáticos do frontend (HTML, CSS, JS)
- **`scripts/`**: Scripts auxiliares e de importação de dados

### Principais Arquivos

- `backend/app.py`: Ponto de entrada da aplicação
- `backend/models.py`: Definições do banco de dados
- `frontend/index.html`: Interface principal
- `frontend/app.js`: Lógica do frontend
- `docs/README.md`: Documentação detalhada

## 📖 Documentação

Toda a documentação está organizada na pasta `docs/`:
- Guias de diagnóstico e solução de problemas
- Histórico de correções implementadas
- Guias de migração e atualização

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da equipe de desenvolvimento.</content>
<parameter name="filePath">c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos\README.md