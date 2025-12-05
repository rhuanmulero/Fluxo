/**
 * Módulo Kanban (Completo com Detalhes de Tarefa)
 * Arquivo: js/modules/kanban.js
 */

app.render_kanban = (root) => {
    // Garante que existam colunas
    if(!app.state.kanbanCols || app.state.kanbanCols.length === 0) {
        app.state.kanbanCols = [
            {id:'todo', label:'A Fazer', color:'#6366f1'},
            {id:'doing', label:'Em Progresso', color:'#fbbf24'},
            {id:'done', label:'Concluído', color:'#34d399'}
        ];
    }
    
    // Inicializa boards se vazio
    if(!app.state.boards) app.state.boards = [{ id: app.uid(), title: 'Projeto Principal' }];
    if(!app.currentBoardId) app.currentBoardId = app.state.boards[0].id;

    root.innerHTML = `
        <div class="grid" style="height:100%; grid-template-rows: auto 1fr; gap:16px; display:flex; flex-direction:column">
            <!-- Header do Kanban -->
            <div class="col-12 card kanban-header-container" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px">
                <div class="kanban-header-controls" style="display:flex; gap:12px; align-items:center; flex:1">
                    <div style="display:flex; align-items:center; gap:10px; flex:1">
                        <i class="ph ph-projector-screen" style="font-size:20px; color:var(--primary)"></i>
                        <select id="boardSelect" style="flex:1; max-width:200px; background:rgba(0,0,0,0.2); border:1px solid var(--border); padding:6px 12px; border-radius:8px; color:white" onchange="app.switchBoard(this.value)">
                            ${app.state.boards.map(b => `<option value="${b.id}" ${b.id===app.currentBoardId?'selected':''}>${b.title}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="kanban-header-actions" style="display:flex; gap:10px; margin-left:10px">
                    <button class="btn ghost" onclick="app.addColumnPrompt()">+ Coluna</button>
                    <button class="btn ghost" onclick="app.createBoard()">+ Novo Board</button>
                    <button class="btn danger ghost" style="padding:6px 10px" onclick="app.deleteBoard()"><i class="ph ph-trash"></i></button>
                </div>
            </div>
            
            <!-- Área dos Cards -->
            <div id="kanbanArea" class="kanban-board" style="flex:1; gap: 16px;"></div>
        </div>
    `;
    
    app.renderBoardColumns();
};

app.switchBoard = (id) => {
    app.currentBoardId = id;
    app.saveState();
    app.render_kanban(document.getElementById('content'));
};

app.renderBoardColumns = () => {
    const area = document.getElementById('kanbanArea');
    if(!area) return;
    
    area.innerHTML = app.state.kanbanCols.map(c => {
        const cards = app.state.cards.filter(x => x.col === c.id && x.boardId === app.currentBoardId);
        
        // Calcula total de horas da coluna
        const totalHours = cards.reduce((acc, card) => acc + (parseFloat(card.estimate) || 0), 0);

        return `
        <div class="kanban-col" ondragover="event.preventDefault()" ondrop="app.dropCard(event, '${c.id}')" style="min-width:300px; display:flex; flex-direction:column;">
            <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid ${c.color}; padding-bottom:8px;">
                <div style="font-weight:700; color:var(--text-main)">
                    ${c.label} 
                    <span class="muted" style="font-size:11px; margin-left:5px">(${cards.length})</span>
                </div>
                <div style="font-size:10px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;" title="Total de Horas Estimadas">
                    ${totalHours}h
                </div>
            </div>
            
            <div style="flex:1; overflow-y:auto; padding-right:4px; display:flex; flex-direction:column; gap:10px;">
                ${cards.map(card => app.createCardHTML(card, c.color)).join('')}
            </div>
            
            <button class="btn ghost" style="width:100%; margin-top:8px; border-style:dashed; opacity:0.6" onclick="app.addCardPrompt('${c.id}')">+ Card</button>
        </div>
    `}).join('');
};

app.createCardHTML = (card, color) => {
    let deadlineHtml = '';
    if(card.deadline) {
        const diff = Math.ceil((new Date(card.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        let dColor = diff < 0 ? '#ef4444' : (diff <= 3 ? '#f59e0b' : '#94a3b8');
        deadlineHtml = `<span style="color:${dColor}; font-size:11px; display:flex; align-items:center; gap:4px"><i class="ph ph-flag"></i> ${new Date(card.deadline).toLocaleDateString('pt-BR').slice(0,5)}</span>`;
    }

    const priorityBadge = card.priority ? `<span class="tag-pill" style="font-size:9px">${card.priority}</span>` : '';
    const respBadge = card.responsible ? `<span class="muted" style="font-size:10px">👤 ${card.responsible}</span>` : '';

    return `
    <div class="kanban-card" draggable="true" ondragstart="app.dragCard(event, '${card.id}')" onclick="app.openCardDetails('${card.id}')">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px">
            <div style="font-weight:600; font-size:14px; line-height:1.3">${card.title}</div>
            ${deadlineHtml}
        </div>
        
        <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px">
            ${priorityBadge}
            ${respBadge}
        </div>

        ${card.desc ? `<div class="muted" style="font-size:11px; line-height:1.4; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${card.desc}</div>` : ''}
        
        <div style="display:flex; align-items:center; gap:8px; margin-top:auto">
            <div style="flex:1; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden">
                <div style="width:${card.progress||0}%; height:100%; background:${color};"></div>
            </div>
            <span style="font-size:10px; font-weight:bold; color:var(--text-muted)">${card.estimate ? card.estimate + 'h' : ''}</span>
        </div>
    </div>`;
};

// --- MODAL DE EDIÇÃO COMPLETO ---

app.openCardDetails = (id) => {
    const card = app.state.cards.find(c => c.id === id);
    if(!card) return;
    
    const colOptions = app.state.kanbanCols.map(c => `<option value="${c.id}" ${card.col===c.id?'selected':''}>${c.label}</option>`).join('');
    
    // HTML do Modal Rico
    const modalHtml = `
        <div style="display:flex; flex-direction:column; gap:15px;">
            <h3 style="margin:0; border-bottom:1px solid var(--border); padding-bottom:10px;">Editar Card</h3>
            
            <!-- Título -->
            <div>
                <label class="muted" style="font-size:11px; font-weight:700">TÍTULO</label>
                <input id="cTitle" value="${card.title}" style="font-size:16px; font-weight:600">
            </div>

            <!-- Linha 1: Coluna e Prioridade -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div>
                    <label class="muted" style="font-size:11px; font-weight:700">COLUNA (STATUS)</label>
                    <select id="cCol" style="width:100%">${colOptions}</select>
                </div>
                <div>
                    <label class="muted" style="font-size:11px; font-weight:700">PRIORIDADE</label>
                    <select id="cPrio" style="width:100%">
                        <option value="Baixa" ${card.priority==='Baixa'?'selected':''}>Baixa</option>
                        <option value="Média" ${card.priority==='Média'?'selected':''}>Média</option>
                        <option value="Alta" ${card.priority==='Alta'?'selected':''}>Alta</option>
                        <option value="Urgente" ${card.priority==='Urgente'?'selected':''}>Urgente</option>
                    </select>
                </div>
            </div>

            <!-- Linha 2: Responsável e Estimativa -->
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:15px;">
                <div>
                    <label class="muted" style="font-size:11px; font-weight:700">RESPONSÁVEL</label>
                    <input id="cResp" value="${card.responsible||''}" placeholder="Quem vai fazer?">
                </div>
                <div>
                    <label class="muted" style="font-size:11px; font-weight:700">ESTIMATIVA (HORAS)</label>
                    <input id="cEst" type="number" min="0" step="0.5" value="${card.estimate||''}" placeholder="Ex: 2.5">
                </div>
            </div>

            <!-- Linha 3: Prazo e Progresso -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div>
                    <label class="muted" style="font-size:11px; font-weight:700">PRAZO</label>
                    <input id="cDead" type="date" value="${card.deadline||''}">
                </div>
                <div>
                    <label class="muted" style="font-size:11px; font-weight:700">PROGRESSO (%)</label>
                    <input id="cProg" type="number" min="0" max="100" value="${card.progress||0}">
                </div>
            </div>

            <!-- Descrição -->
            <div>
                <label class="muted" style="font-size:11px; font-weight:700">DETALHES / DESCRIÇÃO</label>
                <textarea id="cDesc" style="height:100px; resize:vertical; font-family:inherit">${card.desc||''}</textarea>
            </div>

            <div class="modal-actions" style="border-top:1px solid var(--border); padding-top:15px; margin-top:5px;">
                <button class="btn ghost danger" onclick="app.deleteCard('${card.id}')">Excluir</button>
                <div style="flex:1"></div>
                <button class="btn ghost" onclick="app.closeModal()">Cancelar</button>
                <button class="btn" onclick="app.saveCardDetails('${card.id}')">Salvar Alterações</button>
            </div>
        </div>
    `;
    
    app.openModal(modalHtml);
};

app.saveCardDetails = (id) => {
    const card = app.state.cards.find(c => c.id === id);
    if(card) {
        card.title = document.getElementById('cTitle').value;
        card.col = document.getElementById('cCol').value;
        card.priority = document.getElementById('cPrio').value;
        card.responsible = document.getElementById('cResp').value;
        
        // Garante que estimativa seja salva como número (float para aceitar 1.5h)
        const estVal = document.getElementById('cEst').value;
        card.estimate = estVal ? parseFloat(estVal) : '';
        
        card.deadline = document.getElementById('cDead').value;
        card.progress = parseInt(document.getElementById('cProg').value) || 0;
        card.desc = document.getElementById('cDesc').value;

        // Auto-completa se for para a última coluna
        const lastColId = app.state.kanbanCols[app.state.kanbanCols.length-1].id;
        if(card.col === lastColId && card.progress < 100) card.progress = 100;

        // Sincronia com Agenda
        if(card.deadline && app.syncToCalendar) {
            app.syncToCalendar(card.id, `[Card] ${card.title}`, card.deadline, 'deadline');
        }

        app.saveState();
        app.closeModal();
        app.render_kanban(document.getElementById('content'));
        app.toast("Card atualizado!");
    }
};

app.deleteCard = (id) => {
    app.confirmModal('Tem certeza que deseja excluir este card?', () => {
        const card = app.state.cards.find(c => c.id === id);
        // Remove da agenda também
        if(app.syncToCalendar) app.syncToCalendar(id, null, null);
        
        app.state.cards = app.state.cards.filter(c => c.id !== id);
        app.saveState();
        app.closeModal();
        app.render_kanban(document.getElementById('content'));
    });
};

// --- DRAG AND DROP & COLUNAS ---

app.dragCard = (ev, id) => ev.dataTransfer.setData('cardId', id);

app.dropCard = (ev, colId) => {
    const id = ev.dataTransfer.getData('cardId');
    const card = app.state.cards.find(x=>x.id===id);
    if(card && card.col !== colId) { 
        card.col = colId;
        const lastColId = app.state.kanbanCols[app.state.kanbanCols.length-1].id;
        if(colId === lastColId) card.progress = 100;
        app.saveState(); 
        app.render_kanban(document.getElementById('content'));
    }
};

app.addCardPrompt = (colId) => {
    app.promptModal('Novo Card', 'Título da tarefa', (val) => {
        app.state.cards.push({ 
            id: app.uid(), 
            boardId: app.currentBoardId, 
            col: colId, 
            title: val, 
            priority: 'Média',
            progress: 0 
        });
        app.saveState(); 
        app.render_kanban(document.getElementById('content'));
    });
};

app.createBoard = () => {
    app.promptModal('Novo Projeto', 'Nome do Board', (name) => {
        const id = app.uid();
        app.state.boards.push({ id, title: name });
        app.currentBoardId = id;
        app.saveState(); 
        app.render_kanban(document.getElementById('content'));
    });
};

app.deleteBoard = () => {
    if(app.state.boards.length <= 1) return app.toast("Mínimo 1 board.", "error");
    app.confirmModal('Excluir este Board e todos os cards?', () => {
        app.state.cards = app.state.cards.filter(c => c.boardId !== app.currentBoardId);
        app.state.boards = app.state.boards.filter(b => b.id !== app.currentBoardId);
        app.currentBoardId = app.state.boards[0].id;
        app.saveState();
        app.render_kanban(document.getElementById('content'));
    });
};

app.addColumnPrompt = () => {
    app.promptModal('Nova Coluna', 'Nome', (val) => {
        app.state.kanbanCols.push({ id: app.uid(), label: val, color: '#94a3b8' });
        app.saveState();
        app.render_kanban(document.getElementById('content'));
    });
};