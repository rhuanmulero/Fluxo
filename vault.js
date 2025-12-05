/**
 * Módulo Vault (Pastas Persistentes e Arquivos)
 * Correção: Visualização de arquivos soltos na raiz e dentro de pastas
 */

app.render_vault = (root) => {
    // 1. Sanitização do Caminho Atual (Garante que undefined/"" vire null)
    if (!app.vaultPath) app.vaultPath = null;
    
    // Inicializa busca se não existir
    if (typeof app.vaultSearch === 'undefined') app.vaultSearch = "";

    // 2. Normaliza o Path Atual para comparação
    const currentPathNormalized = app.vaultPath || 'ROOT';

    // 3. Filtra Itens (Lógica Robusta)
    const contents = (app.state.docs || []).filter(item => {
        // Se tiver busca, ignora pastas e busca por nome em tudo
        if (app.vaultSearch) {
            return item.name.toLowerCase().includes(app.vaultSearch.toLowerCase());
        }

        // Normaliza a pasta do item (se não tiver folder, assume ROOT)
        const itemFolderNormalized = item.folder || 'ROOT';
        
        // Compara: O item pertence a pasta atual?
        return itemFolderNormalized === currentPathNormalized;
    });

    // 4. Separa Pastas e Arquivos
    // Nota: Itens sem 'type' definido são tratados como arquivos por segurança
    const folders = contents.filter(i => i.type === 'folder');
    const files = contents.filter(i => i.type !== 'folder');

    // 5. Navegação (Breadcrumb)
    const nav = app.vaultPath 
        ? `<button class="btn ghost" onclick="app.vaultPath=null; app.render_vault(document.getElementById('content'))"><i class="ph ph-arrow-left"></i> Voltar</button> <span class="tag-pill" style="font-size:14px">📁 ${app.vaultPath}</span>`
        : `<span class="muted" style="display:flex; align-items:center; gap:5px; font-weight:600"><i class="ph ph-house"></i> Raiz / Meus Arquivos</span>`;

    // 6. HTML Principal
    root.innerHTML = `
        <div class="grid">
            <div class="col-12 card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
                <div style="display:flex; align-items:center; gap:10px">${nav}</div>
                <div style="display:flex; gap:10px; flex:1; justify-content:flex-end">
                    <div style="position:relative;">
                        <i class="ph ph-magnifying-glass" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted)"></i>
                        <input placeholder="Pesquisar arquivos..." 
                               value="${app.vaultSearch}"
                               onkeyup="app.vaultSearch=this.value; app.render_vault(document.getElementById('content'))" 
                               style="padding-left:32px; max-width:200px">
                    </div>
                    <button class="btn ghost" onclick="app.createVaultFolder()">+ Pasta</button>
                    <button class="btn" onclick="document.getElementById('vUp').click()">+ Arquivo</button>
                    <input type="file" id="vUp" hidden onchange="app.uploadVault(this)">
                </div>
            </div>
            
            <div class="col-12" id="vGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:15px; margin-top:10px"></div>
        </div>
    `;

    const grid = document.getElementById('vGrid');
    let html = '';

    // 7. Renderiza as Pastas Primeiro
    html += folders.map(f => `
        <div onclick="app.vaultPath='${f.name}'; app.render_vault(document.getElementById('content'))" 
             style="background:rgba(255,255,255,0.03); border:1px solid var(--border); padding:20px; border-radius:12px; text-align:center; cursor:pointer; position:relative; transition:all 0.2s"
             onmouseover="this.style.borderColor='var(--accent)'; this.style.background='rgba(255,255,255,0.05)'" 
             onmouseout="this.style.borderColor='var(--border)'; this.style.background='rgba(255,255,255,0.03)'">
            <i class="ph ph-folder-simple-star" style="font-size:48px; color:#fbbf24; margin-bottom:10px; display:block"></i>
            <div style="font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${f.name}</div>
            <button onclick="event.stopPropagation(); app.delVaultItem('${f.id}')" class="btn ghost danger" style="position:absolute; top:5px; right:5px; padding:4px; transform:scale(0.8)"><i class="ph ph-trash"></i></button>
        </div>
    `).join('');

    // 8. Renderiza os Arquivos Soltos
    html += files.map(f => {
        let icon = 'ph-file';
        let color = 'var(--text-muted)';
        
        // Ícones inteligentes baseados na extensão
        if (f.name.match(/\.pdf$/i)) { icon = 'ph-file-pdf'; color = '#ef4444'; }
        else if (f.name.match(/\.(jpg|png|jpeg|gif|webp)$/i)) { icon = 'ph-image'; color = '#3b82f6'; }
        else if (f.name.match(/\.(txt|md|js|html|css|json)$/i)) { icon = 'ph-file-text'; color = '#10b981'; }
        else if (f.name.match(/\.(doc|docx)$/i)) { icon = 'ph-file-doc'; color = '#3b82f6'; }
        else if (f.name.match(/\.(xls|xlsx|csv)$/i)) { icon = 'ph-file-xls'; color = '#10b981'; }

        return `
        <div style="background:var(--bg-card); border:1px solid var(--border); padding:15px; border-radius:12px; display:flex; flex-direction:column; gap:10px; position:relative; transition:transform 0.2s" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="display:flex; align-items:center; gap:10px">
                <i class="ph ${icon}" style="font-size:32px; color:${color}"></i>
                <div style="overflow:hidden">
                    <div style="font-weight:600; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f.name}">${f.name}</div>
                    <div class="muted" style="font-size:10px">${f.size || '0'} KB</div>
                </div>
            </div>
            <div style="display:flex; gap:5px; margin-top:auto">
                <button class="btn ghost" style="flex:1; font-size:10px; padding:5px; border:1px solid var(--border)" onclick="app.openVaultFile('${f.id}')">Abrir</button>
                <button class="btn ghost danger" style="padding:5px" onclick="app.delVaultItem('${f.id}')"><i class="ph ph-trash"></i></button>
            </div>
        </div>`;
    }).join('');

    // Feedback visual se vazio
    if(!html) {
        if(app.vaultSearch) {
            html = '<div class="muted col-12 text-center" style="padding:40px; grid-column:1/-1">Nenhum arquivo encontrado na busca.</div>';
        } else {
            html = '<div class="muted col-12 text-center" style="padding:40px; grid-column:1/-1; border: 2px dashed var(--border); border-radius:12px">Esta pasta está vazia.<br>Adicione arquivos ou pastas acima.</div>';
        }
    }
    
    grid.innerHTML = html;
};

