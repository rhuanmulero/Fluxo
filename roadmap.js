/**
 * Módulo Roadmap (Integrado ao Kanban)
 * Arquivo: js/modules/roadmap.js
 */

app.render_roadmap = (root) => {
    // Garante sincronia inicial
    if (!app.state.roadmapProjects) {
        // Migra boards existentes para virarem projetos do roadmap também
        app.state.roadmapProjects = app.state.boards.map(b => ({ id: b.id, title: b.title })) || [];
        if(app.state.roadmapProjects.length === 0) {
             const defId = app.uid();
             app.state.roadmapProjects.push({id: defId, title: "Projeto Principal"});
             app.state.boards.push({id: defId, title: "Projeto Principal"});
        }
    }
    if (!app.currentRoadmapId) app.currentRoadmapId = app.state.roadmapProjects[0].id;

    const currentProj = app.state.roadmapProjects.find(p => p.id === app.currentRoadmapId);
    const items = app.state.roadmap.filter(r => r.projectId === app.currentRoadmapId);

    root.innerHTML = `
        <div class="grid">
            <div class="col-12 card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="ph ph-rocket-launch" style="font-size:24px; color:var(--accent)"></i>
                        <select onchange="app.switchRoadmap(this.value)" style="background:rgba(0,0,0,0.2); border:1px solid var(--border); color:white; padding: 5px 10px; border-radius: 6px; min-width: 200px;">
                            ${app.state.roadmapProjects.map(p => `<option value="${p.id}" ${p.id===app.currentRoadmapId?'selected':''}>${p.title}</option>`).join('')}
                        </select>
                        <button class="btn ghost" style="padding:4px 8px" onclick="app.addRoadmapProject()" title="Novo Projeto">+</button>
                    </div>
                    
                    <div style="display:flex; gap:10px">
                        <button class="btn ghost" style="border:1px solid var(--primary); color:var(--primary)" onclick="app.goToKanbanBoard('${app.currentRoadmapId}')">
                            <i class="ph ph-kanban"></i> Abrir Board Kanban
                        </button>
                        <button class="btn" onclick="app.addRoadmapItem()">+ Milestone</button>
                    </div>
                </div>

                <div id="roadList">
                    ${items.length === 0 ? '<div class="muted text-center" style="padding:40px">Nenhuma milestone. Adicione metas para este projeto.</div>' : ''}
                    ${items.map(r => app.createRoadmapItemHTML(r)).join('')}
                </div>
            </div>
        </div>
    `;
};

app.createRoadmapItemHTML = (r) => {
    const statuses = { 'planned': '#94a3b8', 'active': '#3b82f6', 'completed': '#10b981' };
    return `
    <div style="margin-bottom:20px; background:rgba(255,255,255,0.03); padding:16px; border-radius:12px; border:1px solid var(--border);">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <div style="font-weight:700; font-size:15px; display:flex; align-items:center; gap:8px;">
                <div style="width:8px; height:8px; border-radius:50%; background:${statuses[r.status]||'#94a3b8'}"></div>
                ${r.title}
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn ghost" style="padding:4px" onclick="app.moveRoadmapItem('${r.id}', 'up')"><i class="ph ph-arrow-up"></i></button>
                <button class="btn ghost" style="padding:4px" onclick="app.moveRoadmapItem('${r.id}', 'down')"><i class="ph ph-arrow-down"></i></button>
                <button class="btn ghost danger" style="padding:4px" onclick="app.delRoad('${r.id}')"><i class="ph ph-trash"></i></button>
            </div>
        </div>
        
        <div style="display:flex; align-items:center; gap:10px;">
            <div style="flex:1; height:8px; background:rgba(0,0,0,0.3); border-radius:4px; overflow:hidden; position:relative;">
                <div style="width:${r.progress||0}%; height:100%; background:linear-gradient(90deg, var(--primary), var(--accent)); transition:width 0.3s"></div>
                <!-- Input invisivel para controle -->
                <input type="range" min="0" max="100" value="${r.progress||0}" 
                       onchange="app.updateRoadProgress('${r.id}', this.value)"
                       style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer">
            </div>
            <span class="muted" style="font-size:11px; min-width:30px;">${r.progress||0}%</span>
        </div>
    </div>`;
};

app.switchRoadmap = (id) => {
    app.currentRoadmapId = id;
    // Sincroniza o board atual do Kanban também para facilitar
    app.currentBoardId = id; 
    app.saveState();
    app.render_roadmap(document.getElementById('content'));
};

app.addRoadmapProject = () => {
    app.promptModal('Novo Projeto', 'Nome do Projeto', (val) => {
        const id = app.uid();
        // 1. Cria no Roadmap
        app.state.roadmapProjects.push({ id, title: val });
        // 2. Cria no Kanban Automaticamente
        app.state.boards.push({ id, title: val });
        
        app.currentRoadmapId = id;
        app.saveState();
        app.render_roadmap(document.getElementById('content'));
        app.toast("Projeto criado no Roadmap e no Kanban!");
    });
};

app.goToKanbanBoard = (boardId) => {
    app.currentBoardId = boardId;
    app.saveState();
    app.router('kanban'); // Redireciona para a aba Kanban
};

app.addRoadmapItem = () => {
    app.promptModal('Nova Milestone', 'O que entregar?', (val) => {
        app.state.roadmap.push({ 
            id: app.uid(), projectId: app.currentRoadmapId,
            title: val, status: 'planned', progress: 0, date: new Date().toISOString().slice(0,10)
        });
        app.saveState(); 
        app.render_roadmap(document.getElementById('content'));
    });
};

app.updateRoadProgress = (id, val) => {
    const item = app.state.roadmap.find(x => x.id === id);
    if(item) {
        item.progress = parseInt(val);
        if(item.progress === 100) item.status = 'completed';
        else if(item.progress > 0) item.status = 'active';
        app.saveState();
        app.render_roadmap(document.getElementById('content'));
    }
};

app.moveRoadmapItem = (id, direction) => {
    const list = app.state.roadmap;
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return; 
    let newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    app.saveState();
    app.render_roadmap(document.getElementById('content'));
};

app.delRoad = (id) => { 
    app.confirmModal('Remover item?', () => { 
        app.state.roadmap = app.state.roadmap.filter(x => x.id !== id); 
        app.saveState(); 
        app.render_roadmap(document.getElementById('content')); 
    }); 
};
