/**
 * Módulo de Notas (Formatado & Integrado)
 */
let currentNoteId = null;
const NOTE_COLORS = {
    'default': { border: '#334155', bg: 'transparent' },
    'red':     { border: '#ef4444', bg: 'rgba(239,68,68,0.05)' },
    'orange':  { border: '#f97316', bg: 'rgba(249,115,22,0.05)' },
    'green':   { border: '#22c55e', bg: 'rgba(34,197,94,0.05)' },
    'blue':    { border: '#3b82f6', bg: 'rgba(59,130,246,0.05)' },
    'purple':  { border: '#a855f7', bg: 'rgba(168,85,247,0.05)' }
};

app.render_notes = (root) => {
    if(typeof app.noteSearch === 'undefined') app.noteSearch = "";
    
    root.innerHTML = `
        <div class="grid" style="height:calc(100vh - 140px)">
            <div class="col-4">
                <div class="card" style="height:100%; display:flex; flex-direction:column">
                    <button class="btn" style="width:100%; margin-bottom:10px" onclick="app.newNote()">+ Nova Nota</button>
                    <input placeholder="Buscar..." value="${app.noteSearch}" onkeyup="app.filterNotes(this.value)" style="margin-bottom:10px">
                    <div id="notesList" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px"></div>
                </div>
            </div>

            <div class="col-8">
                <div id="emptyNote" style="height:100%; display:flex; align-items:center; justify-content:center; opacity:0.3; border:2px dashed var(--border)">
                    <i class="ph ph-notebook" style="font-size:64px"></i>
                </div>

                <div id="noteEditor" class="card" style="height:100%; display:none; flex-direction:column; padding:0; overflow:hidden">
                    <div id="nHeader" style="padding:15px; border-bottom:1px solid var(--border); transition:0.3s">
                        <input id="nTitle" placeholder="Título da Nota" style="background:transparent; border:none; font-size:18px; font-weight:700; width:100%; color:inherit">
                        
                        <div style="display:flex; gap:8px; margin-top:10px; align-items:center;">
                            <div style="display:flex; gap:2px">
                                ${Object.keys(NOTE_COLORS).map(c => `
                                    <div onclick="app.setNoteColor('${c}')" style="width:20px; height:20px; border-radius:50%; background:${NOTE_COLORS[c].border}; cursor:pointer; border:1px solid rgba(255,255,255,0.2)"></div>
                                `).join('')}
                            </div>
                            <div style="flex:1"></div>
                            
                            <button class="btn ghost" onclick="app.addLink()" title="Adicionar Link"><i class="ph ph-link"></i></button>
                            <button class="btn ghost" onclick="app.noteToVault()" title="Salvar no Vault"><i class="ph ph-safe"></i> Vault</button>
                            <button class="btn ghost" onclick="app.noteToDocx()" title="Baixar DOCX"><i class="ph ph-file-doc"></i></button>
                            <button class="btn ghost danger" onclick="app.delNote()"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>

                    <div style="padding:8px 15px; background:rgba(0,0,0,0.2); border-bottom:1px solid var(--border); display:flex; gap:5px; align-items:center">
                        <button class="btn ghost sm" onclick="document.execCommand('bold')"><b>B</b></button>
                        <button class="btn ghost sm" onclick="document.execCommand('italic')"><i>I</i></button>
                        <button class="btn ghost sm" onclick="document.execCommand('underline')"><u>U</u></button>
                        <div style="width:1px; background:var(--border); height:20px; margin:0 5px"></div>
                        <button class="btn ghost sm" onclick="document.execCommand('justifyLeft')"><i class="ph ph-text-align-left"></i></button>
                        <button class="btn ghost sm" onclick="document.execCommand('justifyCenter')"><i class="ph ph-text-align-center"></i></button>
                        <button class="btn ghost sm" onclick="document.execCommand('justifyRight')"><i class="ph ph-text-align-right"></i></button>
                        <div style="width:1px; background:var(--border); height:20px; margin:0 5px"></div>
                        <button class="btn ghost sm" onclick="document.execCommand('insertUnorderedList')"><i class="ph ph-list-bullets"></i></button>
                        <button class="btn ghost sm" onclick="document.execCommand('insertOrderedList')"><i class="ph ph-list-numbers"></i></button>
                    </div>

                    <div id="nBody" contenteditable="true" style="flex:1; padding:30px; outline:none; overflow-y:auto; line-height:1.6; font-size:15px;"></div>
                    
                    <div style="padding:10px; text-align:right; border-top:1px solid var(--border)">
                        <button class="btn" onclick="app.saveNote()">Salvar</button>
                    </div>
                </div>
            </div>
        </div>
        <style>.btn.sm { padding: 4px 8px; }</style>
    `;
    app.renderNoteList();
};

