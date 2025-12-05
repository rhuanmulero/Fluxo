/**
 * Módulo Vault (Pastas Persistentes)
 */

app.render_vault = (root) => {
    // Estado de Navegação
    if (typeof app.vaultPath === 'undefined') app.vaultPath = null; // null = Raiz
    if (typeof app.vaultSearch === 'undefined') app.vaultSearch = "";

    // Filtra itens da pasta atual
    const contents = app.state.docs.filter(item => {
        // Se busca, mostra tudo que bate
        if (app.vaultSearch) return item.name.toLowerCase().includes(app.vaultSearch.toLowerCase());
        // Se não, mostra só o que está na pasta atual
        const itemFolder = item.folder || null;
        return itemFolder === app.vaultPath;
    });

    // Separa Pastas e Arquivos
    const folders = contents.filter(i => i.type === 'folder');
    const files = contents.filter(i => i.type !== 'folder');

    // Breadcrumb (Navegação)
    const nav = app.vaultPath 
        ? `<button class="btn ghost" onclick="app.vaultPath=null; app.render_vault(document.getElementById('content'))"><i class="ph ph-arrow-left"></i> Voltar</button> <span class="tag-pill">📁 ${app.vaultPath}</span>`
        : `<span class="muted" style="display:flex; align-items:center; gap:5px"><i class="ph ph-house"></i> Raiz</span>`;

    root.innerHTML = `
        <div class="grid">
            <div class="col-12 card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
                <div style="display:flex; align-items:center; gap:10px">${nav}</div>
                <div style="display:flex; gap:10px; flex:1; justify-content:flex-end">
                    <input placeholder="Pesquisar..." onkeyup="app.vaultSearch=this.value; app.render_vault(document.getElementById('content'))" style="max-width:200px">
                    <button class="btn ghost" onclick="app.createVaultFolder()">+ Pasta</button>
                    <button class="btn" onclick="document.getElementById('vUp').click()">+ Arquivo</button>
                    <input type="file" id="vUp" hidden onchange="app.uploadVault(this)">
                </div>
            </div>
            
            <div class="col-12" id="vGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:15px; margin-top:20px"></div>
        </div>
    `;

    const grid = document.getElementById('vGrid');
    let html = '';

    // 1. Renderiza Pastas
    html += folders.map(f => `
        <div onclick="app.vaultPath='${f.name}'; app.render_vault(document.getElementById('content'))" 
             style="background:rgba(255,255,255,0.03); border:1px solid var(--border); padding:20px; border-radius:12px; text-align:center; cursor:pointer; position:relative; group"
             onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <i class="ph ph-folder-simple-star" style="font-size:48px; color:#fbbf24"></i>
            <div style="margin-top:10px; font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${f.name}</div>
            <button onclick="event.stopPropagation(); app.delVaultItem('${f.id}')" class="btn ghost danger" style="position:absolute; top:5px; right:5px; padding:4px; transform:scale(0.8)"><i class="ph ph-trash"></i></button>
        </div>
    `).join('');

    // 2. Renderiza Arquivos
    html += files.map(f => {
        let icon = 'ph-file';
        if (f.name.endsWith('.pdf')) icon = 'ph-file-pdf';
        if (f.name.match(/\.(jpg|png|jpeg)$/i)) icon = 'ph-image';
        if (f.name.match(/\.(txt|md|js|html|doc)$/i)) icon = 'ph-file-text';

        return `
        <div style="background:var(--bg-card); border:1px solid var(--border); padding:15px; border-radius:12px; display:flex; flex-direction:column; gap:10px; position:relative">
            <div style="display:flex; align-items:center; gap:10px">
                <i class="ph ${icon}" style="font-size:32px; color:var(--text-muted)"></i>
                <div style="overflow:hidden">
                    <div style="font-weight:600; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f.name}">${f.name}</div>
                    <div class="muted" style="font-size:10px">${f.size || '0'} KB</div>
                </div>
            </div>
            <div style="display:flex; gap:5px; margin-top:auto">
                <button class="btn ghost" style="flex:1; font-size:10px; padding:5px" onclick="app.openVaultFile('${f.id}')">Abrir</button>
                <button class="btn ghost danger" style="padding:5px" onclick="app.delVaultItem('${f.id}')"><i class="ph ph-trash"></i></button>
            </div>
        </div>`;
    }).join('');

    if(!html) html = '<div class="muted col-12 text-center" style="padding:40px; grid-column:1/-1">Pasta vazia.</div>';
    grid.innerHTML = html;
};

app.createVaultFolder = () => {
    app.promptModal("Nova Pasta", "Nome", (name) => {
        // Verifica duplicata
        const exists = app.state.docs.find(i => i.type === 'folder' && i.name === name && i.folder === app.vaultPath);
        if(exists) return app.toast("Essa pasta já existe", "error");

        app.state.docs.push({
            id: app.uid(),
            type: 'folder',
            name: name,
            folder: app.vaultPath // Cria dentro da pasta atual
        });
        app.saveState();
        app.render_vault(document.getElementById('content'));
    });
};

app.uploadVault = (input) => {
    const f = input.files[0];
    if(!f) return;
    if(f.size > 3000000) return app.toast("Limite de 3MB excedido", "error");

    const reader = new FileReader();
    reader.onload = (e) => {
        app.state.docs.push({
            id: app.uid(),
            type: 'file',
            name: f.name,
            size: (f.size/1024).toFixed(1),
            data: e.target.result,
            folder: app.vaultPath
        });
        app.saveState();
        app.render_vault(document.getElementById('content'));
        app.toast("Arquivo salvo!");
    };
    reader.readAsDataURL(f);
};

app.openVaultFile = (id) => {
    const f = app.state.docs.find(x => x.id === id);
    if(!f) return;
    
    const win = window.open();
    if(f.data.startsWith('data:image') || f.data.startsWith('data:application/pdf')) {
        win.document.write(`<iframe src="${f.data}" style="border:0; width:100%; height:100%"></iframe>`);
    } else {
        const a = document.createElement('a');
        a.href = f.data;
        a.download = f.name;
        a.click();
    }
};

app.delVaultItem = (id) => {
    app.confirmModal("Excluir item? (Se for pasta, apaga o conteúdo)", () => {
        const item = app.state.docs.find(x => x.id === id);
        
        if (item.type === 'folder') {
            // Apaga a pasta E tudo que estiver dentro dela (recursivo simples de 1 nível)
            app.state.docs = app.state.docs.filter(x => x.id !== id && x.folder !== item.name);
        } else {
            app.state.docs = app.state.docs.filter(x => x.id !== id);
        }
        
        app.saveState();
        app.render_vault(document.getElementById('content'));
    });
};
