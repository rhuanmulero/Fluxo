/**
 * Módulo de Notas (Com Editor Rich Text & Proteção contra Erros)
 * Arquivo: js/modules/notes.js
 */

let currentNoteId = null;
const NOTE_COLORS = {
    'default': { bg: '#1e293b', text: '#f8fafc' },
    'white': { bg: '#f8fafc', text: '#0f172a' },
    'yellow': { bg: '#fde68a', text: '#0f172a' },
    'blue': { bg: '#93c5fd', text: '#0f172a' },
    'green': { bg: '#6ee7b7', text: '#0f172a' },
    'pink': { bg: '#fbcfe8', text: '#0f172a' }
};

app.render_notes = (root) => {
    if(typeof app.noteSearch === 'undefined') app.noteSearch = "";

    // 1. LIMPEZA DE DADOS (Corrige o "undefined")
    app.state.notes = app.state.notes.map(n => ({
        ...n,
        title: n.title || 'Sem Título',
        body: n.body || '',
        color: n.color || 'default',
        updated: n.updated || new Date()
    }));

    app.state.notes.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    const hasNotes = app.state.notes.length > 0;

    const colorOptions = (selectedColor) => {
        return Object.keys(NOTE_COLORS).map(key => 
            `<option value="${key}" style="background-color: ${NOTE_COLORS[key].bg}; color: ${key === 'default' ? 'white' : 'black'};" ${key === selectedColor ? 'selected' : ''}>${key.charAt(0).toUpperCase() + key.slice(1)}</option>`
        ).join('');
    };

    root.innerHTML = `
        <div class="grid" style="height:calc(100vh - 140px)">
            <div class="col-4">
                <div class="card" style="height:100%; display:flex; flex-direction:column">
                    <button class="btn" style="width:100%; margin-bottom:12px" onclick="app.newNote()">+ Nova Nota</button>
                    <div style="margin-bottom:12px; position:relative;">
                        <input id="noteSearchInput" placeholder="Buscar notas..." value="${app.noteSearch}" style="padding-left:32px;">
                        <i class="ph ph-magnifying-glass" style="position:absolute; left:10px; top:10px; color:var(--text-muted)"></i>
                    </div>
                    <div id="notesList" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px"></div>
                </div>
            </div>

            <div class="col-8" id="rightPane">
                <div id="emptyState" style="height:100%; display:${hasNotes ? 'none' : 'flex'}; flex-direction:column; align-items:center; justify-content:center; opacity:0.5; border: 2px dashed var(--border); border-radius:var(--radius);">
                    <i class="ph ph-notebook" style="font-size:64px; margin-bottom:16px; color:var(--text-muted);"></i>
                    <div style="font-size:18px; font-weight:600;">Nenhuma nota selecionada</div>
                </div>

                <div class="card" id="noteBodyContainer" style="height:100%; display:${hasNotes ? 'flex' : 'none'}; flex-direction:column; background-color: ${NOTE_COLORS.default.bg}; color: ${NOTE_COLORS.default.text}; transition: background-color 0.3s;">
                    <div style="display:flex; gap:10px; margin-bottom:12px">
                        <input id="noteTitle" placeholder="Título da Nota" style="flex:1; background:transparent; border:none; border-bottom:1px solid var(--border); font-size:18px; font-weight:700; color:inherit;">
                        <select id="noteColor" onchange="app.changeNoteColor(this)" style="width:120px; background:transparent; border:1px solid var(--border); color:inherit; padding: 4px 8px; border-radius:6px; font-weight:500;">
                            ${colorOptions('default')}
                        </select>
                        <button class="btn danger ghost" id="delNoteBtn" title="Excluir Nota" onclick="app.delNote()" style="display:none"><i class="ph ph-trash"></i></button>
                    </div>

                    <!-- Toolbar -->
                    <div style="display:flex; gap:5px; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.1);">
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.formatDoc('bold')"><i class="ph ph-text-b"></i></button>
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.formatDoc('italic')"><i class="ph ph-text-italic"></i></button>
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.formatDoc('underline')"><i class="ph ph-text-underline"></i></button>
                        <div style="width:1px; background:var(--border); margin:0 5px;"></div>
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.formatDoc('insertUnorderedList')"><i class="ph ph-list-bullets"></i></button>
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.formatLink()"><i class="ph ph-link"></i></button>
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.formatDoc('removeFormat')"><i class="ph ph-eraser"></i></button>
                    </div>

                    <div id="noteBody" contenteditable="true" style="flex:1; background:transparent; border:none; outline:none; overflow-y:auto; font-family:'Inter'; line-height:1.6; font-size:15px; color:inherit; padding:5px;"></div>
                    <div style="text-align:right; margin-top:10px"><button class="btn" onclick="app.saveCurrentNote()">Salvar Nota</button></div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('noteSearchInput').onkeyup = (e) => {
        app.noteSearch = e.target.value.toLowerCase();
        app.renderNoteList();
    };

    app.renderNoteList();
    if (hasNotes) app.loadNote(app.state.notes[0].id);
};

app.renderNoteList = () => {
    const list = document.getElementById('notesList');
    if(!list) return;
    const filtered = app.state.notes.filter(n => (n.title.toLowerCase().includes(app.noteSearch)) || (n.body.toLowerCase().includes(app.noteSearch)));
    if(filtered.length === 0) { list.innerHTML = '<div class="muted text-center" style="margin-top:20px">Nada encontrado</div>'; return; }
    list.innerHTML = filtered.map(n => `
        <div onclick="app.loadNote('${n.id}')" style="padding:12px; border-radius:8px; background-color:${NOTE_COLORS[n.color]?.bg || NOTE_COLORS.default.bg}; color: ${NOTE_COLORS[n.color]?.text || NOTE_COLORS.default.text}; cursor:pointer; border:1px solid ${currentNoteId===n.id?'var(--primary)':'transparent'}; transition:all 0.2s">
            <div style="font-weight:600; font-size:14px">${n.title}</div>
            <div style="font-size:11px; margin-top:4px; opacity:0.7">${new Date(n.updated).toLocaleDateString()}</div>
        </div>
    `).join('');
};

app.changeNoteColor = (select) => {
    const color = NOTE_COLORS[select.value];
    const container = document.getElementById('noteBodyContainer');
    container.style.backgroundColor = color.bg;
    container.style.color = color.text;
    document.getElementById('noteTitle').style.color = color.text;
    document.getElementById('noteBody').style.color = color.text;
};

app.formatDoc = (cmd, value = null) => { document.execCommand(cmd, false, value); document.getElementById('noteBody').focus(); };
app.formatLink = () => { const url = prompt("URL:", "http://"); if (url) app.formatDoc('createLink', url); };

app.newNote = () => {
    currentNoteId = null;
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('noteBodyContainer').style.display = 'flex';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteBody').innerHTML = '';
    document.getElementById('delNoteBtn').style.display = 'none';
    const colorSel = document.getElementById('noteColor');
    colorSel.value = 'default';
    app.changeNoteColor(colorSel);
    app.renderNoteList();
};

app.loadNote = (id) => {
    currentNoteId = id;
    const n = app.state.notes.find(x=>x.id===id);
    if(!n) return;
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('noteBodyContainer').style.display = 'flex';
    
    // CORREÇÃO: Garante string vazia se for null/undefined
    document.getElementById('noteTitle').value = n.title || '';
    document.getElementById('noteBody').innerHTML = n.body || '';
    
    document.getElementById('delNoteBtn').style.display = 'block';
    const colorSel = document.getElementById('noteColor');
    colorSel.value = n.color || 'default';
    app.changeNoteColor(colorSel);
    app.renderNoteList();
};

app.saveCurrentNote = () => {
    const title = document.getElementById('noteTitle').value || 'Sem Título';
    const body = document.getElementById('noteBody').innerHTML || '';
    const color = document.getElementById('noteColor').value;
    
    let noteData = { title, body, updated: new Date(), color };
    
    if(!currentNoteId) {
        currentNoteId = app.uid();
        app.state.notes.unshift({ id:currentNoteId, ...noteData });
    } else {
        const n = app.state.notes.find(x=>x.id===currentNoteId);
        Object.assign(n, noteData);
        app.state.notes = app.state.notes.filter(x=>x.id!==currentNoteId);
        app.state.notes.unshift(n);
    }
    app.saveState();
    app.renderNoteList();
    app.toast('Nota salva!');
};

app.delNote = () => {
    if(!currentNoteId) return;
    app.confirmModal('Excluir nota?', () => {
        app.state.notes = app.state.notes.filter(x=>x.id !== currentNoteId);
        app.saveState();
        currentNoteId = null;
        if(app.state.notes.length > 0) app.loadNote(app.state.notes[0].id);
        else {
            document.getElementById('emptyState').style.display = 'flex';
            document.getElementById('noteBodyContainer').style.display = 'none';
        }
        app.renderNoteList();
    });
};