// --- FUNÇÕES DE AÇÃO ---

app.createVaultFolder = () => {
    app.promptModal("Nova Pasta", "Nome da pasta...", (name) => {
        if(!name) return;
        
        // Verifica duplicata na pasta atual
        const exists = app.state.docs.find(i => 
            i.type === 'folder' && 
            i.name.toLowerCase() === name.toLowerCase() && 
            (i.folder || null) === (app.vaultPath || null)
        );
        
        if(exists) return app.toast("Já existe uma pasta com esse nome aqui.", "error");

        app.state.docs.push({
            id: app.uid(),
            type: 'folder',
            name: name,
            folder: app.vaultPath || null // Garante null se for raiz
        });
        
        app.saveState();
        app.render_vault(document.getElementById('content'));
        app.toast("Pasta criada!");
    });
};

app.uploadVault = (input) => {
    const f = input.files[0];
    if(!f) return;
    
    // Limite de 3MB
    if(f.size > 3000000) return app.toast("Limite de 3MB excedido. O arquivo é muito grande.", "error");

    const reader = new FileReader();
    reader.onload = (e) => {
        app.state.docs.push({
            id: app.uid(),
            type: 'file',
            name: f.name,
            size: (f.size/1024).toFixed(1),
            data: e.target.result,
            folder: app.vaultPath || null // Garante null se for raiz
        });
        
        app.saveState();
        app.render_vault(document.getElementById('content'));
        app.toast("Arquivo salvo com sucesso!");
        
        // Limpa o input para permitir enviar o mesmo arquivo novamente se quiser
        input.value = '';
    };
    reader.readAsDataURL(f);
};

app.openVaultFile = (id) => {
    const f = app.state.docs.find(x => x.id === id);
    if(!f) return;
    
    const win = window.open();
    if(f.data.startsWith('data:image') || f.data.startsWith('data:application/pdf')) {
        win.document.write(`
            <title>${f.name}</title>
            <body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh;">
                <iframe src="${f.data}" style="border:0; width:100%; height:100%"></iframe>
            </body>
        `);
    } else {
        // Download forçado para outros tipos
        const a = document.createElement('a');
        a.href = f.data;
        a.download = f.name;
        a.click();
        win.close();
    }
};

app.delVaultItem = (id) => {
    app.confirmModal("Excluir item? (Se for pasta, todo o conteúdo será apagado)", () => {
        const item = app.state.docs.find(x => x.id === id);
        if(!item) return;

        if (item.type === 'folder') {
            // Lógica Recursiva: Apaga a pasta E tudo que estiver dentro dela
            // Filtra mantendo apenas o que NÃO é (o item OU itens que estão dentro dessa pasta)
            app.state.docs = app.state.docs.filter(x => 
                x.id !== id && 
                x.folder !== item.name
            );
        } else {
            app.state.docs = app.state.docs.filter(x => x.id !== id);
        }
        
        app.saveState();
        app.render_vault(document.getElementById('content'));
        app.toast("Item excluído.");
    });
};
