// Gerador de ID
app.uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Toast Notification
app.toast = (msg, type='info') => {
    const el = document.createElement('div');
    el.className = 'toast';
    const icon = type === 'error' ? 'ph-warning' : 'ph-check-circle';
    const color = type === 'error' ? '#fca5a5' : '#86efac';
    el.innerHTML = `<i class="ph ${icon}" style="color:${color}; font-size:20px;"></i> <span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3500);
};

// Modais
app.openModal = (html) => {
    const m = document.getElementById('modal');
    document.getElementById('modalInner').innerHTML = html;
    m.classList.add('show');
};

app.closeModal = () => {
    document.getElementById('modal').classList.remove('show');
    setTimeout(() => document.getElementById('modalInner').innerHTML = '', 200);
};

app.confirmModal = (msg, onConfirm) => {
    app.openModal(`
        <h3>Confirmação</h3>
        <p class="muted" style="margin: 20px 0; font-size:15px">${msg}</p>
        <div class="modal-actions">
            <button class="btn ghost" onclick="app.closeModal()">Cancelar</button>
            <button class="btn" id="confirmBtn">Confirmar</button>
        </div>
    `);
    document.getElementById('confirmBtn').onclick = () => { onConfirm(); app.closeModal(); };
};

app.promptModal = (title, placeholder, onConfirm, initialValue = '') => {
    app.openModal(`
        <h3>${title}</h3>
        <input id="promptInput" placeholder="${placeholder}" value="${initialValue}" style="margin-top:10px">
        <div class="modal-actions">
            <button class="btn ghost" onclick="app.closeModal()">Cancelar</button>
            <button class="btn" id="promptBtn">Salvar</button>
        </div>
    `);
    setTimeout(() => document.getElementById('promptInput').focus(), 100);
    const submit = () => {
        const val = document.getElementById('promptInput').value;
        if(val) { onConfirm(val); app.closeModal(); }
    };
    document.getElementById('promptBtn').onclick = submit;
    document.getElementById('promptInput').onkeypress = (e) => { if(e.key === 'Enter') submit(); };
};

// Exportar e Importar
app.exportData = () => {
    const blob = new Blob([JSON.stringify(app.state)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fluxo_backup_v5.json`;
    a.click();
    app.toast('Backup exportado!');
};

app.importData = (input) => {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try { app.state = JSON.parse(e.target.result); app.saveState(); location.reload(); } 
        catch(err) { app.toast('Arquivo inválido', 'error'); }
    };
    reader.readAsText(file);
};

app.seedKanban = () => {
    const boardId = app.uid();
    app.state.boards = [{ id: boardId, title: 'Projeto Principal' }];
    app.state.cards = [
        { id: app.uid(), boardId, col: 'todo', title: 'Configurar FLUXO', desc: 'Conhecer todas as funcionalidades' }
    ];
    app.currentBoardId = boardId;
    app.saveState();
};