/**
 * Módulo de Hábitos (Com histórico visual)
 * Arquivo: js/modules/habits.js
 */

app.render_habits = (root) => {
    const today = new Date().toISOString().slice(0,10);

    root.innerHTML = `
        <div class="grid">
            <div class="col-4 card">
                <h3>Novo Hábito</h3>
                <input id="hName" placeholder="Ex: Ler Emails" style="margin-bottom:8px">
                <input id="hTags" placeholder="Tags (ex: Gestão, Desenvolvimento)" style="margin-bottom:12px">
                <button class="btn" style="width:100%" onclick="app.addHabit()">Adicionar Hábito</button>
            </div>
            <div class="col-8" id="hList" style="display:flex; flex-direction:column; gap:10px"></div>
        </div>
    `;

    app.renderHabitsList = () => {
        const el = document.getElementById('hList');
        if(!el) return;

        // Gera array dos últimos 7 dias para o histórico visual
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().slice(0,10);
        });

        el.innerHTML = app.state.habits.length ? app.state.habits.map(h => {
            const doneToday = h.streaks[today];
            
            // Gera as bolinhas do histórico
            const historyDots = last7Days.map(date => {
                const isDone = h.streaks[date];
                const isToday = date === today;
                const color = isDone ? 'var(--success)' : 'rgba(255,255,255,0.1)';
                const border = isToday ? '1px solid var(--text-muted)' : 'none';
                return `<div title="${date}" style="width:10px; height:10px; border-radius:50%; background:${color}; border:${border}"></div>`;
            }).join('');

            return `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:16px;">
                <div>
                    <div style="font-weight:600; font-size:16px">${h.name}</div>
                    <div style="margin-top:6px; display:flex; gap:6px;">
                        ${(h.tags||[]).map(t=>`<span class="tag-pill">#${t}</span>`).join('')}
                    </div>
                </div>
                
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px">
                    <div style="display:flex; gap:4px; background:rgba(0,0,0,0.2); padding:6px; border-radius:12px;">
                        ${historyDots}
                    </div>
                    <div style="display:flex; gap:10px; align-items:center">
                        <span class="muted" style="font-size:12px">Total: ${Object.keys(h.streaks).length}</span>
                        <button class="btn ${doneToday?'':'ghost'}" onclick="app.toggleHabit('${h.id}')">${doneToday?'Concluído':'Marcar Hoje'}</button>
                        <button class="btn danger ghost" style="padding:4px 8px" onclick="app.delHabit('${h.id}')"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('') : '<div class="card muted text-center" style="padding:40px">Nenhum hábito rastreado ainda.</div>';
    };

    app.renderHabitsList();
};

app.addHabit = () => {
    const name = document.getElementById('hName').value;
    const tagsStr = document.getElementById('hTags').value;
    const tags = tagsStr.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean);
    if(name) { 
        app.state.habits.push({ id: app.uid(), name, tags, streaks:{} }); 
        app.saveState(); 
        document.getElementById('hName').value = '';
        document.getElementById('hTags').value = '';
        app.renderHabitsList();
        app.toast('Hábito adicionado!');
    }
};
app.toggleHabit = (id) => { 
    const today = new Date().toISOString().slice(0,10);
    const h = app.state.habits.find(x=>x.id===id); 
    if(h.streaks[today]) delete h.streaks[today]; else h.streaks[today] = true;
    app.saveState(); 
    app.renderHabitsList(); 
};
app.delHabit = (id) => { 
    app.confirmModal('Apagar hábito?', ()=>{ 
        app.state.habits = app.state.habits.filter(x=>x.id!==id); 
        app.saveState(); 
        app.renderHabitsList(); 
    }); 
};
