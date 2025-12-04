/**
 * ARQUIVO PRINCIPAL: js/app.js
 * Gerencia o estado, rotas, inicialização e integração com a nuvem.
 */

// 1. CONFIGURAÇÕES GLOBAIS
const VIEWS = {
    dashboard: { icon: 'ph-squares-four', label: 'Dashboard' },
    tasks:     { icon: 'ph-check-circle', label: 'Tarefas' },
    kanban:    { icon: 'ph-kanban', label: 'Kanban Projects' },
    calendar:  { icon: 'ph-calendar', label: 'Agenda & Eventos' },
    notes:     { icon: 'ph-notebook', label: 'Notas' },
    habits:    { icon: 'ph-fire', label: 'Hábitos' },
    pomodoro:  { icon: 'ph-timer', label: 'Pomodoro' },
    snippets:  { icon: 'ph-code', label: 'Snippets' },
    bookmarks: { icon: 'ph-bookmark', label: 'Bookmarks' },
    roadmap:   { icon: 'ph-path', label: 'Roadmap' },
    vault:     { icon: 'ph-files', label: 'Vault (PDF)' }
};

// Configuração de Eventos (Global)
const EV_CONFIG = {
    'meeting': { icon: 'ph-users', color: '#a855f7', label: 'Reunião' },
    'daily': { icon: 'ph-video-camera', color: '#3b82f6', label: 'Daily' },
    'deadline': { icon: 'ph-warning', color: '#ef4444', label: 'Prazo' },
    'other': { icon: 'ph-calendar-blank', color: '#94a3b8', label: 'Outro' }
};

// Estado Inicial Limpo
const DEFAULT_STATE = {
    tasks: [],
    kanbanCols: [
        {id:'todo', label:'A Fazer', color:'#6366f1'},
        {id:'doing', label:'Em Progresso', color:'#fbbf24'},
        {id:'done', label:'Concluído', color:'#34d399'}
    ],
    boards: [], cards: [], events: [], notes: [], habits: [],
    pomodoro: { history: [], settings: { work: 25, break: 5 } },
    snippets: [], bookmarks: [], roadmap: [], docs: [] 
};

