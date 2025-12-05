/**
 * Módulo Snippets (Código Oculto + Pastas)
 */

app.render_snippets = (root) => {
    if(typeof app.snipSearch === 'undefined') app.snipSearch = "";
    
    const filtered = app.state.snippets.filter(s => 
        s.title.toLowerCase().includes(app.snipSearch.toLowerCase()) || 
        s.lang.toLowerCase().includes(app.snipSearch.toLowerCase())
    );

    const groups = {};
    filtered.forEach(s => {
        const key = s.lang || 'Geral';
        if(!groups[key]) groups[key] = [];
        groups[key].push(s);
    });

    root.innerHTML = `
        <div class="grid">
            <div class="col-4 card">
                <h3>Novo Snippet</h3>
                <input id="sTitle" placeholder="Título" style="margin-bottom:10px">
                <input id="sLang" placeholder="Pasta / Linguagem" list="langList" style="margin-bottom:10px">
                <datalist id="langList">${[...new Set(app.state.snippets.map(s=>s.lang))].map(l=>`<option value="${l}">`).join('')}</datalist>
                <textarea id="sCode" style="height:200px; font-family:monospace; font-size:12px; margin-bottom:10px" placeholder="Código..."></textarea>
                <button class="btn" onclick="app.addSnippet()">Salvar</button>
            </div>

            <div class="col-8">
                <input placeholder="Buscar..." value="${app.snipSearch}" oninput="app.snipSearch=this.value; app.render_snippets(document.getElementById('content'))" style="margin-bottom:20px">
                
                <div id="snipContainer">
                    ${Object.keys(groups).sort().map(lang => `
                        <div style="margin-bottom:15px;">
                            <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:10px" 
                                 onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display==='none'?'block':'none'">
                                <i class="ph ph-folder-open" style="color:var(--accent)"></i> ${lang} 
                                <span class="tag-pill">${groups[lang].length}</span>
                            </div>
                            
                            <div style="margin-top:10px; padding-left:10px;">
                                ${groups[lang].map(s => `
                                    <div class="card" style="margin-bottom:10px; border-left:3px solid var(--primary)">
                                        <div style="display:flex; justify-content:space-between; margin-bottom:5px; align-items:center">
                                            <b>${s.title}</b>
                                            <div style="display:flex; gap:5px">
                                                <button class="btn ghost" id="btn-txt-${s.id}" onclick="app.toggleSnip('${s.id}')" style="font-size:11px">
                                                    <i class="ph ph-eye"></i> Ver Código
                                                </button>
                                                <button class="btn ghost" title="Copiar" onclick="app.copySnip('${s.id}')"><i class="ph ph-copy"></i></button>
                                                <button class="btn ghost danger" onclick="app.delSnippet('${s.id}')"><i class="ph ph-trash"></i></button>
                                            </div>
                                        </div>
                                        <div id="code-${s.id}" style="display:none; margin-top:10px;">
                                            <pre style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; overflow:auto; font-size:11px; max-height:300px">${s.code.replace(/</g,'&lt;')}</pre>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

app.toggleSnip = (id) => {
    const el = document.getElementById(`code-${id}`);
    const btn = document.getElementById(`btn-txt-${id}`);
    if (el.style.display === 'none') {
        el.style.display = 'block';
        btn.innerHTML = '<i class="ph ph-eye-slash"></i> Esconder';
    } else {
        el.style.display = 'none';
        btn.innerHTML = '<i class="ph ph-eye"></i> Ver Código';
    }
};

app.addSnippet = () => {
    const title = document.getElementById('sTitle').value;
    const lang = document.getElementById('sLang').value || 'Geral';
    const code = document.getElementById('sCode').value;
    if(title && code) {
        app.state.snippets.push({ id: app.uid(), title, lang, code });
        app.saveState();
        app.render_snippets(document.getElementById('content'));
        app.toast("Snippet Salvo");
    }
};

app.copySnip = (id) => {
    const s = app.state.snippets.find(x => x.id === id);
    navigator.clipboard.writeText(s.code);
    app.toast("Copiado!");
};

app.delSnippet = (id) => {
    app.confirmModal("Apagar snippet?", () => {
        app.state.snippets = app.state.snippets.filter(s => s.id !== id);
        app.saveState();
        app.render_snippets(document.getElementById('content'));
    });
};
