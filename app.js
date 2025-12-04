/**
 * ARQUIVO PRINCIPAL: js/app.js
 * Gerencia estado, rotas, cache híbrido e inicialização.
 */

// 1. CONFIGURAÇÕES GLOBAIS DE NAVEGAÇÃO
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

// Configuração de Cores de Eventos (Global)
const EV_CONFIG = {
    'meeting': { icon: 'ph-users', color: '#a855f7', label: 'Reunião' },
    'daily': { icon: 'ph-video-camera', color: '#3b82f6', label: 'Daily' },
    'deadline': { icon: 'ph-warning', color: '#ef4444', label: 'Prazo' },
    'other': { icon: 'ph-calendar-blank', color: '#94a3b8', label: 'Outro' }
};

// Estado Inicial Limpo (Template)
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

    // --- INICIALIZAÇÃO ---
    init() {
        console.log("Iniciando FLUXO OS...");
        
        // 1. Configurações Visuais
        this.loadTheme();
        this.renderMenu();
        
        // 2. Atalhos de Teclado
        if(this.initShortcuts) this.initShortcuts();

        // 3. CARREGAMENTO DE DADOS (CRÍTICO)
        // Carrega do cache local imediatamente para não piscar tela vazia no F5
        this.loadInitialState();

        // 4. Conexão com Nuvem (Background)
        // Se estiver logado, o cloud.js vai baixar dados novos e atualizar a tela depois
        if (this.cloud) this.cloud.init();

        // 5. Renderiza a tela inicial
        this.router('dashboard');
        
        // Listeners UI Globais
        const modal = document.getElementById('modal');
        if(modal) modal.addEventListener('click', (e) => { if (e.target.id === 'modal') this.closeModal(); });
        
        document.addEventListener('click', (e) => {
            if(window.innerWidth < 768 && e.target.closest('nav button')) {
                this.toggleSidebar();
            }
        });
    },

    // --- GERENCIAMENTO DE ESTADO E CACHE ---
    loadInitialState() {
        // Tenta recuperar Cache de Usuário Logado (protege contra F5)
        const userCache = localStorage.getItem('fluxo_user_cache');
        // Tenta recuperar Dados de Convidado
        const guestData = localStorage.getItem('fluxo_guest_data');

        if (userCache) {
            console.log("Cache de usuário carregado.");
            this.state = { ...DEFAULT_STATE, ...JSON.parse(userCache) };
        } else if (guestData) {
            console.log("Dados de convidado carregados.");
            this.state = { ...DEFAULT_STATE, ...JSON.parse(guestData) };
        } else {
            console.log("Iniciando estado limpo.");
            this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }

        // Garante integridade: Sempre deve haver pelo menos 1 board
        if(!this.state.boards || this.state.boards.length === 0) {
            // Nota: app.uid() vem do utils.js, que já deve estar carregado
            const bid = this.uid ? this.uid() : Date.now().toString(); 
            this.state.boards = [{ id: bid, title: 'Projeto Principal' }];
            this.currentBoardId = bid;
        } else {
            // Define o board atual como o primeiro da lista
            this.currentBoardId = this.state.boards[0].id;
        }
    },

    saveState() {
        // Identifica o modo de operação
        const isGuest = localStorage.getItem('fluxo_guest_mode') === 'true';
        const isLoggedIn = this.cloud && this.cloud.user;

        try {
            if (isGuest) {
                // Modo Convidado: Salva apenas localmente no slot de convidado
                localStorage.setItem('fluxo_guest_data', JSON.stringify(this.state));
            } else if (isLoggedIn) {
                // Modo Logado: Salva no CACHE (para F5) e na NUVEM (para Sync)
                localStorage.setItem('fluxo_user_cache', JSON.stringify(this.state));
                this.cloud.save(); // Chama o salvamento do Supabase
            }

            this.updateStorageStats();
        } catch (e) {
            console.error("Erro ao salvar estado:", e);
            if(this.toast) this.toast('Erro ao salvar localmente', 'error');
        }
    },

    // --- ROTEAMENTO (NAVEGAÇÃO) ---
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
        root.innerHTML = ''; 
        
        // Chama a função render_NOMEDOMODULO se existir
        if (typeof this[`render_${viewName}`] === 'function') {
            this[`render_${viewName}`](root);
        } else {
            root.innerHTML = `<div style="padding:40px; text-align:center;" class="muted">Carregando módulo <b>${conf.label}</b>...</div>`;
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
            // Considerando 5MB padrão
            const pct = Math.min(100, (used/5000000)*100).toFixed(1);
            const sizeEl = document.getElementById('storageSize');
            const barEl = document.getElementById('storageBar');
            if(sizeEl) sizeEl.innerText = `${pct}%`;
            if(barEl) barEl.style.width = `${pct}%`;
        } catch(e) {}
    },

    // --- CONTROLE DE ACESSO (MODO CONVIDADO) ---
    enterAsGuest() {
        localStorage.setItem('fluxo_guest_mode', 'true');
        this.hideLoginScreen();
        
        // Se tiver dados de convidado antigos, eles já foram carregados no init.
        // Se não, salva o estado inicial limpo como convidado.
        this.saveState();

        if(this.cloud) this.cloud.updateUI(false);
        this.toast("Modo Convidado (Dados salvos apenas neste PC)");
    },

    hideLoginScreen() {
        const screen = document.getElementById('login-screen');
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => screen.style.display = 'none', 500);
        }
    },

    // --- ATALHOS DE TECLADO ---
    initShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if(e.key === 'Escape') this.closeModal(); 
                return;
            }

            if (e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 't': e.preventDefault(); this.router('tasks'); setTimeout(() => document.getElementById('newTask')?.focus(), 200); break;
                    case 'n': e.preventDefault(); this.router('notes'); setTimeout(() => this.newNote(), 200); break;
                    case 'e': e.preventDefault(); this.router('calendar'); setTimeout(() => this.addEventPrompt(), 200); break;
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
        console.log("Atalhos inicializados.");
    }
};

window.app = app;
