# 💡 SOLUÇÃO ALTERNATIVA: Gerar PDF a partir do Modal

## Problema Atual

O modal mostra dados corretos, mas a função `baixarPDFOS()` gera o HTML novamente e pode ter algum problema no processo.

## Solução

Usar o HTML que **já está renderizado no modal** para gerar o PDF, garantindo que seja exatamente o que o usuário está vendo.

---

## Implementação

### Modificar `baixarPDFOS()`

```javascript
// NOVA VERSÃO - Usa HTML do modal
async function baixarPDFOS(osId) {
    try {
        console.log('🔍 Gerando PDF do modal visível');
        
        // Buscar O.S. para obter numeroOS
        const os = await APIClient.obterOrdemServico(osId);
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }
        
        // Botão loading
        const btn = event && event.target ? event.target : null;
        let btnText = '';
        if (btn) {
            btnText = btn.innerHTML;
            btn.innerHTML = '⏳ Gerando PDF...';
            btn.disabled = true;
        }
        
        // PEGAR HTML DO MODAL (que já está correto!)
        const modalContent = document.getElementById('preview-os');
        
        if (!modalContent) {
            alert('Nenhuma visualização aberta. Abra a visualização primeiro.');
            return;
        }
        
        console.log('📄 Usando HTML do modal');
        
        // Criar elemento temporário com o MESMO conteúdo do modal
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.innerHTML = modalContent.innerHTML;  // ← COPIA DO MODAL
        document.body.appendChild(tempDiv);
        
        const previewElement = tempDiv.querySelector('.os-preview');
        
        if (!previewElement) {
            console.error('❌ Elemento .os-preview não encontrado');
            alert('Erro ao preparar visualização para PDF');
            document.body.removeChild(tempDiv);
            return;
        }
        
        // Aguardar DOM atualizar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📸 Capturando imagem...');
        
        // Converter para canvas
        const canvas = await html2canvas(previewElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: previewElement.scrollWidth,
            windowHeight: previewElement.scrollHeight
        });
        
        console.log('✅ Canvas gerado');
        
        // Remover elemento temporário
        document.body.removeChild(tempDiv);
        
        // Criar PDF
        const { jsPDF } = window.jspdf;
        const pdfWidth = 210;
        const pdfHeight = 297;
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        
        while (heightLeft > 0) {
            position = -pdfHeight * Math.ceil((imgHeight - heightLeft) / pdfHeight);
            pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        console.log('💾 Salvando PDF...');
        pdf.save(`OS_${os.numeroOS}.pdf`);
        console.log('✅ PDF salvo!');
        
        // Restaurar botão
        if (btn) {
            btn.innerHTML = btnText;
            btn.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF: ' + error.message);
        
        if (event && event.target) {
            event.target.innerHTML = '📥 Baixar PDF';
            event.target.disabled = false;
        }
    }
}
```

### Vantagens

✅ Usa exatamente o HTML que está no modal  
✅ Garante que PDF = Modal  
✅ Elimina problemas de normalização  
✅ Elimina problemas de cache  
✅ Mais simples e direto  

### Desvantagens

⚠️ Requer que o modal esteja aberto  
⚠️ Se modal tiver erro, PDF também terá  

---

## Como Aplicar

1. Substitua a função `baixarPDFOS()` no arquivo:
   - `backend/static/js/app.js`
   - Linha ~1035

2. Recarregue a página (Ctrl+Shift+R)

3. Teste:
   - Abrir modal de visualização
   - Clicar "Baixar PDF"
   - Verificar que PDF tem mesmos dados do modal

---

## Alternativa 2: Debug Mais Profundo

Se preferir manter a lógica atual, adicione mais logs:

```javascript
async function baixarPDFOS(osId) {
    try {
        const os = await APIClient.obterOrdemServico(osId);
        console.log('1️⃣ Dados da API:', JSON.stringify(os, null, 2));
        
        const dadosNormalizados = normalizarDadosOS(os);
        console.log('2️⃣ Dados normalizados:', JSON.stringify(dadosNormalizados, null, 2));
        
        const preview = gerarPreviewOS(dadosNormalizados);
        console.log('3️⃣ HTML gerado contém evento correto?', preview.includes(os.evento));
        console.log('4️⃣ Evento procurado:', os.evento);
        
        // Procurar onde está o evento no HTML
        const eventoPosicao = preview.indexOf(os.evento);
        if (eventoPosicao === -1) {
            console.error('❌ EVENTO NÃO ENCONTRADO NO HTML!');
            console.log('HTML completo:', preview);
        } else {
            console.log('✅ Evento encontrado na posição:', eventoPosicao);
            console.log('Contexto:', preview.substring(eventoPosicao - 50, eventoPosicao + 100));
        }
        
        // ... continua gerando PDF
    }
}
```

---

## Recomendação

**Use a Solução 1 (copiar do modal)** porque:
- É mais confiável
- Elimina problemas de sincronização
- Garante que PDF = o que usuário vê
- Código mais simples

Se quiser manter a geração independente, use Solução 2 para debugar.
