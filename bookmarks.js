/**
 * Módulo Bookmarks (Corrigido e Melhorado)
 * Arquivo: js/modules/bookmarks.js
 */

app.render_bookmarks = (root) => {
    // Inicializa variáveis se não existirem
    if (!app.bmCurrentFolder) app.bmCurrentFolder = null;
    if (typeof app.bmSearch === 'undefined') app.bmSearch = "";

    // Renderiza a ESTRUTURA (Toolbar estática + Container dinâmico)
    root.innerHTML = `
        <div class="grid">
            <div class="col-12">
                <div class="card" style="margin-bottom: 20px; padding: 15px; display:flex; gap:10px; align-items:center;">
                    <i class="ph ph-magnifying-glass muted"></i>
                    <input id="bmSearchInput" placeholder="Buscar bookmarks..." style="border:none; background:transparent; flex:1; font-size:16px;" value="${app.bmSearch}">
                    <button class="btn" onclick="app.addBookmarkPrompt()">+ Novo Link</button>
                </div>
                
                <div id="bmContainer"></div>
            </div>
        </div>
    `;

    // Event Listener para a busca (sem perder foco)
    const searchInput = document.getElementById('bmSearchInput');
    searchInput.addEventListener('input', (e) => {
        app.bmSearch = e.target.value;
        app.renderBookmarkList(); // Atualiza SÓ a lista
    });

    // Renderiza a lista pela primeira vez
    app.renderBookmarkList();
};

// Função separada que só desenha os itens (Grid/Lista)
app.renderBookmarkList = () => {
    const container = document.getElementById('bmContainer');
    if (!container) return;

    // Lógica de filtragem e pastas
    const folders = {};
    const uncategorized = [];
    const isSearching = app.bmSearch.length > 0;

    app.state.bookmarks.forEach(b => {
        // Se estiver buscando, ignora pastas e mostra tudo que bate
        if (isSearching && !b.title.toLowerCase().includes(app.bmSearch.toLowerCase())) return;

        const cat = b.category || 'Geral';
        if (cat === 'Geral' || isSearching) { 
            uncategorized.push(b); // Na busca, mostra tudo plano
        } else {
            if (!folders[cat]) folders[cat] = [];
            folders[cat].push(b);
        }
    });

    let html = '';

    // MODO 1: VISUALIZANDO UMA PASTA
    if (app.bmCurrentFolder && !isSearching) {
        const links = folders[app.bmCurrentFolder] || [];
        html = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <button class="btn ghost" onclick="app.bmCurrentFolder=null; app.renderBookmarkList()">
                    <i class="ph ph-arrow-left"></i> Voltar
                </button>
                <h2 style="margin:0"><i class="ph ph-folder-open" style="color:var(--accent)"></i> ${app.bmCurrentFolder}</h2>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px">
                ${links.map(b => app.createBookmarkRow(b)).join('')}
                ${links.length === 0 ? '<div class="muted">Pasta vazia.</div>' : ''}
            </div>
        `;
    } 
    // MODO 2: RAIZ (Pastas + Itens Soltos)
    else {
        const folderKeys = Object.keys(folders).sort();
        
        // Grid de Pastas
        if (folderKeys.length > 0 && !isSearching) {
            html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:15px; margin-bottom:30px;">`;
            html += folderKeys.map(cat => `
                <div onclick="app.bmCurrentFolder='${cat}'; app.renderBookmarkList()" 
                     style="background:var(--bg-card); border:1px solid var(--border); padding:20px; border-radius:12px; text-align:center; cursor:pointer; transition:all 0.2s;"
                     onmouseover="this.style.borderColor='var(--primary)'" 
                     onmouseout="this.style.borderColor='var(--border)'">
                    <i class="ph ph-folder-simple-star" style="font-size:48px; color:var(--accent); margin-bottom:10px; display:block"></i>
                    <div style="font-weight:600">${cat}</div>
                    <div class="muted" style="font-size:11px">${folders[cat].length} links</div>
                </div>
            `).join('');
            html += `</div>`;
        }

        // Lista de Links
        if (uncategorized.length > 0) {
            html += `<h3 class="muted" style="font-size:12px; text-transform:uppercase; margin-bottom:10px;">${isSearching ? 'Resultados' : 'Links Soltos'}</h3>`;
            html += `<div style="display:flex; flex-direction:column; gap:10px">`;
            html += uncategorized.map(b => app.createBookmarkRow(b)).join('');
            html += `</div>`;
        } else if (folderKeys.length === 0) {
            html += `<div class="muted text-center" style="padding:40px">Nenhum bookmark encontrado.</div>`;
        }
    }

    container.innerHTML = html;
};

// Helper para criar a linha do bookmark (HTML)
app.createBookmarkRow = (b) => {
    return `
    <div style="display:flex; align-items:center; gap:15px; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid transparent; transition:all 0.2s;" onmouseover="this.style.borderColor='var(--border)'; this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.borderColor='transparent'; this.style.background='rgba(255,255,255,0.03)'">
        <img src="https://www.google.com/s2/favicons?domain=${b.url}&sz=32" width="24" height="24" style="border-radius:4px; opacity:0.8">
        <div style="flex:1; overflow:hidden;">
            <a href="${b.url}" target="_blank" style="color:var(--text-main); text-decoration:none; font-weight:600; display:block; font-size:14px;">${b.title}</a>
            <div class="muted" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.url}</div>
        </div>
        <div style="display:flex; gap:10px">
            <span class="tag-pill" style="background:${b.color||'#6366f1'}22; color:${b.color||'#6366f1'}">${b.category||'Geral'}</span>
            <button class="btn ghost danger" style="padding:6px" onclick="app.delBookmark('${b.id}')"><i class="ph ph-trash"></i></button>
        </div>
    </div>`;
};

app.addBookmarkPrompt = () => {
    app.openModal(`
        <h3>Adicionar Bookmark</h3>
        <input id="bmUrl" placeholder="URL (https://...)" style="margin-bottom:10px">
        <input id="bmTitle" placeholder="Título" style="margin-bottom:10px">
        <div style="display:flex; gap:10px; margin-bottom:10px">
            <input id="bmCat" placeholder="Pasta / Categoria" list="catList" style="flex:1">
            <input type="color" id="bmColor" value="#a855f7" style="width:50px; padding:0; height:42px; background:none; border:none;">
        </div>
        <datalist id="catList">
            ${[...new Set(app.state.bookmarks.map(b=>b.category))].map(c=>`<option value="${c}">`).join('')}
        </datalist>
        <div class="modal-actions">
            <button class="btn" onclick="app.saveBookmark()">Salvar</button>
        </div>
    `);
};

app.saveBookmark = () => {
    let url = document.getElementById('bmUrl').value;
    const title = document.getElementById('bmTitle').value;
    const category = document.getElementById('bmCat').value;
    const color = document.getElementById('bmColor').value;
    
    if(!url) return app.toast("URL obrigatória", "error");
    if(!url.startsWith('http')) url = 'https://' + url;
    
    app.state.bookmarks.push({
        id: app.uid(), url, title: title || url, category: category || 'Geral', color
    });
    app.saveState(); 
    app.closeModal();
    app.renderBookmarkList();
};

app.delBookmark = (id) => { 
    app.confirmModal('Remover favorito?', ()=>{ 
        app.state.bookmarks = app.state.bookmarks.filter(x=>x.id!==id); 
        app.saveState(); 
        app.renderBookmarkList(); 
    }); 
};
