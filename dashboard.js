/**
 */
// (Não definimos EV_CONFIG aqui, pois já está no app.js)

app.render_dashboard = (root) => {
    // Verifica se os dados existem antes de tentar usar
    if (!app.state.tasks || !app.state.events) {
        root.innerHTML = "Carregando dados...";
        return;
    }

    const tasks = app.state.tasks;
    const today = new Date().toISOString().slice(0,10);
    
    const upcomingEvents = app.state.events
        .filter(e => e.date >= today)
        .sort((a,b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);

    const bookmarks = app.state.bookmarks.slice(0, 3);

    root.innerHTML = `
        <div class="grid">
            <!-- Coluna 1 -->
            <div class="col-4" style="display:flex; flex-direction:column; gap:24px">
                <div class="card">
                    <h3>Status Rápido</h3>
                    <div style="display:flex; gap:16px; margin-bottom:16px">
                        <div style="flex:1; background:rgba(99,102,241,0.1); padding:12px; border-radius:8px">
                            <div class="muted">Tarefas</div>
                            <div style="font-size:24px; font-weight:700; color:var(--primary)">${tasks.filter(t=>!t.done).length}</div>
                        </div>
                        <div style="flex:1; background:rgba(168,85,247,0.1); padding:12px; border-radius:8px">
                            <div class="muted">Cards</div>
                            <div style="font-size:24px; font-weight:700; color:var(--accent)">${app.state.cards.length}</div>
                        </div>
                    </div>
                    <button class="btn ghost" style="width:100%" onclick="app.router('kanban')">Ir para Projetos</button>
                </div>

                <div class="card" style="flex:1">
                    <h3><i class="ph ph-bookmark"></i> Bookmarks</h3>
                    <div style="display:flex; flex-direction:column; gap:8px">
                        ${bookmarks.length ? bookmarks.map(b => `
                            <a href="${b.url}" target="_blank" style="text-decoration:none; color:var(--text-muted); display:flex; align-items:center; gap:8px; padding:8px; border-radius:6px; background:rgba(255,255,255,0.03); font-size:13px; transition:background 0.2s">
                                <img src="https://www.google.com/s2/favicons?domain=${b.url}&sz=32" width="16" height="16">
                                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-main);">${b.title}</span>
                            </a>
                        `).join('') : '<div class="muted">Nenhum favorito</div>'}
                    </div>
                </div>
            </div>

            <!-- Coluna 2 -->
            <div class="col-4 card">
                <h3><i class="ph ph-calendar-check"></i> Próximos Eventos</h3>
                <div style="display:flex; flex-direction:column; gap:12px">
                    ${upcomingEvents.length ? upcomingEvents.map(ev => {
                        // Usa a EV_CONFIG global do app.js
                        const config = (typeof EV_CONFIG !== 'undefined' ? EV_CONFIG[ev.type] : null) || { icon: 'ph-calendar-blank', color: '#94a3b8', label: 'Evento' };
                        return `
                            <div style="display:flex; gap:12px; align-items:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid ${config.color}">
                                <div style="background:rgba(255,255,255,0.05); width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                                    <i class="ph ${config.icon}" style="color:${config.color}; font-size:20px"></i>
                                </div>
                                <div>
                                    <div style="font-weight:600; font-size:14px">${ev.title}</div>
                                    <div class="muted" style="font-size:11px">${new Date(ev.date).toLocaleDateString()} • ${config.label}</div>
                                </div>
                            </div>
                        `;
                    }).join('') : '<div class="muted">Agenda livre.</div>'}
                </div>
                <button class="btn ghost" style="width:100%; margin-top:16px" onclick="app.router('calendar')">Ver Agenda</button>
            </div>

            <!-- Coluna 3 -->
            <div class="col-4 card">
                <h3><i class="ph ph-fire"></i> Hábitos</h3>
                <div style="display:flex; flex-direction:column; gap:10px; overflow-y:auto; max-height:400px">
                    ${app.state.habits.slice(0, 5).map(h => {
                        const done = h.streaks[today];
                        return `
                        <div style="padding:10px; border-radius:8px; background:rgba(255,255,255,0.03); display:flex; justify-content:space-between; align-items:center">
                            <div>
                                <div style="font-weight:600">${h.name}</div>
                            </div>
                            <div style="width:24px; height:24px; border-radius:50%; background:${done ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; display:flex; align-items:center; justify-content:center">
                                ${done ? '<i class="ph ph-check" style="color:white; font-size:12px"></i>' : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <button class="btn ghost" style="width:100%; margin-top:16px" onclick="app.router('habits')">Gerenciar</button>
            </div>
        </div>
    `;
};