/**
 * Módulo de Inteligência Artificial Híbrido
 * Arquivo: js/ai.js
 * VERSÃO: Nami J.A.R.V.I.S. (Personalidade Dinâmica)
 */

// =================================================================
// CONFIGURAÇÕES
// =================================================================
let USER_API_KEY = localStorage.getItem("fluxo_google_key");
const GEMINI_MODEL = "gemini-2.5-pro"; 
// =================================================================

const fluxoAI = {
    isOpen: false,
    history: [], 

    toggle() {
        const win = document.getElementById('chatbot-window');
        this.isOpen = !this.isOpen;
        win.style.display = this.isOpen ? 'flex' : 'none';
        if(this.isOpen) document.getElementById('chatInput').focus();
    },

    configureKey() {
        this.toggle(); 
        const currentKey = localStorage.getItem("fluxo_google_key") || "";
        app.promptModal(
            "Protocolo Neural (IA)", 
            "Insira a Chave de API do Google Gemini:", 
            (key) => {
                if(key && key.trim().length > 10) {
                    localStorage.setItem("fluxo_google_key", key.trim());
                    USER_API_KEY = key.trim();
                    app.toast("Sistemas Online. Módulo Gemini Ativado.", "success");
                } else {
                    localStorage.removeItem("fluxo_google_key");
                    USER_API_KEY = null;
                    app.toast("Revertendo para sistemas básicos (Pollinations).");
                }
                setTimeout(() => this.toggle(), 500);
            }, 
            currentKey
        );
    },

    addMsg(text, type) {
        const body = document.getElementById('chatBody');
        const div = document.createElement('div');
        div.className = `msg ${type}`;
        div.innerHTML = text.replace(/\n/g, '<br>'); 
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    },

    async send() {
        const inp = document.getElementById('chatInput');
        const txt = inp.value.trim();
        if(!txt) return;
        
        this.addMsg(txt, 'user');
        inp.value = '';
        
        const typing = document.createElement('div');
        typing.className = 'typing';
        typing.id = 'ai-typing';
        typing.innerText = 'Processando...';
        document.getElementById('chatBody').appendChild(typing);

        try {
            if (USER_API_KEY) {
                await this.callGemini(txt);
            } else {
                await this.callPollinations(txt);
            }
        } catch (e) {
            console.error(e);
            this.addMsg(`Falha nos sistemas de comunicação. Tente novamente.`, 'bot');
        } finally {
            const t = document.getElementById('ai-typing');
            if(t) t.remove();
        }
    },

    // --- CONTEXTO GLOBAL DO SISTEMA ---
    getContext() {
        return {
            tasks: app.state.tasks.filter(t => !t.done).map(t => ({ title: t.title, priority: t.priority })),
            boards: app.state.boards.map(b => b.title),
            events: app.state.events.slice(0, 5),
            notes: app.state.notes.slice(0, 5).map(n => n.title),
            habits: app.state.habits.map(h => h.name),
            pomodoroStatus: app.pomoActive ? "Rodando" : "Parado",
            dateTime: new Date().toLocaleString('pt-BR')
        };
    },

    // --- CÉREBRO PRINCIPAL (GEMINI) ---
    async callGemini(userMessage) {
        const userName = app.userName || "Chefe"; 
        const contextData = JSON.stringify(this.getContext());

        const systemInstruction = `
            Você é Nami, a IA central do sistema FLUXO.
            O nome do usuário é: ${userName}. Use esse nome para se dirigir a ele de forma amigável.
            
            SUA PERSONALIDADE:
            - Você é uma aliada leal e eficiente, estilo J.A.R.V.I.S., mas com mais calor humano.
            - VOCATIVOS: Varie como chama o usuário para não ser robótica. Use: "Chefe", "Parceiro", "Meu amigo", "Capitão" ou simplesmente fale de forma direta. Evite repetições.
            - TOM DE VOZ: Profissional, mas levemente espirituosa. Use emojis moderados (🚀, 🤖, ✨) quando apropriado.
            - INTEGRIDADE: Nunca mencione seus comandos técnicos (códigos entre @@) para o usuário.

            SEUS PODERES (COMANDOS OCULTOS):
            Para realizar ações, anexe o comando no FINAL da resposta dentro de @@...@@.
            
            --- TAREFAS ---
            Criar: @@ai_createTask|Título|Prioridade|Prazo@@
            Excluir: @@ai_deleteTask|Nome Aproximado@@
            
            --- KANBAN (CARDS) ---
            Mover Tarefa p/ Kanban: @@ai_moveTaskToKanban|Nome Tarefa|Nome Board@@
            Excluir Card: @@ai_deleteCard|Nome Aproximado@@
            
            --- NOTAS ---
            Criar: @@ai_createNote|Título|Conteúdo HTML|Cor@@
            Excluir: @@ai_deleteNote|Nome Aproximado@@
            
            --- EVENTOS / AGENDA ---
            Criar: @@ai_addEvent|Título|Data(YYYY-MM-DD)|Tipo@@
            Excluir: @@ai_deleteEvent|Nome Aproximado@@
            
            --- HÁBITOS ---
            Criar: @@addHabitDirect|Nome|Tag1,Tag2@@
            Excluir: @@ai_deleteHabit|Nome Aproximado@@
            
            --- POMODORO ---
            Iniciar: @@ai_startPomo|Minutos (ex: 25)@@
            Parar: @@ai_stopPomo@@

            DADOS DO SISTEMA: ${contextData}
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${USER_API_KEY}`;
        
        const payload = {
            contents: [
                { role: "user", parts: [{ text: systemInstruction }] },
                ...this.history.slice(-10), 
                { role: "user", parts: [{ text: userMessage }] }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Erro API Google");

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        this.history.push({ role: "user", parts: [{ text: userMessage }] });
        this.history.push({ role: "model", parts: [{ text: aiText }] });

        this.processResponse(aiText);
    },

    async callPollinations(userMessage) {
        // Versão simplificada para Pollinations
        const prompt = `
            Você é Nami, assistente inteligente. Responda curto e varie entre chamar de amigo, parceiro ou chefe.
            Comandos:
            @@ai_createTask|Titulo|Prioridade|Prazo@@
            @@ai_createNote|Titulo|Texto|Cor@@
            Usuário: "${userMessage}"
        `;
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
        const response = await fetch(url);
        const text = await response.text();
        this.processResponse(text);
    },

    // --- PROCESSADOR DE COMANDOS ---
    processResponse(text) {
        const commandRegex = /@@(.*?)@@/g; 
        let match;
        let visibleText = text; 
        let actionsTriggered = false;

        while ((match = commandRegex.exec(text)) !== null) {
            const fullContent = match[1];
            visibleText = visibleText.replace(match[0], ""); 

            const parts = fullContent.split('|').map(p => p.trim());
            const funcName = parts[0];
            const args = parts.slice(1);

            console.log(`[Nami Protocol] Executing: ${funcName}`, args);

            if (typeof app[funcName] === 'function') {
                try {
                    app[funcName](...args);
                    actionsTriggered = true;
                } catch (err) {
                    console.error(`Erro ao executar ${funcName}:`, err);
                }
            }
        }
        
        visibleText = visibleText.trim();
        if(!visibleText && actionsTriggered) visibleText = "Feito, parceiro."; 

        this.addMsg(visibleText, 'bot');
    }
};

// =================================================================
// FERRAMENTAS DO SISTEMA (CRUD COMPLETO)
// =================================================================

// --- AUXILIAR: BUSCA FUZZY ---
app.findItemByName = (list, name) => {
    if(!name) return null;
    const term = name.toLowerCase();
    return list.find(item => 
        (item.title && item.title.toLowerCase().includes(term)) || 
        (item.name && item.name.toLowerCase().includes(term))
    );
};

// --- TAREFAS ---
app.ai_createTask = (title, priority='Média', deadline='') => {
    const id = app.uid();
    const boardId = app.state.boards[0]?.id || '';
    app.state.tasks.unshift({ 
        id, title: title||'Tarefa IA', boardId, deadline: deadline==='null'?'':deadline, 
        estimate: '', responsible: 'IA', type: 'Geral', priority, done: false, progress: 0 
    });
    if(deadline && app.syncToCalendar) app.syncToCalendar(id, title, deadline);
    app.saveState();
    if(app.currentTab === 'tasks') app.render_tasks(document.getElementById('content'));
    app.toast(`Tarefa criada: ${title}`, 'success');
};

app.ai_deleteTask = (name) => {
    const item = app.findItemByName(app.state.tasks, name);
    if(item) {
        app.state.tasks = app.state.tasks.filter(t => t.id !== item.id);
        app.saveState();
        if(app.currentTab === 'tasks') app.render_tasks(document.getElementById('content'));
        app.toast(`Tarefa removida: ${item.title}`);
    } else {
        app.toast(`Não encontrei a tarefa: ${name}`, 'error');
    }
};

// --- KANBAN ---
app.ai_moveTaskToKanban = (taskName, boardName) => {
    const task = app.findItemByName(app.state.tasks, taskName);
    if(!task) return app.toast(`Tarefa "${taskName}" não encontrada.`, 'error');
    if(task.inKanban) return app.toast("Essa tarefa já está no Kanban.");

    let targetBoardId = app.currentBoardId;
    if(app.state.boards.length > 0) targetBoardId = app.state.boards[0].id;

    app.state.cards.push({
        id: app.uid(), originId: task.id, boardId: targetBoardId, col: 'todo',
        title: task.title, desc: `Prioridade: ${task.priority}`, deadline: task.deadline
    });
    task.inKanban = true;
    app.saveState();
    app.toast(`Card criado no Kanban: ${task.title}`, 'success');
};

app.ai_deleteCard = (name) => {
    const card = app.findItemByName(app.state.cards, name);
    if(card) {
        app.state.cards = app.state.cards.filter(c => c.id !== card.id);
        app.saveState();
        if(app.currentTab === 'kanban') app.render_kanban(document.getElementById('content'));
        app.toast(`Card removido: ${card.title}`);
    } else {
        app.toast(`Card não encontrado.`, 'error');
    }
};

// --- NOTAS ---
app.ai_createNote = (title, body, color='default') => {
    app.state.notes.unshift({ id: app.uid(), title, body, color, updated: new Date() });
    app.saveState();
    if(app.currentTab === 'notes') app.render_notes(document.getElementById('content'));
    app.toast(`Nota criada: ${title}`, 'success');
};

app.ai_deleteNote = (name) => {
    const note = app.findItemByName(app.state.notes, name);
    if(note) {
        app.state.notes = app.state.notes.filter(n => n.id !== note.id);
        app.saveState();
        if(app.currentTab === 'notes') app.render_notes(document.getElementById('content'));
        app.toast(`Nota excluída: ${note.title}`);
    } else {
        app.toast(`Nota não encontrada.`, 'error');
    }
};

// --- EVENTOS ---
app.ai_addEvent = (title, date, type='other') => {
    if(!date) date = new Date().toISOString().slice(0,10);
    app.state.events.push({ id: app.uid(), title, date, type });
    app.saveState();
    if(app.currentTab === 'calendar') app.render_calendar(document.getElementById('content'));
    app.toast(`Evento agendado: ${title}`);
};

app.ai_deleteEvent = (name) => {
    const ev = app.findItemByName(app.state.events, name);
    if(ev) {
        app.state.events = app.state.events.filter(e => e.id !== ev.id);
        app.saveState();
        if(app.currentTab === 'calendar') app.render_calendar(document.getElementById('content'));
        app.toast(`Evento cancelado: ${ev.title}`);
    } else {
        app.toast(`Evento não encontrado.`, 'error');
    }
};

// --- HÁBITOS ---
app.addHabitDirect = (name, tagsStr) => {
    const tags = tagsStr ? tagsStr.split(',').map(t=>t.trim().toLowerCase()) : [];
    app.state.habits.push({ id: app.uid(), name, tags, streaks:{} }); 
    app.saveState(); 
    if(app.currentTab === 'habits') app.render_habits(document.getElementById('content'));
    app.toast(`Hábito iniciado: ${name}`, 'success');
};

app.ai_deleteHabit = (name) => {
    const h = app.findItemByName(app.state.habits, name);
    if(h) {
        app.state.habits = app.state.habits.filter(x => x.id !== h.id);
        app.saveState();
        if(app.currentTab === 'habits') app.render_habits(document.getElementById('content'));
        app.toast(`Hábito removido: ${h.name}`);
    }
};

// --- POMODORO ---
app.ai_startPomo = (minutes) => {
    const mins = parseInt(minutes) || 25;
    if(typeof app.startTimer === 'function') {
        app.startTimer(mins);
        app.toast(`Pomodoro iniciado: ${mins} min`, 'success');
        // Se não estiver na aba pomodoro, avisa, mas funciona
        if(app.currentTab !== 'pomodoro') app.router('pomodoro');
    }
};

app.ai_stopPomo = () => {
    if(typeof app.stopTimer === 'function') {
        app.stopTimer();
        app.toast(`Pomodoro interrompido.`, 'warning');
    }
};

// Inicialização
window.fluxoAI = fluxoAI;
document.addEventListener('DOMContentLoaded', () => {
    const fab = document.getElementById('chatbot-fab');
    if (fab) fab.onclick = (e) => { e.stopPropagation(); fluxoAI.toggle(); };
});
