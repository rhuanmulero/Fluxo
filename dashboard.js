/**
 * Módulo Dashboard (Visual Preservado + Lógica de Favoritos)
 * Arquivo: js/modules/dashboard.js
 */

app.render_dashboard = (root) => {
    // 1. Lógica do Nome do Usuário
    let userName = app.userName || 'Chefe';
    if (!app.userName && app.cloud && app.cloud.user && app.cloud.user.user_metadata) {
        userName = app.cloud.user.user_metadata.full_name.split(' ')[0];
    }

    // 2. Dados Básicos e Filtros
    const tasks = app.state.tasks || [];
    const todayISO = new Date().toISOString().slice(0,10);

    // Bookmarks: Prioriza favoritos (amarelos), se não tiver, pega os 4 primeiros
    let bookmarks = (app.state.bookmarks || []).filter(b => b.favorite);
    if (bookmarks.length === 0) bookmarks = (app.state.bookmarks || []).slice(0, 4);

    // Hábitos: Prioriza favoritos (amarelos), se não tiver, pega os 5 primeiros
    let habits = (app.state.habits || []).filter(h => h.favorite);
    if (habits.length === 0) habits = (app.state.habits || []).slice(0, 5);

    // 3. Saudação e Data
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Boa noite';
    if (hour >= 5 && hour < 12) greeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';

    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = now.toLocaleDateString('pt-BR', dateOptions);

    // 4. Contagens
    const pendingTasks = tasks.filter(t => !t.done).length;
    const cardsCount = app.state.cards ? app.state.cards.length : 0;

    // 5. HTML Principal
    root.innerHTML = `
        <div class="grid">
            <!-- HEADER (SEU LAYOUT PRESERVADO) -->
            <div class="col-12 card" style="background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%); border:1px solid var(--primary); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                <div>
                    <h2 style="margin:0; font-size:24px; color:var(--text-main)">${greeting}, ${userName}.</h2>
                    <div class="muted" style="text-transform:capitalize; margin-top:4px;">${dateStr}</div>
                </div>
                <div id="weatherWidget" style="display:flex; align-items:center; gap:12px; background:var(--bg-card); padding:8px 16px; border-radius:12px; border:1px solid var(--border);">
                    <i class="ph ph-spinner-gap" style="animation:spin 1s linear infinite"></i>
                    <span style="font-size:13px">Carregando clima...</span>
                </div>
            </div>

            <!-- Coluna 1: Status e Bookmarks -->
            <div class="col-4" style="display:flex; flex-direction:column; gap:24px">
                <div class="card">
                    <h3>Visão Geral</h3>
                    <div style="display:flex; gap:16px; margin-bottom:16px">
                        <div style="flex:1; background:rgba(99,102,241,0.1); padding:12px; border-radius:8px; text-align:center">
                            <i class="ph ph-check-circle" style="font-size:24px; color:var(--primary); margin-bottom:4px"></i>
                            <div style="font-size:20px; font-weight:700;">${pendingTasks}</div>
                            <div class="muted" style="font-size:10px">Pendentes</div>
                        </div>
                        <div style="flex:1; background:rgba(168,85,247,0.1); padding:12px; border-radius:8px; text-align:center">
                            <i class="ph ph-kanban" style="font-size:24px; color:var(--accent); margin-bottom:4px"></i>
                            <div style="font-size:20px; font-weight:700;">${cardsCount}</div>
                            <div class="muted" style="font-size:10px">Cards</div>
                        </div>
                    </div>
                    <button class="btn" style="width:100%" onclick="app.router('tasks')">Gerenciar Tarefas</button>
                </div>

                <div class="card" style="flex:1">
                    <h3><i class="ph ph-bookmark"></i> Acesso Rápido</h3>
                    <div style="display:flex; flex-direction:column; gap:8px">
                        ${bookmarks.length ? bookmarks.map(b => `
                            <a href="${b.url}" target="_blank" style="text-decoration:none; color:var(--text-muted); display:flex; align-items:center; gap:8px; padding:8px; border-radius:6px; background:rgba(255,255,255,0.03); font-size:13px; transition:background 0.2s">
                                <img src="https://www.google.com/s2/favicons?domain=${b.url}&sz=32" width="16" height="16">
                                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-main); flex:1">${b.title}</span>
                                ${b.favorite ? '<i class="ph ph-star-fill" style="color:#fbbf24; font-size:12px"></i>' : ''}
                            </a>
                        `).join('') : '<div class="muted">Nenhum favorito</div>'}
                    </div>
                </div>
            </div>

            <!-- Coluna 2: Agenda -->
            <div class="col-4 card">
                <h3><i class="ph ph-calendar-check"></i> Próximos Eventos</h3>
                
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${(() => {
                        const allEvents = (app.state.events || [])
                            .filter(e => e.date >= todayISO)
                            .sort((a,b) => {
                                if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
                                return (a.time || '').localeCompare(b.time || '');
                            });

                        const visibleEvents = allEvents.slice(0, 3);
                        const hiddenCount = allEvents.length - 3;

                        if (visibleEvents.length === 0) {
                            return '<div class="muted" style="padding: 15px 0; text-align:center;">Agenda livre.</div>';
                        }

                        return visibleEvents.map(ev => {
                            const config = (typeof EV_CONFIG !== 'undefined' ? EV_CONFIG[ev.type] : null) || { icon: 'ph-calendar-blank', color: '#94a3b8', label: 'Evento' };
                            const timeStr = ev.time ? ` • ${ev.time}` : '';
                            
                            return `
                                <div style="display:flex; gap:12px; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid ${config.color}">
                                    <div style="background:rgba(255,255,255,0.05); width:32px; height:32px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                                        <i class="ph ${config.icon}" style="color:${config.color}; font-size:16px"></i>
                                    </div>
                                    <div style="overflow:hidden;">
                                        <div style="font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ev.title}</div>
                                        <div class="muted" style="font-size:11px">${new Date(ev.date).toLocaleDateString()}${timeStr}</div>
                                    </div>
                                </div>
                            `;
                        }).join('') + (hiddenCount > 0 ? `<div class="muted" style="font-size:11px; text-align:center; padding-top:4px;">+ ${hiddenCount} evento(s)</div>` : '');
                    })()}
                </div>
                
                <button class="btn ghost" style="width:100%; margin-top:12px; padding: 6px;" onclick="app.router('calendar')">Ver Agenda</button>
            </div>

            <!-- Coluna 3: Hábitos (Com Estrela e Tags) -->
            <div class="col-4 card">
                <h3><i class="ph ph-fire"></i> Hábitos de Hoje</h3>
                <div style="display:flex; flex-direction:column; gap:10px; overflow-y:auto; max-height:400px">
                    ${habits.slice(0, 6).map(h => {
                        const done = h.streaks && h.streaks[todayISO];
                        const tagsHtml = (h.tags || []).map(t => `<span class="tag-pill" style="font-size:9px; padding:1px 6px">#${t}</span>`).join('');
                        
                        return `
                        <div style="padding:10px; border-radius:8px; background:rgba(255,255,255,0.03); display:flex; justify-content:space-between; align-items:center; border:1px solid ${done ? 'var(--success)' : 'transparent'}">
                            <div>
                                <div style="font-weight:600; font-size:14px; display:flex; align-items:center; gap:6px;">
                                    ${h.favorite ? '<i class="ph ph-star-fill" style="color:#fbbf24; font-size:11px"></i>' : ''}
                                    ${h.name}
                                </div>
                                <div style="display:flex; gap:4px; margin-top:4px;">${tagsHtml}</div>
                            </div>
                            <div style="width:24px; height:24px; border-radius:50%; background:${done ? 'var(--success)' : 'rgba(255,255,255,0.1)'}; display:flex; align-items:center; justify-content:center">
                                ${done ? '<i class="ph ph-check" style="color:#0f172a; font-size:12px; font-weight:bold"></i>' : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <button class="btn ghost" style="width:100%; margin-top:16px" onclick="app.router('habits')">Gerenciar</button>
            </div>
        </div>
        
        <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;

    app.fetchWeather();
};

app.fetchWeather = async () => {
    const widget = document.getElementById('weatherWidget');
    if(!widget) return;

    try {
        const geoReq = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const geoData = await geoReq.json();
        const { latitude, longitude, city } = geoData;

        const weatherReq = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const wData = await weatherReq.json();
        
        const temp = Math.round(wData.current_weather.temperature);
        const wCode = wData.current_weather.weathercode;

        let icon = 'ph-sun';
        let color = '#f59e0b';
        if(wCode > 0 && wCode <= 3) { icon = 'ph-cloud-sun'; color = '#94a3b8'; }
        else if(wCode >= 51 && wCode <= 67) { icon = 'ph-cloud-rain'; color = '#3b82f6'; }
        else if(wCode >= 95) { icon = 'ph-cloud-lightning'; color = '#8b5cf6'; }

        widget.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:flex-end; line-height:1.2">
                <span style="font-weight:700; font-size:16px;">${temp}°C</span>
                <span style="font-size:10px" class="muted">${city}</span>
            </div>
            <i class="ph ${icon}" style="font-size:28px; color:${color}"></i>
        `;

    } catch (e) {
        console.error("Erro no clima:", e);
        widget.innerHTML = `<span class="muted" style="font-size:12px">Clima indisponível</span>`;
    }
};
