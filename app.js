/**
 * ARQUIVO PRINCIPAL: js/app.js
 * Gerencia o núcleo do sistema: Rotas, Estado, UI, Atalhos e Nuvem.
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
        
        // Recupera estado do menu retrátil (Desktop)
        const isCollapsed = localStorage.getItem('fluxo_sidebar_collapsed') === 'true';
        const sb = document.getElementById('sidebar');
        if (sb && isCollapsed) sb.classList.add('collapsed');

        this.renderMenu();
        
        // 2. Atalhos de Teclado
        if(this.initShortcuts) this.initShortcuts();

        // 3. Carregamento de Dados (Cache Híbrido)
        this.loadInitialState();

        // 4. Conexão com Nuvem (Se disponível)
        if (this.cloud) this.cloud.init();

        // 5. Renderiza tela inicial
        this.router('dashboard');
        
        // Listeners Globais
        const modal = document.getElementById('modal');
        if(modal) modal.addEventListener('click', (e) => { if (e.target.id === 'modal') this.closeModal(); });
        
        document.addEventListener('click', (e) => {
            // Fecha sidebar mobile ao clicar fora ou em link
            if(window.innerWidth < 768 && e.target.closest('nav button')) {
                this.toggleSidebar();
            }
        });
    },

    // --- GERENCIAMENTO DE ESTADO ---
    loadInitialState() {
        // Recupera cache local para evitar "piscada" no F5
        const userCache = localStorage.getItem('fluxo_user_cache');
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

        // Garante integridade mínima (Boards)
        if(!this.state.boards || this.state.boards.length === 0) {
            const bid = this.uid ? this.uid() : Date.now().toString(); 
            this.state.boards = [{ id: bid, title: 'Projeto Principal' }];
            this.currentBoardId = bid;
        } else {
            this.currentBoardId = this.state.boards[0].id;
        }
    },

    saveState() {
        const isGuest = localStorage.getItem('fluxo_guest_mode') === 'true';
        const isLoggedIn = this.cloud && this.cloud.user;

        try {
            if (isGuest) {
                // Modo Convidado: Salva Local
                localStorage.setItem('fluxo_guest_data', JSON.stringify(this.state));
            } else if (isLoggedIn) {
                // Modo Logado: Salva Cache + Nuvem
                localStorage.setItem('fluxo_user_cache', JSON.stringify(this.state));
                this.cloud.save(); 
            }
            this.updateStorageStats();
        } catch (e) {
            console.error("Erro ao salvar:", e);
        }
    },

    // --- ROTEAMENTO ---
    router(viewName) {
        this.currentTab = viewName;
        const conf = VIEWS[viewName];
        if(!conf) return;
        
        // Atualiza Header
        const titleEl = document.getElementById('pageTitle');
        const subEl = document.getElementById('pageSub');
        if(titleEl) titleEl.innerText = conf.label;
        if(subEl) subEl.innerText = viewName === 'dashboard' ? 'Bem-vindo de volta.' : `Gerenciamento de ${conf.label}`;
        
        // Atualiza Menu
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`button[data-view="${viewName}"]`);
        if(btn) btn.classList.add('active');

        // Renderiza
        const root = document.getElementById('content');
        if(!root) return;
        root.innerHTML = ''; 
        
        if (typeof this[`render_${viewName}`] === 'function') {
            this[`render_${viewName}`](root);
        } else {
            root.innerHTML = `<div style="padding:40px; text-align:center;" class="muted">Módulo <b>${conf.label}</b> em construção...</div>`;
        }
    },
    
    // --- UI & TEMAS ---
    renderMenu() {
        const menu = document.getElementById('menu');
        if(!menu) return;
        // Importante: Texto dentro de <span> para ocultar no modo recolhido
        menu.innerHTML = Object.keys(VIEWS).map(k => 
            `<button onclick="app.router('${k}')" data-view="${k}">
                <i class="ph ${VIEWS[k].icon}"></i> 
                <span>${VIEWS[k].label}</span>
            </button>`
        ).join('');
    },
    
    // Mobile Toggle
    toggleSidebar() {
        const sb = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if(sb) sb.classList.toggle('open');
        if(overlay) overlay.classList.toggle('show');
    },

    // Desktop Toggle (Recolher)
    toggleSidebarDesktop() {
        const sb = document.getElementById('sidebar');
        if(sb) {
            sb.classList.toggle('collapsed');
            localStorage.setItem('fluxo_sidebar_collapsed', sb.classList.contains('collapsed'));
        }
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
            const pct = Math.min(100, (used/5000000)*100).toFixed(1);
            const sizeEl = document.getElementById('storageSize');
            const barEl = document.getElementById('storageBar');
            if(sizeEl) sizeEl.innerText = `${pct}%`;
            if(barEl) barEl.style.width = `${pct}%`;
        } catch(e) {}
    },

    // --- CONTROLE DE ACESSO ---
    enterAsGuest() {
        localStorage.setItem('fluxo_guest_mode', 'true');
        this.hideLoginScreen();
        // Salva estado inicial para garantir funcionamento
        this.saveState(); 
        if(this.cloud) this.cloud.updateUI(false);
        this.toast("Modo Convidado (Offline)");
    },

    hideLoginScreen() {
        const screen = document.getElementById('login-screen');
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => screen.style.display = 'none', 500);
        }
    },

    // --- AJUDA & ATALHOS ---
    showShortcutsHelp() {
        this.openModal(`
            <div style="text-align:left">
                <h3 style="border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:20px">⌨️ Atalhos de Teclado</h3>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; font-size:13px">
                    <div>
                        <strong class="muted">NAVEGAÇÃO (ALT + Nº)</strong>
                        <div style="display:flex; justify-content:space-between; margin-top:8px"><span>Dashboard</span> <code style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px">Alt + 1</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Tarefas</span> <code>Alt + 2</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Kanban</span> <code>Alt + 3</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Agenda</span> <code>Alt + 4</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Notas</span> <code>Alt + 5</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Hábitos</span> <code>Alt + 6</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Pomodoro</span> <code>Alt + 7</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Snippets</span> <code>Alt + 8</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Bookmarks</span> <code>Alt + 9</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Roadmap</span> <code>Alt + 0</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Vault</span> <code>Alt + -</code></div>
                    </div>
                    
                    <div>
                        <strong class="muted">AÇÕES RÁPIDAS (ALT + LETRA)</strong>
                        <div style="display:flex; justify-content:space-between; margin-top:8px"><span>Nova Tarefa</span> <code>Alt + T</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Nova Nota</span> <code>Alt + N</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Novo Evento</span> <code>Alt + E</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Novo Snippet</span> <code>Alt + S</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Novo Hábito</span> <code>Alt + H</code></div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Novo Bookmark</span> <code>Alt + B</code></div>
                        
                        <div style="margin-top:15px; border-top:1px solid var(--border); padding-top:10px">
                            <strong class="muted">SISTEMA</strong>
                            <div style="display:flex; justify-content:space-between; margin-top:8px"><span>Falar com IA</span> <code>Alt + I</code></div>
                            <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Recolher Menu</span> <code>Alt + M</code></div>
                            <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Ajuda</span> <code>Shift + ?</code></div>
                            <div style="display:flex; justify-content:space-between; margin-top:5px"><span>Fechar Janela</span> <code>Esc</code></div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn" onclick="app.closeModal()">Entendi</button>
                </div>
            </div>
        `);
    },

    initShortcuts() {
        document.addEventListener('keydown', (e) => {
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

            if (isTyping) {
                if(e.key === 'Escape') this.closeModal();
                if((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    const btn = document.querySelector('.modal-actions .btn:not(.ghost)');
                    if(btn) btn.click();
                }
                return;
            }

            if (e.key === '?') {
                this.showShortcutsHelp();
                return;
            }

            if (e.altKey) {
                e.preventDefault();
                switch(e.key.toLowerCase()) {
                    // Navegação
                    case '1': this.router('dashboard'); break;
                    case '2': this.router('tasks'); break;
                    case '3': this.router('kanban'); break;
                    case '4': this.router('calendar'); break;
                    case '5': this.router('notes'); break;
                    case '6': this.router('habits'); break;
                    case '7': this.router('pomodoro'); break;
                    case '8': this.router('snippets'); break;
                    case '9': this.router('bookmarks'); break;
                    case '0': this.router('roadmap'); break;
                    case '-': this.router('vault'); break;

                    // Ações
                    case 't': this.router('tasks'); setTimeout(() => document.getElementById('newTask')?.focus(), 200); break;
                    case 'n': this.router('notes'); setTimeout(() => this.newNote(), 200); break;
                    case 'e': this.router('calendar'); setTimeout(() => this.addEventPrompt(), 200); break;
                    case 's': this.router('snippets'); setTimeout(() => document.getElementById('sTitle')?.focus(), 200); break;
                    case 'h': this.router('habits'); setTimeout(() => document.getElementById('hName')?.focus(), 200); break;
                    case 'b': this.router('bookmarks'); setTimeout(() => this.addBookmarkPrompt(), 200); break;

                    // Sistema
                    case 'm': this.toggleSidebarDesktop(); break;
                    case 'i': if(window.fluxoAI) fluxoAI.toggle(); break;
                }
            }

            if (e.key === 'Escape') {
                this.closeModal();
                const aiWin = document.getElementById('chatbot-window');
                if(aiWin && aiWin.style.display !== 'none') fluxoAI.toggle();
                
                document.getElementById('sidebar')?.classList.remove('open');
                document.getElementById('overlay')?.classList.remove('show');
            }
        });
        console.log("⌨️ Atalhos carregados. Pressione '?' para ver a lista.");
    }
};

// Garante acesso global
window.app = app;
