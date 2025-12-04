/**
 * Módulo de Calendário (Com Limite de Visualização e Modal de Detalhes)
 * Arquivo: js/modules/calendar.js
 */

app.calNav = (dir) => {
    app.calendarCursor.setMonth(app.calendarCursor.getMonth() + dir);
    const content = document.getElementById('content');
    if (content) app.render_calendar(content);
};

// --- NOVO: MODAL DE DETALHES DO DIA (QUANDO TEM MUITOS EVENTOS) ---
app.openDayDetails = (dateStr) => {
    // Busca eventos do dia
    const events = app.state.events
        .filter(e => e.date === dateStr)
        .sort((a,b) => (a.time || '').localeCompare(b.time || ''));

    // Config de cores
    const config = (typeof EV_CONFIG !== 'undefined') ? EV_CONFIG : { 'other': { label: 'Outro', color: '#94a3b8' } };
    
    // Formata a data para título
    const dateObj = new Date(dateStr + 'T12:00:00'); // Fix timezone
    const dateTitle = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    // HTML da Lista
    const listHtml = events.map(e => {
        const c = config[e.type] || config['other'];
        const timeStr = e.time ? `<span class="tag-pill" style="margin-right:8px">${e.time}</span>` : '';
        
        return `
        <div class="card" style="margin-bottom:10px; padding:12px; display:flex; align-items:center; border-left:4px solid ${c.color}; cursor:pointer" onclick="app.editEvent('${e.id}')">
            <div style="flex:1">
                <div style="font-weight:600; font-size:15px">${e.title}</div>
                <div class="muted" style="font-size:12px; margin-top:4px">
                    ${timeStr}
                    <i class="ph ${c.icon}"></i> ${c.label}
                </div>
            </div>
            <button class="btn ghost"><i class="ph ph-pencil-simple"></i></button>
        </div>`;
    }).join('');

    app.openModal(`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
            <h3 style="margin:0; text-transform:capitalize">${dateTitle}</h3>
            <span class="tag-pill">${events.length} eventos</span>
        </div>
        <div style="max-height:60vh; overflow-y:auto; margin-bottom:15px; padding-right:5px">
            ${listHtml}
        </div>
        <div class="modal-actions">
            <button class="btn ghost" onclick="app.closeModal()">Fechar</button>
            <button class="btn" onclick="app.addEventPrompt('${dateStr}')">+ Novo Evento</button>
        </div>
    `);
};

// --- MODAIS PADRÃO (CRIAR/EDITAR) ---

app.addEventPrompt = (preDate = '') => {
    // Fecha modal anterior se houver (caso venha do openDayDetails)
    // Mas mantém o backdrop. O app.openModal substitui o conteúdo.
    
    const defDate = preDate || new Date().toISOString().slice(0,10);
    const config = (typeof EV_CONFIG !== 'undefined') ? EV_CONFIG : { 'other': { label: 'Outro' } };

    app.openModal(`
        <h3>Novo Evento</h3>
        <input id="evTitle" placeholder="Título do evento" style="margin-bottom:12px">
        <div style="display:flex; gap:12px; margin-bottom:12px">
            <div style="flex:1">
                <label class="muted" style="font-size:11px">Data</label>
                <input id="evDate" type="date" value="${defDate}">
            </div>
            <div style="width: 100px;">
                <label class="muted" style="font-size:11px">Hora</label>
                <input id="evTime" type="time">
            </div>
        </div>
        <label class="muted" style="font-size:11px">Tipo</label>
        <select id="evType" style="margin-bottom:20px">
            ${Object.keys(config).map(k => `<option value="${k}">${config[k].label}</option>`).join('')}
        </select>
        <div class="modal-actions">
            <button class="btn ghost" onclick="app.closeModal()">Cancelar</button>
            <button class="btn" id="saveEvBtn">Salvar</button>
        </div>
    `);

    document.getElementById('saveEvBtn').onclick = () => {
        const title = document.getElementById('evTitle').value;
        const date = document.getElementById('evDate').value;
        const time = document.getElementById('evTime').value;
        const type = document.getElementById('evType').value;
        
        if(title && date) {
            app.state.events.push({ id: app.uid(), title, date, time, type });
            app.saveState(); 
            app.closeModal(); 
            const content = document.getElementById('content');
            if(content) app.render_calendar(content);
        }
    };
};

