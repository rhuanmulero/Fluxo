/**
 * Módulo de Snippets (Códigos)
 */

app.render_snippets = (root) => {
    // Estado local para busca armazenado no app para persistir
    if (typeof app.snippetSearch === 'undefined') app.snippetSearch = "";

    root.innerHTML = `
        <div class="grid">
            <div class="col-4 card">
                <h3>Novo Snippet</h3>
                <input id="snipTitle" placeholder="Nome (ex: Fetch API)" style="margin-bottom:8px">
                <select id="snipLang" style="margin-bottom:8px"><option>JavaScript</option><option>CSS</option><option>HTML</option><option>SQL</option><option>Python</option></select>
                <textarea id="snipCode" style="height:150px; margin-bottom:12px; font-family:monospace" placeholder="Cole seu código aqui..."></textarea>
                <button class="btn" onclick="app.addSnippet()">Salvar Snippet</button>
            </div>
            
            <div class="col-8">
                <div class="card" style="margin-bottom: 16px; padding: 12px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <i class="ph ph-magnifying-glass" style="color:var(--text-muted)"></i>
                        <input type="text" id="searchSnipInput" placeholder="Buscar snippets..." value="${app.snippetSearch}" style="border:none; background:transparent; padding:0;">
                    </div>
                </div>

                <div id="snipList" style="display:flex; flex-direction:column; gap:12px"></div>
            </div>
        </div>
    `;

    // Listener de busca
    document.getElementById('searchSnipInput').onkeyup = (e) => {
        app.snippetSearch = e.target.value.toLowerCase();
        app.renderSnippetList();
    };

    app.renderSnippetList();
};

app.renderSnippetList = () => {
    const listEl = document.getElementById('snipList');
    if(!listEl) return;

    const filtered = app.state.snippets.filter(s => 
        s.title.toLowerCase().includes(app.snippetSearch) || 
        s.lang.toLowerCase().includes(app.snippetSearch)
    );

    listEl.innerHTML = filtered.length ? filtered.map(s => `
        <div class="card" style="padding: 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; background:rgba(99,102,241,0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--primary); font-size:10px;">${s.lang.substring(0,3).toUpperCase()}</div>
                    <div>
                        <div style="font-weight:600; font-size:15px;">${s.title}</div>
                        <div class="muted" style="font-size:12px;">${s.lang}</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn ghost" onclick="app.toggleSnippetCode('${s.id}')">
                        <i class="ph ph-code"></i> Ver Código
                    </button>
                    <button class="btn ghost danger" style="padding:8px" onclick="app.delSnippet('${s.id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            
            <div id="code-${s.id}" style="display:none; margin-top:16px; animation: fadeIn 0.3s;">
                <div style="position:relative;">
                    <pre style="background:#0f172a; padding:16px; border-radius:8px; overflow-x:auto; font-family:'Fira Code', monospace; color:#cbd5e1; font-size:13px; border:1px solid var(--border);">${s.code.replace(/</g,'&lt;')}</pre>
                    <button class="btn ghost" style="position:absolute; top:8px; right:8px; font-size:11px; background:rgba(0,0,0,0.5); color:white;" 
                            onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(s.code)}')); app.toast('Código copiado!')">
                        <i class="ph ph-copy"></i> Copiar
                    </button>
                </div>
            </div>
        </div>
    `).join('') : '<div class="muted text-center" style="margin-top:20px">Nenhum snippet encontrado.</div>';
};

app.addSnippet = () => {
    const title = document.getElementById('snipTitle').value;
    const code = document.getElementById('snipCode').value;
    const lang = document.getElementById('snipLang').value;
    if(title && code) { 
        app.state.snippets.unshift({ id: app.uid(), title, code, lang }); 
        app.saveState(); 
        app.snippetSearch = ""; 
        
        // Re-renderiza a lista ou a view toda
        if(app.currentTab === 'snippets') app.render_snippets(document.getElementById('content'));
        
        app.toast('Snippet salvo!');
    }
};

app.delSnippet = (id) => { 
    app.confirmModal('Apagar snippet?', ()=>{ 
        app.state.snippets = app.state.snippets.filter(x=>x.id!==id); 
        app.saveState(); 
        app.renderSnippetList(); 
    }); 
};

app.toggleSnippetCode = (id) => {
    const el = document.getElementById(`code-${id}`);
    if(el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
};