app.renderNoteList = () => {
    const list = document.getElementById('notesList');
    if(!list) return;
    const term = app.noteSearch.toLowerCase();
    list.innerHTML = app.state.notes
        .filter(n => n.title.toLowerCase().includes(term) || n.body.toLowerCase().includes(term))
        .map(n => {
            const style = NOTE_COLORS[n.color || 'default'];
            return `<div onclick="app.loadNote('${n.id}')" style="padding:12px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border); border-left:4px solid ${style.border}; cursor:pointer">
                <div style="font-weight:600">${n.title}</div>
                <div class="muted" style="font-size:10px">${new Date(n.updated).toLocaleDateString()}</div>
            </div>`;
        }).join('');
};

app.filterNotes = (val) => { app.noteSearch = val; app.renderNoteList(); };

app.newNote = () => {
    currentNoteId = null;
    document.getElementById('emptyNote').style.display = 'none';
    document.getElementById('noteEditor').style.display = 'flex';
    document.getElementById('nTitle').value = '';
    document.getElementById('nBody').innerHTML = '';
    app.setNoteColor('default');
};

app.loadNote = (id) => {
    currentNoteId = id;
    const n = app.state.notes.find(x => x.id === id);
    if(!n) return;
    document.getElementById('emptyNote').style.display = 'none';
    document.getElementById('noteEditor').style.display = 'flex';
    document.getElementById('nTitle').value = n.title;
    document.getElementById('nBody').innerHTML = n.body;
    app.setNoteColor(n.color || 'default');
};

app.setNoteColor = (color) => {
    const style = NOTE_COLORS[color];
    const header = document.getElementById('nHeader');
    header.style.borderColor = style.border;
    header.style.backgroundColor = style.bg;
    header.dataset.color = color;
};

app.addLink = () => {
    const url = prompt("Insira a URL:", "https://");
    if(url) document.execCommand('createLink', false, url);
};

app.saveNote = () => {
    const title = document.getElementById('nTitle').value || 'Sem Título';
    const body = document.getElementById('nBody').innerHTML;
    const color = document.getElementById('nHeader').dataset.color || 'default';
    const data = { title, body, color, updated: new Date() };
    
    if(!currentNoteId) {
        currentNoteId = app.uid();
        app.state.notes.unshift({ id: currentNoteId, ...data });
    } else {
        const i = app.state.notes.findIndex(x => x.id === currentNoteId);
        if(i !== -1) app.state.notes[i] = { id: currentNoteId, ...data };
    }
    app.saveState();
    app.renderNoteList();
    app.toast("Nota Salva");
};

app.delNote = () => {
    if(!currentNoteId) return;
    app.confirmModal("Excluir nota?", () => {
        app.state.notes = app.state.notes.filter(x => x.id !== currentNoteId);
        app.saveState();
        app.render_notes(document.getElementById('content'));
    });
};

app.noteToDocx = () => {
    const title = document.getElementById('nTitle').value;
    const body = document.getElementById('nBody').innerHTML;
    // HTML Limpo para o Word
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    a.click();
};

app.noteToVault = () => {
    const title = document.getElementById('nTitle').value;
    const body = document.getElementById('nBody').innerText;
    const blob = new Blob([body], { type: 'text/plain' });
    const reader = new FileReader();
    reader.onload = (e) => {
        app.state.docs.push({
            id: app.uid(), name: `${title}.txt`, data: e.target.result, size: (blob.size/1024).toFixed(1), folder: 'Notas', type: 'file'
        });
        app.saveState();
        app.toast("Salvo no Vault!");
    };
    reader.readAsDataURL(blob);
};