// 2. OBJETO PRINCIPAL APP
const app = {
    state: {},
    timerInterval: null,
    calendarCursor: new Date(),
    currentBoardId: null,
    theme: 'dark',
    currentTab: 'dashboard',

    init() {
        console.log("Iniciando FLUXO OS...");
        
        // Carrega configurações locais
        this.loadState();
        this.loadTheme();
        this.renderMenu();
        
        // Inicializa Atalhos de Teclado
        this.initShortcuts();

        // Inicializa Nuvem (Login/Supabase) se o módulo existir
        if (this.cloud) this.cloud.init();

        // Renderiza a primeira tela (por trás do login)
        this.router('dashboard');
        this.updateStorageStats();

        // Listeners globais de UI
        const modal = document.getElementById('modal');
        if(modal) modal.addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });
        
        document.addEventListener('click', (e) => {
            if(window.innerWidth < 768 && e.target.closest('nav button')) {
                this.toggleSidebar();
            }
        });
    },

    loadState() {
        const raw = localStorage.getItem('fluxo_v5');
        this.state = raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : JSON.parse(JSON.stringify(DEFAULT_STATE));
        
        // Garante que tenha pelo menos 1 board se estiver vazio
        if(!this.state.boards || this.state.boards.length === 0) {
            const bid = this.uid();
            this.state.boards = [{ id: bid, title: 'Projeto Principal' }];
            this.currentBoardId = bid;
        } else {
            this.currentBoardId = this.state.boards[0].id;
        }
    },

    saveState() {
        try {
            // 1. Salva Localmente (Backup e Modo Convidado)
            localStorage.setItem('fluxo_v5', JSON.stringify(this.state));
            
            // 2. Salva na Nuvem (Se estiver logado)
            if(this.cloud) this.cloud.save();

            this.updateStorageStats();
        } catch (e) {
            if(this.toast) this.toast('Erro ao salvar (Storage cheio)', 'error');
        }
    },

    // --- ROTEAMENTO ---
    router(viewName) {
        this.currentTab = viewName;
        const conf = VIEWS[viewName];
        if(!conf) return;
        
        // Atualiza Títulos
        const titleEl = document.getElementById('pageTitle');
        const subEl = document.getElementById('pageSub');
        if(titleEl) titleEl.innerText = conf.label;
        if(subEl) subEl.innerText = viewName === 'dashboard' ? 'Bem-vindo de volta.' : `Gerenciamento de ${conf.label}`;
        
        // Atualiza Menu Ativo
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`button[data-view="${viewName}"]`);
        if(btn) btn.classList.add('active');

        // Renderiza Conteúdo
        const root = document.getElementById('content');
        if(!root) return;
        root.innerHTML = ''; // Limpa tela anterior
        
        if (typeof this[`render_${viewName}`] === 'function') {
            this[`render_${viewName}`](root);
        } else {
            root.innerHTML = `<div style="padding:40px; text-align:center;" class="muted">Módulo <b>${conf.label}</b> carregando...</div>`;
        }
    },
    
    // --- UI HELPERS ---
    renderMenu() {
        const menu = document.getElementById('menu');
        if(!menu) return;
        menu.innerHTML = Object.keys(VIEWS).map(k => 
            `<button onclick="app.router('${k}')" data-view="${k}"><i class="ph ${VIEWS[k].icon}"></i> ${VIEWS[k].label}</button>`
        ).join('');
    },
    
    toggleSidebar() {
        const sb = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if(sb) sb.classList.toggle('open');
        if(overlay) overlay.classList.toggle('show');
    },

    loadTheme() {
        const saved = localStorage.getItem('fluxo_theme') || 'dark';
        this.theme = saved;
        this.applyTheme();
    },

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('fluxo_theme', this.theme);
        this.applyTheme();
    },

    applyTheme() {
        const html = document.documentElement;
        const icon = document.getElementById('themeIcon');
        if (this.theme === 'light') {
            html.setAttribute('data-theme', 'light');
            if(icon) { icon.className = 'ph ph-sun'; icon.style.color = '#f59e0b'; }
        } else {
            html.removeAttribute('data-theme');
            if(icon) { icon.className = 'ph ph-moon'; icon.style.color = '#a855f7'; }
        }
    },

    updateStorageStats() {
        try {
            const used = new Blob([JSON.stringify(this.state)]).size;
            // Considerando 5MB padrão de localStorage
            const pct = Math.min(100, (used/5000000)*100).toFixed(1);
            const sizeEl = document.getElementById('storageSize');
            const barEl = document.getElementById('storageBar');
            if(sizeEl) sizeEl.innerText = `${pct}%`;
            if(barEl) barEl.style.width = `${pct}%`;
        } catch(e) {}
    },

    // --- CONTROLE DE ACESSO (Login/Guest) ---
    
    enterAsGuest() {
        localStorage.setItem('fluxo_guest_mode', 'true');
        this.hideLoginScreen();
        // Atualiza a sidebar para mostrar que é convidado
        if(this.cloud) this.cloud.updateUI(false);
        this.toast("Modo Convidado (Dados locais apenas)");
    },

    hideLoginScreen() {
        const screen = document.getElementById('login-screen');
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => screen.style.display = 'none', 500); // Espera animação CSS
        }
    },

    // --- ATALHOS DE TECLADO ---
    initShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignora se estiver digitando em campos de texto
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if(e.key === 'Escape') this.closeModal(); 
                return;
            }

            // Atalhos com ALT
            if (e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 't': // Nova Tarefa
                        e.preventDefault();
                        this.router('tasks');
                        setTimeout(() => document.getElementById('newTask')?.focus(), 200);
                        break;
                    case 'n': // Nova Nota
                        e.preventDefault();
                        this.router('notes');
                        setTimeout(() => this.newNote(), 200);
                        break;
                    case 'e': // Novo Evento
                        e.preventDefault();
                        this.router('calendar');
                        setTimeout(() => this.addEventPrompt(), 200);
                        break;
                    case '1': this.router('dashboard'); break;
                    case '2': this.router('tasks'); break;
                    case '3': this.router('kanban'); break;
                    case '4': this.router('calendar'); break;
                }
            }

            if (e.key === 'Escape') {
                this.closeModal();
                document.getElementById('sidebar')?.classList.remove('open');
                document.getElementById('overlay')?.classList.remove('show');
            }
        });
    }
};
