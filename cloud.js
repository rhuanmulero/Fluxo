/**
 * Módulo de Nuvem (Supabase Integration) - CORRIGIDO
 * Arquivo: js/cloud.js
 */

// COLE SUAS CHAVES AQUI NOVAMENTE
const SUPABASE_URL = 'https://sxucayghtnwqusovqnky.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dWNheWdodG53cXVzb3Zxbmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzc5NDUsImV4cCI6MjA4MDQxMzk0NX0._gWvp26nFVXY82fa_Rq0rg3sm4O8ZF1BIiLN4Q80cYg'; 

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

app.cloud = {
    user: null,

    async init() {
        // Verifica sessão ativa
        const { data } = await _supabase.auth.getSession();
        
        if (data.session) {
            // SE TIVER LOGADO: Esconde login, carrega dados
            this.handleLoginSuccess(data.session.user);
        } else {
            // SE NÃO TIVER LOGADO: Verifica se é convidado
            const isGuest = localStorage.getItem('fluxo_guest_mode');
            if (isGuest === 'true') {
                app.hideLoginScreen();
                console.log("Modo Convidado.");
                app.cloud.updateUI(false); // UI de convidado
            } else {
                // SE NEM CONVIDADO: Mostra tela de login (o CSS já mostra por padrão)
                console.log("Aguardando Login...");
            }
        }

        // Monitora mudanças (Login Google redireciona e cai aqui)
        _supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.handleLoginSuccess(session.user);
            }
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('fluxo_guest_mode');
                location.reload(); // Recarrega para bloquear a tela
            }
        });
    },

    async handleLoginSuccess(user) {
        this.user = user;
        console.log("Logado:", user.email);
        localStorage.removeItem('fluxo_guest_mode'); // Sai do modo convidado
        app.hideLoginScreen();
        this.updateUI(true);
        await this.loadFromCloud();
        // Renderiza o dashboard atualizado
        if(app.router) app.router(app.currentTab || 'dashboard');
    },

    // --- LOGIN GOOGLE ---
    async loginGoogle() {
        const { data, error } = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href // Volta para a mesma página
            }
        });
        if (error) app.toast(error.message, 'error');
    },

    // --- LOGIN EMAIL/SENHA ---
    async login(email, password) {
        // Tenta logar
        let { data, error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) {
            // Se falhar, tenta criar conta automaticamente (UX melhor)
            app.toast("Tentando criar conta...", "info");
            const res = await _supabase.auth.signUp({ email, password });
            if (res.error) return app.toast(res.error.message, 'error');
            app.toast("Conta criada! Verifique seu e-mail.", "success");
        } else {
            app.toast("Entrando...", "success");
        }
    },

    async logout() {
        await _supabase.auth.signOut();
    },

    async save() {
        if (!this.user) return; // Convidado não salva na nuvem
        const { error } = await _supabase.from('user_state').upsert({ 
            id: this.user.id, data: app.state, updated_at: new Date()
        });
    },

    async loadFromCloud() {
        if (!this.user) return;
        const { data } = await _supabase.from('user_state').select('data').single();
        if (data && data.data) {
            app.state = { ...app.state, ...data.data };
        }
    },

    updateUI(isLoggedIn) {
        const container = document.querySelector('aside > div:last-child');
        if (!container) return;
        
        // Limpa botão antigo
        const oldBtn = document.getElementById('authBtn');
        if(oldBtn) oldBtn.remove();

        const btn = document.createElement('div');
        btn.id = 'authBtn';
        btn.style.marginTop = '10px';
        btn.style.textAlign = 'center';

        if (isLoggedIn) {
            btn.innerHTML = `
                <div style="font-size:11px; color:var(--success); margin-bottom:5px">● ${this.user.email}</div>
                <button class="btn ghost danger" style="width:100%; font-size:12px" onclick="app.cloud.logout()">Sair</button>
            `;
        } else {
            btn.innerHTML = `
                <div style="font-size:11px; color:var(--warning); margin-bottom:5px">● Modo Convidado</div>
                <button class="btn ghost" style="width:100%; font-size:12px" onclick="app.cloud.logout()">Fazer Login</button>
            `;
        }
        container.appendChild(btn);
    }
};