app.editEvent = (id) => {
    const ev = app.state.events.find(x => x.id === id);
    if(!ev) return;

    const config = (typeof EV_CONFIG !== 'undefined') ? EV_CONFIG : {};

    app.openModal(`
        <h3>Editar Evento</h3>
        <input id="evTitleEd" value="${ev.title}" style="margin-bottom:12px">
        <div style="display:flex; gap:12px; margin-bottom:12px">
            <div style="flex:1">
                <label class="muted" style="font-size:11px">Data</label>
                <input id="evDateEd" type="date" value="${ev.date}">
            </div>
            <div style="width: 100px;">
                <label class="muted" style="font-size:11px">Hora</label>
                <input id="evTimeEd" type="time" value="${ev.time || ''}">
            </div>
        </div>
        <label class="muted" style="font-size:11px">Tipo</label>
        <select id="evTypeEd" style="margin-bottom:20px">
            ${Object.keys(config).map(k => `<option value="${k}" ${ev.type===k?'selected':''}>${config[k].label}</option>`).join('')}
        </select>
        <div class="modal-actions">
            <button class="btn danger" id="delEvBtn">Excluir</button>
            <button class="btn" id="saveEvEdBtn">Salvar</button>
        </div>
    `);

    document.getElementById('saveEvEdBtn').onclick = () => {
        ev.title = document.getElementById('evTitleEd').value;
        ev.date = document.getElementById('evDateEd').value;
        ev.time = document.getElementById('evTimeEd').value;
        ev.type = document.getElementById('evTypeEd').value;
        
        app.saveState(); 
        app.closeModal(); 
        const content = document.getElementById('content');
        if(content) app.render_calendar(content);
    };

    document.getElementById('delEvBtn').onclick = () => {
        app.confirmModal('Excluir este evento?', () => {
            app.state.events = app.state.events.filter(x=>x.id !== id);
            app.saveState(); 
            app.closeModal(); 
            const content = document.getElementById('content');
            if(content) app.render_calendar(content);
        });
    };
};

app.syncToCalendar = (refId, title, date, type='deadline') => {
    app.state.events = app.state.events.filter(e => e.refId !== refId);
    if(date) {
        app.state.events.push({
            id: app.uid(), refId: refId, title: `Prazo: ${title}`, date: date, time: '', type: type 
        });
    }
};

// --- RENDERIZADOR PRINCIPAL ---

app.render_calendar = (root) => {
    const year = app.calendarCursor.getFullYear();
    const month = app.calendarCursor.getMonth();
    const monthName = app.calendarCursor.toLocaleString('pt-BR', {month:'long', year:'numeric'});
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const config = (typeof EV_CONFIG !== 'undefined') ? EV_CONFIG : { 'other': { icon: 'ph-calendar-blank', color: '#94a3b8' } };

    let html = `
    <div class="grid">
        <div class="col-12 card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                <div style="display:flex; gap:10px; align-items:center">
                    <button class="btn ghost" onclick="app.calNav(-1)"><i class="ph ph-caret-left"></i></button>
                    <h3 style="margin:0; text-transform:capitalize; width:180px; text-align:center">${monthName}</h3>
                    <button class="btn ghost" onclick="app.calNav(1)"><i class="ph ph-caret-right"></i></button>
                </div>
                <button class="btn" onclick="app.addEventPrompt()">+ Novo Evento</button>
            </div>
            <div class="calendar-grid">
                ${['DOM','SEG','TER','QUA','QUI','SEX','SAB'].map(d=>`<div class="cal-head">${d}</div>`).join('')}
                ${Array(firstDay).fill('<div></div>').join('')}
                ${Array.from({length:daysInMonth}, (_,i)=>i+1).map(d => {
                    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    const isToday = new Date().toISOString().slice(0,10) === dateStr;
                    
                    // Ordenação
                    const evs = app.state.events
                        .filter(e => e.date === dateStr)
                        .sort((a,b) => (a.time || '').localeCompare(b.time || ''));
                    
                    // --- LÓGICA DE LIMITE VISUAL ---
                    const MAX_VISIBLE = 3;
                    const isOverflow = evs.length > MAX_VISIBLE;
                    
                    // Se estourar o limite, mostra apenas os 2 primeiros e o botão de mais
                    // Se não estourar, mostra todos (até 3)
                    const visibleEvents = isOverflow ? evs.slice(0, 2) : evs;
                    const remaining = evs.length - 2;

                    // Define a ação do clique no dia:
                    // Se tem overflow, abre a lista do dia. Se não, abre 'criar novo'.
                    const dayAction = isOverflow ? `app.openDayDetails('${dateStr}')` : `app.addEventPrompt('${dateStr}')`;

                    let eventsHtml = visibleEvents.map(e => {
                        const c = config[e.type] || config['other'];
                        const timeDisplay = e.time ? `<span style="font-size:9px; opacity:0.8; margin-right:2px">${e.time}</span>` : '';
                        
                        return `<div class="event-dot ev-type-${e.type}" onclick="event.stopPropagation(); app.editEvent('${e.id}')">
                            ${timeDisplay} <i class="ph ${c.icon}" style="font-size:10px;"></i> ${e.title}
                        </div>`;
                    }).join('');

                    if (isOverflow) {
                        eventsHtml += `
                            <div class="event-dot" style="background:rgba(255,255,255,0.1); color:var(--text-muted); justify-content:center; font-weight:600">
                                + ${remaining} mais
                            </div>
                        `;
                    }

                    return `
                        <div class="cal-day" style="${isToday ? 'background:rgba(99,102,241,0.1); border:1px solid var(--primary)' : ''}" onclick="${dayAction}">
                            <span style="font-weight:700; opacity:${isToday?1:0.5}">${d}</span>
                            <div style="display:flex; flex-direction:column; gap:2px; margin-top:4px;">
                                ${eventsHtml}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    </div>`;
    root.innerHTML = html;
};
