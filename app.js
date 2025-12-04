/**
 * ARQUIVO: js/app.js
 * (Substitua todo o conteúdo anterior por este atualizado)
 */

// 1. CONFIGURAÇÕES GLOBAIS (Constantes)
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

// Adicionado aqui para ficar disponível globalmente
const EV_CONFIG = {
    'meeting': { icon: 'ph-users', color: '#a855f7', label: 'Reunião' },
    'daily': { icon: 'ph-video-camera', color: '#3b82f6', label: 'Daily' },
    'deadline': { icon: 'ph-warning', color: '#ef4444', label: 'Prazo' },
    'other': { icon: 'ph-calendar-blank', color: '#94a3b8', label: 'Outro' }
};

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

    init() {
        console.log("Iniciando FLUXO..."); // Log para debug
        this.loadState();
        this.loadTheme();
        this.renderMenu();
        this.router('dashboard'); // Renderiza a primeira tela
        this.updateStorageStats();
        
        // Listeners globais
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
        if(!this.state.boards.length && this.seedKanban) this.seedKanban();
        this.currentBoardId = this.state.boards[0]?.id || null;
    },

    saveState() {
        try {
            localStorage.setItem('fluxo_v5', JSON.stringify(this.state));
            this.updateStorageStats();
        } catch (e) {
            if(this.toast) this.toast('Erro ao salvar (Storage cheio)', 'error');
        }
    },

    router(viewName) {
        this.currentTab = viewName;
        const conf = VIEWS[viewName];
        if(!conf) return;
        
        const titleEl = document.getElementById('pageTitle');
        const subEl = document.getElementById('pageSub');
        if(titleEl) titleEl.innerText = conf.label;
        if(subEl) subEl.innerText = viewName === 'dashboard' ? 'Bem-vindo de volta.' : `Gerenciamento de ${conf.label}`;
        
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`button[data-view="${viewName}"]`);
        if(btn) btn.classList.add('active');

        const root = document.getElementById('content');
        if(!root) return;
        root.innerHTML = '';
        
        // VERIFICAÇÃO DE SEGURANÇA
        if (typeof this[`render_${viewName}`] === 'function') {
            this[`render_${viewName}`](root);
        } else {
            root.innerHTML = `<div style="padding:20px; text-align:center; color:#94a3b8">Módulo <b>${conf.label}</b> ainda não carregado ou não implementado.</div>`;
            console.warn(`Função render_${viewName} não encontrada no objeto app.`);
        }
    },
    
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
            const pct = Math.min(100, (used/5000000)*100).toFixed(1);
            const sizeEl = document.getElementById('storageSize');
            const barEl = document.getElementById('storageBar');
            if(sizeEl) sizeEl.innerText = `${pct}%`;
            if(barEl) barEl.style.width = `${pct}%`;
        } catch(e) {}
    }
};