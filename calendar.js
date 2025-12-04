/**
 * Módulo de Calendário
 */

// --- FUNÇÕES AUXILIARES (Globais para o HTML acessar) ---

app.calNav = (dir) => {
    // Atualiza o cursor do calendário (definido no app.js)
    app.calendarCursor.setMonth(app.calendarCursor.getMonth() + dir);
    
    // Força a renderização novamente no elemento de conteúdo
    const content = document.getElementById('content');
    if (content) app.render_calendar(content);
};

app.addEventPrompt = (preDate = '') => {
    const defDate = preDate || new Date().toISOString().slice(0,10);
    
    // Verifica se EV_CONFIG existe (do app.js), se não, usa um fallback
    const config = (typeof EV_CONFIG !== 'undefined') ? EV_CONFIG : {
        'other': { label: 'Outro' }, 'meeting': { label: 'Reunião' }, 'deadline': { label: 'Prazo' }
    };

    app.openModal(`
        <h3>Novo Evento</h3>
        <input id="evTitle" placeholder="Título do evento" style="margin-bottom:12px">
        <div style="display:flex; gap:12px; margin-bottom:12px">
            <input id="evDate" type="date" value="${defDate}">
            <select id="evType">
                ${Object.keys(config).map(k => `<option value="${k}">${config[k].label}</option>`).join('')}
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn ghost" onclick="app.closeModal()">Cancelar</button>
            <button class="btn" id="saveEvBtn">Salvar</button>
        </div>
    `);

    document.getElementById('saveEvBtn').onclick = () => {
        const title = document.getElementById('evTitle').value;
        const date = document.getElementById('evDate').value;
        const type = document.getElementById('evType').value;
        
        if(title && date) {
            app.state.events.push({ id: app.uid(), title, date, type });
            app.saveState(); 
            app.closeModal(); 
            
            // Re-renderiza a tela atual
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
            <input id="evDateEd" type="date" value="${ev.date}">
            <select id="evTypeEd">
                ${Object.keys(config).map(k => `<option value="${k}" ${ev.type===k?'selected':''}>${config[k].label}</option>`).join('')}
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn danger" id="delEvBtn">Excluir</button>
            <button class="btn" id="saveEvEdBtn">Salvar</button>
        </div>
    `);

    document.getElementById('saveEvEdBtn').onclick = () => {
        ev.title = document.getElementById('evTitleEd').value;
        ev.date = document.getElementById('evDateEd').value;
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

// Função de sincronia (Usada pelo módulo de Tarefas e Kanban)
// Define aqui para garantir que exista
app.syncToCalendar = (refId, title, date, type='deadline') => {
    // 1. Remove evento antigo ligado a este item (se houver)
    app.state.events = app.state.events.filter(e => e.refId !== refId);
    
    // 2. Se tiver data, cria novo evento
    if(date) {
        app.state.events.push({
            id: app.uid(),
            refId: refId, // Link importante para saber quem criou o evento
            title: `Prazo: ${title}`,
            date: date,
            type: type 
        });
    }
    // Não salva o estado aqui automaticamente para evitar loops, 
    // quem chama (Task/Kanban) geralmente já salva.
};


// --- RENDERIZAÇÃO PRINCIPAL ---

app.render_calendar = (root) => {
    const year = app.calendarCursor.getFullYear();
    const month = app.calendarCursor.getMonth();
    const monthName = app.calendarCursor.toLocaleString('pt-BR', {month:'long', year:'numeric'});
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    // Configuração de cores local ou global
    const config = (typeof EV_CONFIG !== 'undefined') ? EV_CONFIG : {
        'other': { icon: 'ph-calendar-blank', color: '#94a3b8' }
    };

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
                    const evs = app.state.events.filter(e => e.date === dateStr);
                    const isToday = new Date().toISOString().slice(0,10) === dateStr;
                    return `
                        <div class="cal-day" style="${isToday ? 'background:rgba(99,102,241,0.1); border:1px solid var(--primary)' : ''}" onclick="app.addEventPrompt('${dateStr}')">
                            <span style="font-weight:700; opacity:${isToday?1:0.5}">${d}</span>
                            ${evs.map(e => {
                                const c = config[e.type] || config['other'];
                                return `<div class="event-dot ev-type-${e.type}" onclick="event.stopPropagation(); app.editEvent('${e.id}')">
                                    <i class="ph ${c.icon}" style="font-size:12px;"></i> ${e.title}
                                </div>`;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    </div>`;
    root.innerHTML = html;
};