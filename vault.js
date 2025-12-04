/**
 * Módulo Vault (Arquivos PDF)
 */

app.render_vault = (root) => {
    root.innerHTML = `
        <div class="grid">
            <div class="col-12 card">
                <div style="border:2px dashed var(--border); padding:32px; text-align:center; border-radius:12px; cursor:pointer; transition: background 0.2s;" 
                     onclick="document.getElementById('pdfUp').click()"
                     onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                     onmouseout="this.style.background='transparent'">
                    <i class="ph ph-file-pdf" style="font-size:48px; color:var(--text-muted)"></i>
                    <p style="margin-top:10px; font-weight:600">Adicionar PDF (Max 500KB)</p>
                    <div class="muted" style="font-size:12px">Clique para selecionar</div>
                    <input type="file" id="pdfUp" accept="application/pdf" hidden onchange="app.uploadPdf(this)">
                </div>
            </div>
            <div class="col-12 grid" id="pdfGrid" style="margin-top:20px;"></div>
        </div>
    `;
    
    // Renderiza a Grid de Arquivos
    const grid = document.getElementById('pdfGrid');
    if (app.state.docs.length === 0) {
        grid.innerHTML = '<div class="col-12 muted text-center">Nenhum arquivo armazenado.</div>';
    } else {
        grid.innerHTML = app.state.docs.map(d => `
            <div class="col-4 card" style="display:flex; flex-direction:column; gap:10px">
                <div style="display:flex; align-items:center; gap:10px">
                    <i class="ph ph-file-pdf" style="color:#ef4444; font-size:24px"></i>
                    <div style="flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis">
                        <strong>${d.name}</strong>
                        <div class="muted" style="font-size:11px">${d.size} KB</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px; margin-top:auto">
                    <button class="btn" style="flex:1" onclick="app.openPdf('${d.id}')">Abrir</button>
                    <button class="btn danger" onclick="app.delPdf('${d.id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        `).join('');
    }
};

// --- FUNÇÕES DE AÇÃO ---

app.uploadPdf = (input) => {
    const f = input.files[0]; 
    if(!f) return;
    
    // Limite de 500KB para não estourar o LocalStorage
    if(f.size > 500000) {
        app.toast("Arquivo muito grande! Máx 500KB.", "error");
        input.value = ''; // Limpa o input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => { 
        app.state.docs.push({ 
            id: app.uid(), 
            name: f.name, 
            data: e.target.result, 
            size: (f.size/1024).toFixed(1) 
        }); 
        app.saveState(); 
        app.render_vault(document.getElementById('content'));
        app.toast("PDF salvo com sucesso!");
    };
    reader.readAsDataURL(f);
};

app.openPdf = (id) => {
    const doc = app.state.docs.find(d => d.id === id);
    if(doc) {
        const win = window.open();
        win.document.write(`<iframe src="${doc.data}" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
        win.document.title = doc.name;
    }
};

app.delPdf = (id) => { 
    app.confirmModal('Apagar este PDF do Vault?', () => { 
        app.state.docs = app.state.docs.filter(x => x.id !== id); 
        app.saveState(); 
        app.render_vault(document.getElementById('content')); 
    }); 
};
