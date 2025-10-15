#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import re

# Ler o arquivo
with open('backend/static/js/app.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Padrão para encontrar e substituir
old_pattern = r'''        // Substituir botões do formulário pelo padrão de edição
        const containerBotoes = document\.getElementById\('botoes-formulario-os'\);
        submitBtn\.textContent = '.*? Visualizar Alterações';
        
        // Adicionar botão para cancelar edição
        const cancelBtn = document\.querySelector\('#cancelar-edicao-os'\);
        if \(!cancelBtn\) \{
            const novoCancelBtn = document\.createElement\('button'\);
            novoCancelBtn\.type = 'button';
            novoCancelBtn\.className = 'btn btn-danger';
            novoCancelBtn\.id = 'cancelar-edicao-os';
            novoCancelBtn\.textContent = '❌ Cancelar Edição';
            novoCancelBtn\.onclick = cancelarEdicaoOS;
            submitBtn\.parentNode\.insertBefore\(novoCancelBtn, submitBtn\);
        \}'''

new_code = '''        // Substituir botões do formulário pelo padrão de edição
        const containerBotoes = document.getElementById('botoes-formulario-os');
        containerBotoes.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="visualizarOS()">👁️ Visualizar</button>
            <button type="button" class="btn btn-success" onclick="salvarEFecharOS()">💾 Salvar e Fechar</button>
            <button type="button" class="btn btn-warning" onclick="salvarEContinuarOS()">💾 Salvar e Continuar</button>
            <button type="button" class="btn btn-danger" onclick="cancelarEdicaoOS()">❌ Cancelar</button>
        `;'''

# Substituir
content_new = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

if content_new != content:
    # Salvar
    with open('backend/static/js/app.js', 'w', encoding='utf-8') as f:
        f.write(content_new)
    print("✅ Arquivo atualizado com sucesso!")
else:
    print("❌ Padrão não encontrado. Tentando abordagem alternativa...")
    
    # Tentativa 2: procurar por um trecho maior único
    search_text = "const containerBotoes = document.getElementById('botoes-formulario-os');"
    if search_text in content:
        idx = content.find(search_text)
        print(f"Encontrado em posição {idx}")
        # Mostrar contexto
        print("CONTEXTO ENCONTRADO:")
        print(content[idx:idx+500])
    else:
        print("Não encontrado!")
