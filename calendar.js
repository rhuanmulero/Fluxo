/**
 * Módulo Bookmarks (Sem Estrelas, Com Rastreamento de Uso)
 */

app.render_bookmarks = (root) => {
    if (!app.bmCurrentFolder) app.bmCurrentFolder = null;
    if (typeof app.bmSearch === 'undefined') app.bmSearch = "";

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

    const searchInput = document.getElementById('bmSearchInput');
    searchInput.addEventListener('input', (e) => {
        app.bmSearch = e.target.value;
        app.renderBookmarkList();
    });
    app.renderBookmarkList();
};

app.renderBookmarkList = () => {
    const container = document.getElementById('bmContainer');
    if (!container) return;

    const folders = {};
    const uncategorized = [];
    const isSearching = app.bmSearch.length > 0;

    app.state.bookmarks.forEach(b => {
        if (isSearching && !b.title.toLowerCase().includes(app.bmSearch.toLowerCase())) return;
        const cat = b.category || 'Geral';
        if (cat === 'Geral' || isSearching) uncategorized.push(b);
        else {
            if (!folders[cat]) folders[cat] = [];
            folders[cat].push(b);
        }
    });

    let html = '';

    if (app.bmCurrentFolder && !isSearching) {
        const links = folders[app.bmCurrentFolder] || [];
        html = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                <button class="btn ghost" onclick="app.bmCurrentFolder=null; app.renderBookmarkList()"><i class="ph ph-arrow-left"></i> Voltar</button>
                <h2>${app.bmCurrentFolder}</h2>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px">
                ${links.map(b => app.createBookmarkRow(b)).join('')}
                ${links.length === 0 ? '<div class="muted">Pasta vazia.</div>' : ''}
            </div>
        `;
    } else {
        const folderKeys = Object.keys(folders).sort();
        if (folderKeys.length > 0 && !isSearching) {
            html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:15px; margin-bottom:30px;">`;
            html += folderKeys.map(cat => `
                <div onclick="app.bmCurrentFolder='${cat}'; app.renderBookmarkList()" 
                     style="background:var(--bg-card); border:1px solid var(--border); padding:20px; border-radius:12px; text-align:center; cursor:pointer;"
                     onmouseover="this.style.borderColor='var(--accent)'" 
                     onmouseout="this.style.borderColor='var(--border)'">
                    <i class="ph ph-folder-simple-star" style="font-size:48px; color:var(--accent); margin-bottom:10px; display:block"></i>
                    <div style="font-weight:600">${cat}</div>
                    <div class="muted" style="font-size:11px">${folders[cat].length} links</div>
                </div>
            `).join('');
            html += `</div>`;
        }
        if (uncategorized.length > 0) {
            html += `<div style="display:flex; flex-direction:column; gap:10px">`;
            html += uncategorized.map(b => app.createBookmarkRow(b)).join('');
            html += `</div>`;
        }
    }
    container.innerHTML = html;
};

app.createBookmarkRow = (b) => {
    return `
    <div style="display:flex; align-items:center; gap:15px; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid transparent; transition:all 0.2s;" onmouseover="this.style.borderColor='var(--border)'" onmouseout="this.style.borderColor='transparent'">
        
        <img src="https://www.google.com/s2/favicons?domain=${b.url}&sz=32" width="20" height="20" style="border-radius:4px; opacity:0.8">
        
        <div style="flex:1; overflow:hidden;">
            <!-- Link chama função openBookmark para registrar clique -->
            <a onclick="app.openBookmark('${b.id}')" style="cursor:pointer; color:var(--text-main); text-decoration:none; font-weight:600; display:block; font-size:14px;">${b.title}</a>
            <div class="muted" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.url}</div>
        </div>
        
        <div style="display:flex; gap:10px; align-items:center">
            <span class="tag-pill" style="background:${b.color||'#6366f1'}22; color:${b.color||'#6366f1'}">${b.category||'Geral'}</span>
            <button class="btn ghost danger" style="padding:6px" onclick="app.delBookmark('${b.id}')"><i class="ph ph-trash"></i></button>
        </div>
    </div>`;
};

// NOVA FUNÇÃO: Abre e Salva Histórico
app.openBookmark = (id) => {
    const b = app.state.bookmarks.find(x => x.id === id);
    if(b) {
        b.lastUsed = Date.now(); // Atualiza data
        app.saveState();
        window.open(b.url, '_blank');
    }
};

app.addBookmarkPrompt = () => {
    app.openModal(`
        <h3>Adicionar Bookmark</h3>
        <label class="muted" style="font-size:11px">URL</label>
        <input id="bmUrl" placeholder="https://..." style="margin-bottom:10px">
        <label class="muted" style="font-size:11px">Título</label>
        <input id="bmTitle" placeholder="Ex: Google" style="margin-bottom:10px">
        <div style="display:flex; gap:10px; margin-bottom:10px">
            <div style="flex:1">
                <label class="muted" style="font-size:11px">Pasta</label>
                <input id="bmCat" placeholder="Ex: Trabalho" list="catList">
                <datalist id="catList">${[...new Set(app.state.bookmarks.map(b=>b.category))].map(c=>`<option value="${c}">`).join('')}</datalist>
            </div>
            <div>
                <label class="muted" style="font-size:11px">Cor</label>
                <input type="color" id="bmColor" value="#a855f7" style="width:50px; padding:0; height:42px; background:none; border:none; display:block">
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn ghost" onclick="app.closeModal()">Cancelar</button>
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
        id: app.uid(), url, title: title || url, category: category || 'Geral', color,
        lastUsed: Date.now() // Já nasce com data para aparecer em recentes
    });
    app.saveState(); app.closeModal(); app.renderBookmarkList();
};

app.delBookmark = (id) => { 
    app.confirmModal('Remover?', ()=>{ 
        app.state.bookmarks = app.state.bookmarks.filter(x=>x.id!==id); 
        app.saveState(); app.renderBookmarkList(); 
    }); 
};
