/**
 * Módulo de Tarefas (Tasks - Com Estimativa Numérica)
 * Arquivo: js/modules/tasks.js
 */

app.render_tasks = (root) => {
    const PRIORITY_COLORS = { 'Alta': '#ef4444', 'Média': '#f59e0b', 'Baixa': '#10b981' };
    const PRIORITY_MAP = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };

    if (!app.state.taskFilters) {
        app.state.taskFilters = { searchTerm: '', sortBy: 'priority_desc' };
    }
    
    // --- RENDER LIST ---
    const renderList = () => {
        const filters = app.state.taskFilters;
        const term = (filters.searchTerm || '').toLowerCase();
        const [sortBy, sortOrder] = (filters.sortBy || 'priority_desc').split('_');

        let filteredTasks = (app.state.tasks || []).filter(t => 
            (t.title && t.title.toLowerCase().includes(term)) ||
            (t.responsible && t.responsible.toLowerCase().includes(term))
        );
        
        filteredTasks.sort((a, b) => {
            if (a.done && !b.done) return 1;
            if (!a.done && b.done) return -1;
            if (a.done && b.done) return 0;

            let result = 0;
            if (sortBy === 'priority') {
                const valA = PRIORITY_MAP[a.priority] || 0;
                const valB = PRIORITY_MAP[b.priority] || 0;
                result = valA - valB;
            } else if (sortBy === 'deadline') {
                const big = 8640000000000000;
                const valA = a.deadline ? new Date(a.deadline).getTime() : big;
                const valB = b.deadline ? new Date(b.deadline).getTime() : big;
                result = valA - valB;
            }
            return sortOrder === 'asc' ? result : -result;
        });

        const list = document.getElementById('taskList');
        if (!list) return;

        if (filteredTasks.length === 0) {
            list.innerHTML = '<div class="muted text-center" style="padding:20px">Nenhuma tarefa encontrada.</div>';
            return;
        }

        list.innerHTML = filteredTasks.map(t => {
            let deadlineHtml = '';
            if(t.deadline) {
                const diff = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                let color = diff < 0 ? '#ef4444' : (diff <= 3 ? '#f59e0b' : '#94a3b8');
                const dateStr = new Date(t.deadline).toLocaleDateString('pt-BR').slice(0,5);
                deadlineHtml = `<span style="font-size:10px; color:${color}; border:1px solid ${color}; padding:1px 5px; border-radius:4px; display:flex; align-items:center; gap:3px"><i class="ph ph-flag"></i> ${dateStr}</span>`;
            }

            const boardName = t.boardId ? (app.state.boards.find(b=>b.id===t.boardId)?.title) : null;
            const projectTag = boardName ? `<span class="tag-pill" style="background:rgba(99,102,241,0.2); color:#a5b4fc"><i class="ph ph-squares-four" style="font-size:10px"></i> ${boardName}</span>` : '';

            const kanbanBtn = t.inKanban 
                ? `<button class="btn ghost" style="padding:6px 10px; opacity:0.3; cursor:not-allowed" title="Já está no Kanban"><i class="ph ph-kanban"></i></button>`
                : `<button class="btn ghost" style="padding:6px 10px" title="Enviar para o Board do Projeto" onclick="app.copyToKanban('${t.id}')"><i class="ph ph-arrow-fat-right"></i></button>`;

            // Visual da Estimativa (Adiciona o 'h' se tiver valor)
            const estimateHtml = t.estimate ? `<small class="muted" style="font-weight:700; color:var(--text-main); margin-left:5px;">⏱ ${t.estimate}h</small>` : '';

            return `
            <div class="card" style="margin-bottom:8px; padding:12px; border-left: 3px solid ${PRIORITY_COLORS[t.priority]||'#94a3b8'}; opacity:${t.done?0.5:1}; transition:opacity 0.3s">
                <div style="display:flex; gap:12px; align-items:flex-start">
                    <div onclick="app.toggleTask('${t.id}')" style="cursor:pointer; margin-top:2px; width:20px; height:20px; border-radius:6px; border:2px solid ${t.done?'#34d399':'#6366f1'}; background:${t.done?'#34d399':'transparent'}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        ${t.done ? '<i class="ph ph-check" style="color:#0f172a; font-size:12px"></i>' : ''}
                    </div>
                    <div style="flex:1; overflow:hidden;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                            <span style="font-weight:500; text-decoration:${t.done?'line-through':''}">${t.title}</span>
                            ${estimateHtml}
                        </div>
                        
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:6px">
                            ${deadlineHtml}
                            ${projectTag}
                            <span class="tag-pill">${t.priority}</span>
                            ${t.type ? `<span class="tag-pill">${t.type}</span>` : ''}
                            ${t.responsible ? `<span class="muted" style="font-size:10px">👤 ${t.responsible}</span>` : ''}
                        </div>

                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="flex:1; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden">
                                <div style="width:${t.progress||0}%; height:100%; background:${t.done?'#34d399':'var(--primary)'}"></div>
                            </div>
                            <span style="font-size:10px" class="muted">${t.progress||0}%</span>
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:4px">
                        ${kanbanBtn}
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.editTaskPrompt('${t.id}')"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn danger ghost" style="padding:4px 8px" onclick="app.delTask('${t.id}')"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    // UI Input
    root.innerHTML = `
        <div class="grid">
            <div class="col-12 card task-input-wrapper" style="display:flex; flex-direction:column; gap:10px">
                <div class="task-row-1" style="display:flex; gap:10px">
                    <input id="newTask" placeholder="Título da nova tarefa..." style="flex:2">
                    <select id="newBoard" style="flex:1; color:var(--accent); font-weight:600">
                        <option value="">Selecionar Projeto...</option>
                        ${(app.state.boards||[]).map(b => `<option value="${b.id}">${b.title}</option>`).join('')}
                    </select>
                </div>
                
                <div class="task-row-2" style="display:flex; gap:10px; align-items:center;">
                    <input id="newDate" type="date" style="flex:1">
                    <!-- INPUT NUMÉRICO DE HORAS -->  
                    <input id="newEst" type="number" step="0.5" min="0" placeholder="Horas (h)" style="width:100px" title="Estimativa em horas">
  
                    <select id="newRecur" style="width:100px; border-color:var(--accent); color:var(--accent)">
                    <option value="">Única</option>
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    </select>

                    <!-- ...inputs de responsável... -->
                    <input id="newResp" placeholder="Resp." style="flex:1">
                    <select id="newType" style="flex:1"><option value="">Tipo...</option><option>Feature</option><option>Bug</option><option>Conteúdo</option><option>Admin</option></select>
                    <select id="newPrio" style="width:100px"><option>Baixa</option><option selected>Média</option><option>Alta</option></select>
                    <button id="addT" class="btn">Add</button>
                </div>
            </div>
            
            <div class="col-12 card" style="margin-top: 15px; padding: 12px; display:flex; gap:10px; align-items:center;">
                <i class="ph ph-magnifying-glass" style="font-size: 20px; color: var(--text-muted)"></i>
                <input id="taskSearchInput" placeholder="Buscar..." style="flex:1;" value="${app.state.taskFilters.searchTerm}">
                <select id="taskSortSelect" style="width: 180px;">
                    <option value="priority_desc" ${app.state.taskFilters.sortBy === 'priority_desc' ? 'selected' : ''}>Prioridade (Alta)</option>
                    <option value="deadline_asc" ${app.state.taskFilters.sortBy === 'deadline_asc' ? 'selected' : ''}>Prazo (Mais Perto)</option>
                </select>
            </div>
            
            <div class="col-12" id="taskList"></div>
        </div>
    `;

    // Eventos
    const taskSearchInput = document.getElementById('taskSearchInput');
    const taskSortSelect = document.getElementById('taskSortSelect');
    
    const applyFilterAndSort = () => {
        app.state.taskFilters.searchTerm = taskSearchInput.value;
        app.state.taskFilters.sortBy = taskSortSelect.value;
        app.saveState();
        renderList();
    };

    taskSearchInput.oninput = applyFilterAndSort;
    taskSortSelect.onchange = applyFilterAndSort;
    
    // Evento de Clique no Botão "Add"
    document.getElementById('addT').onclick = () => {
        const title = document.getElementById('newTask').value;
        const boardId = document.getElementById('newBoard').value;
        
        if(!title) return app.toast("O título é obrigatório", "error");
        
        // Validação opcional de projeto (pode remover se quiser permitir tarefas sem projeto)
        if(!boardId && app.state.boards && app.state.boards.length > 0) {
            app.toast('Selecione um Projeto.', 'error');
            return;
        }

        // Pega estimativa como número
        const estVal = document.getElementById('newEst').value;
        const estimate = estVal ? parseFloat(estVal) : '';

        const newTask = { 
            id: app.uid(), 
            title, 
            boardId,
            deadline: document.getElementById('newDate').value,
            estimate: estimate, 
            responsible: document.getElementById('newResp').value,
            type: document.getElementById('newType').value,
            priority: document.getElementById('newPrio').value,
            
            // --- NOVA PROPRIEDADE AQUI ---
            recurrence: document.getElementById('newRecur').value, 
            // -----------------------------

            done: false, 
            progress: 0, 
            inKanban: false 
        };

        app.state.tasks.unshift(newTask);
        
        // Sincroniza com o calendário se tiver data
        if(newTask.deadline && app.syncToCalendar) {
            app.syncToCalendar(newTask.id, newTask.title, newTask.deadline);
        }
        
        app.saveState(); 
        renderList(); 
        
        // Limpa os campos após adicionar
        document.getElementById('newTask').value = '';
        document.getElementById('newEst').value = ''; 
        document.getElementById('newRecur').value = ''; // Limpa o seletor de recorrência
    };

    renderList();
};

/* --- AUXILIARES (Mesmas funções, apenas garantindo o modal de edição) --- */

app.editTaskPrompt = (id) => {
    const t = app.state.tasks.find(x=>x.id===id);
    if(!t) return;

    app.openModal(`
        <h3>Editar Tarefa</h3>
        <label class="muted">Título</label>
        <input id="edTitle" value="${t.title}" style="margin-bottom:10px">
        
        <div style="display:flex; gap:10px; margin-bottom:10px">
            <div style="flex:1"><label class="muted">Prazo</label><input id="edDate" type="date" value="${t.deadline||''}"></div>
            <!-- INPUT NUMÉRICO NO EDIT -->
            <div style="flex:1"><label class="muted">Horas (Estimativa)</label><input id="edEst" type="number" step="0.5" value="${t.estimate||''}"></div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:10px">
            <div style="flex:1"><label class="muted">Responsável</label><input id="edResp" value="${t.responsible||''}"></div>
            <div style="flex:1">
                <label class="muted">Prioridade</label>
                <select id="edPrio">
                    <option value="Baixa" ${t.priority==='Baixa'?'selected':''}>Baixa</option>
                    <option value="Média" ${t.priority==='Média'?'selected':''}>Média</option>
                    <option value="Alta" ${t.priority==='Alta'?'selected':''}>Alta</option>
                </select>
            </div>
        </div>
        
        <div style="margin-bottom:10px">
            <label class="muted">Tipo</label>
            <select id="edType" style="width:100%">
                <option value="" ${!t.type?'selected':''}>Sem Tipo</option>
                <option value="Feature" ${t.type==='Feature'?'selected':''}>Feature</option>
                <option value="Bug" ${t.type==='Bug'?'selected':''}>Bug</option>
                <option value="Conteúdo" ${t.type==='Conteúdo'?'selected':''}>Conteúdo</option>
                <option value="Admin" ${t.type==='Admin'?'selected':''}>Admin</option>
            </select>
        </div>

        <div style="margin-bottom:20px">
            <label class="muted">Progresso (%)</label>
            <input id="edProg" type="number" min="0" max="100" value="${t.progress||0}" style="width:100%">
        </div>

        <div class="modal-actions">
            <button class="btn" id="saveEdTask">Salvar Alterações</button>
        </div>
    `);
    
    document.getElementById('saveEdTask').onclick = () => {
        t.title = document.getElementById('edTitle').value;
        t.deadline = document.getElementById('edDate').value;
        
        // Salva estimativa como número
        const estVal = document.getElementById('edEst').value;
        t.estimate = estVal ? parseFloat(estVal) : '';

        t.responsible = document.getElementById('edResp').value;
        t.priority = document.getElementById('edPrio').value;
        t.type = document.getElementById('edType').value;
        t.progress = parseInt(document.getElementById('edProg').value) || 0;
        
        if(t.deadline && app.syncToCalendar) app.syncToCalendar(t.id, t.title, t.deadline);

        // Atualiza Card no Kanban se existir
        const linkedCard = app.state.cards.find(c => c.originId === t.id);
        if(linkedCard) {
            linkedCard.title = t.title;
            linkedCard.deadline = t.deadline;
            linkedCard.estimate = t.estimate; // Sincroniza estimativa
            linkedCard.progress = t.progress;
            linkedCard.desc = `Resp: ${t.responsible||'-'} | Tipo: ${t.type||'-'}`;
        }
        
        app.saveState(); 
        app.closeModal(); 
        if(app.currentTab === 'tasks') app.render_tasks(document.getElementById('content'));
        if(app.currentTab === 'kanban' && app.render_kanban) app.render_kanban(document.getElementById('content'));
    };
};

// Mantém as outras funções auxiliares (toggleTask, delTask, copyToKanban) como estavam...
// (Elas já estão no objeto 'app' global, então não precisam ser reescritas aqui se já foram carregadas, 
// mas para garantir, é bom que estejam no arquivo).
app.toggleTask = (id) => { 
    const t = app.state.tasks.find(x => x.id === id); 
    if(t) { 
        // Lógica de Recorrência
        if (!t.done && t.recurrence) {
            // Se está marcando como feita e tem recorrência, cria a próxima
            const nextDate = new Date();
            // Se tiver data de hoje, usa ela, senão usa hoje
            const baseDate = t.deadline ? new Date(t.deadline) : new Date();

            if (t.recurrence === 'daily') baseDate.setDate(baseDate.getDate() + 1);
            if (t.recurrence === 'weekly') baseDate.setDate(baseDate.getDate() + 7);
            if (t.recurrence === 'monthly') baseDate.setMonth(baseDate.getMonth() + 1);

            const nextIso = baseDate.toISOString().slice(0, 10);

            // Cria o clone para o futuro
            const newTask = {
                ...t,
                id: app.uid(),
                deadline: nextIso,
                done: false,
                progress: 0,
                inKanban: false // Geralmente não joga recorrente direto pro kanban pra não poluir
            };
            
            app.state.tasks.unshift(newTask);
            
            // Sincroniza a nova tarefa com a agenda
            if(newTask.deadline && app.syncToCalendar) {
                app.syncToCalendar(newTask.id, newTask.title, newTask.deadline);
            }
            
            app.toast(`Próxima ocorrência criada para: ${nextIso.slice(8,10)}/${nextIso.slice(5,7)}`, 'success');
        }

        // Marca a atual como feita
        t.done = !t.done; 
        t.progress = t.done ? 100 : 0; 
        
        // Atualiza Kanban vinculado (apenas da atual)
        const c = app.state.cards.find(c => c.originId === t.id);
        if(c) { 
            c.progress = t.progress; 
            if(t.done) c.col='done'; 
            if(!t.done && c.col==='done') c.col='todo'; 
        }
        
        app.saveState(); 
        if(app.currentTab === 'tasks') app.render_tasks(document.getElementById('content'));
    }
};

app.delTask = (id) => {
    app.confirmModal('Excluir tarefa?', () => {
        app.state.tasks = app.state.tasks.filter(x=>x.id!==id);
        app.state.cards = app.state.cards.filter(c => c.originId !== id);

        if(app.syncToCalendar) app.syncToCalendar(id, null, null); 
        
        app.saveState(); 
        if(app.currentTab === 'tasks') app.render_tasks(document.getElementById('content'));
        if(app.currentTab === 'kanban' && app.render_kanban) app.render_kanban(document.getElementById('content'));
    });
};

app.copyToKanban = (id) => {
    const t = app.state.tasks.find(x=>x.id===id);
    if(!t) return;
    
    const targetBoardId = t.boardId || app.currentBoardId || (app.state.boards[0] ? app.state.boards[0].id : null);
    
    if(!targetBoardId) return app.toast("Crie um Projeto na aba Kanban primeiro!", "error");

    app.confirmModal(`Enviar "${t.title}" para o Kanban?`, () => {
        app.state.cards.push({
            id: app.uid(),
            originId: t.id,
            boardId: targetBoardId,
            col: 'todo',
            title: t.title,
            desc: `Resp: ${t.responsible||'-'} | Tipo: ${t.type||'-'}`,
            deadline: t.deadline,
            estimate: t.estimate,
            progress: t.progress
        });
        
        t.inKanban = true;
        app.saveState();
        
        const bTitle = app.state.boards.find(b=>b.id===targetBoardId)?.title || 'Board';
        app.toast(`Enviado para: ${bTitle}`);
        
        if(app.currentTab === 'tasks') app.render_tasks(document.getElementById('content'));
    });
};

app.editTaskPrompt = (id) => {
    const t = app.state.tasks.find(x=>x.id===id);
    if(!t) return;

    app.openModal(`
        <h3>Editar Tarefa</h3>
        <label class="muted">Título</label>
        <input id="edTitle" value="${t.title}" style="margin-bottom:10px">
        
        <div style="display:flex; gap:10px; margin-bottom:10px">
            <div style="flex:1"><label class="muted">Prazo</label><input id="edDate" type="date" value="${t.deadline||''}"></div>
            <div style="flex:1"><label class="muted">Estimativa</label><input id="edEst" value="${t.estimate||''}"></div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:10px">
            <div style="flex:1"><label class="muted">Responsável</label><input id="edResp" value="${t.responsible||''}"></div>
            <div style="flex:1">
                <label class="muted">Prioridade</label>
                <select id="edPrio">
                    <option value="Baixa" ${t.priority==='Baixa'?'selected':''}>Baixa</option>
                    <option value="Média" ${t.priority==='Média'?'selected':''}>Média</option>
                    <option value="Alta" ${t.priority==='Alta'?'selected':''}>Alta</option>
                </select>
            </div>
        </div>
        
        <div style="margin-bottom:10px">
            <label class="muted">Tipo</label>
            <select id="edType" style="width:100%">
                <option value="" ${!t.type?'selected':''}>Sem Tipo</option>
                <option value="Feature" ${t.type==='Feature'?'selected':''}>Feature</option>
                <option value="Bug" ${t.type==='Bug'?'selected':''}>Bug</option>
                <option value="Conteúdo" ${t.type==='Conteúdo'?'selected':''}>Conteúdo</option>
                <option value="Admin" ${t.type==='Admin'?'selected':''}>Admin</option>
            </select>
        </div>

        <div style="margin-bottom:20px">
            <label class="muted">Progresso (%)</label>
            <input id="edProg" type="number" min="0" max="100" value="${t.progress||0}" style="width:100%">
        </div>

        <div class="modal-actions">
            <button class="btn" id="saveEdTask">Salvar Alterações</button>
        </div>
    `);
    
    document.getElementById('saveEdTask').onclick = () => {
        t.title = document.getElementById('edTitle').value;
        t.deadline = document.getElementById('edDate').value;
        t.estimate = document.getElementById('edEst').value;
        t.responsible = document.getElementById('edResp').value;
        t.priority = document.getElementById('edPrio').value;
        t.type = document.getElementById('edType').value;
        t.progress = parseInt(document.getElementById('edProg').value) || 0;
        
        if(t.deadline && app.syncToCalendar) app.syncToCalendar(t.id, t.title, t.deadline);

        const linkedCard = app.state.cards.find(c => c.originId === t.id);
        if(linkedCard) {
            linkedCard.title = t.title;
            linkedCard.deadline = t.deadline;
            linkedCard.estimate = t.estimate;
            linkedCard.progress = t.progress;
            linkedCard.desc = `Resp: ${t.responsible||'-'} | Tipo: ${t.type||'-'}`;
            app.toast('Card Kanban associado atualizado.', 'info');
        }
        
        app.saveState(); 
        app.closeModal(); 
        if(app.currentTab === 'tasks') app.render_tasks(document.getElementById('content'));
        if(app.currentTab === 'kanban' && app.render_kanban) app.render_kanban(document.getElementById('content'));
    };
};