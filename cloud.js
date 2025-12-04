/**
 * Módulo de Nuvem (Supabase Integration) - CORRIGIDO
 * Arquivo: js/cloud.js
 */

// COLE SUAS CHAVES AQUI NOVAMENTE
const SUPABASE_URL = 'https://sxucayghtnwqusovqnky.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dWNheWdodG53cXVzb3Zxbmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzc5NDUsImV4cCI6MjA4MDQxMzk0NX0._gWvp26nFVXY82fa_Rq0rg3sm4O8ZF1BIiLN4Q80cYg'; 

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

app.cloud = {
    user: null,

    async init() {
        // Verifica sessão
        const { data } = await _supabase.auth.getSession();
        
        if (data.session) {
            this.handleLoginSuccess(data.session.user);
        } else {
            const isGuest = localStorage.getItem('fluxo_guest_mode');
            if (isGuest === 'true') {
                app.hideLoginScreen();
                this.updateUI(false);
            } else {
                console.log("Aguardando Login...");
            }
        }

        _supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') this.handleLoginSuccess(session.user);
            if (event === 'SIGNED_OUT') this.handleLogoutCleanup();
        });
    },

    async handleLoginSuccess(user) {
        this.user = user;
        localStorage.removeItem('fluxo_guest_mode'); // Sai do modo convidado
        app.hideLoginScreen();
        this.updateUI(true);
        
        // CARREGA DADOS DA NUVEM (E SOBRESCREVE O LOCAL)
        await this.loadFromCloud();
        
        // Pega o nome do Google (se houver) para o Dashboard
        if(user.user_metadata && user.user_metadata.full_name) {
            app.userName = user.user_metadata.full_name.split(' ')[0]; // Primeiro nome
        }
        
        // Atualiza a tela
        if(app.router) app.router(app.currentTab || 'dashboard');
    },

    handleLogoutCleanup() {
        this.user = null;
        app.state = {}; // ZERA O ESTADO NA MEMÓRIA
        localStorage.removeItem('fluxo_v5'); // APAGA O DISCO LOCAL
        localStorage.removeItem('fluxo_guest_mode');
        location.reload(); // Recarrega para bloquear a tela
    },

    // --- LOGIN GOOGLE ---
    async loginGoogle() {
        const { data, error } = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
        if (error) app.toast(error.message, 'error');
    },

    async login(email, password) {
        let { data, error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) {
            app.toast("Criando conta...", "info");
            const res = await _supabase.auth.signUp({ email, password });
            if (res.error) return app.toast(res.error.message, 'error');
            app.toast("Conta criada! Verifique seu e-mail.", "success");
        }
    },

    async logout() {
        await _supabase.auth.signOut();
    },

    async save() {
        if (!this.user) return; 
        // Salva na nuvem
        const { error } = await _supabase.from('user_state').upsert({ 
            id: this.user.id, data: app.state, updated_at: new Date()
        });
        if (error) console.error("Erro ao salvar nuvem:", error);
    },

    async loadFromCloud() {
        if (!this.user) return;
        app.toast("Sincronizando...", "info");

        const { data, error } = await _supabase
            .from('user_state')
            .select('data')
            .single();

        if (data && data.data) {
            // AQUI É O PULO DO GATO:
            // Sobrescrevemos o estado local com o da nuvem completamente
            app.state = data.data; 
            
            // Salva no localStorage apenas para cache, mas a fonte da verdade é a nuvem
            localStorage.setItem('fluxo_v5', JSON.stringify(app.state));
            console.log("Dados baixados da nuvem.");
        } else {
            console.log("Nenhum dado na nuvem ainda. Iniciando novo perfil.");
        }
    },

    updateUI(isLoggedIn) {
        const container = document.querySelector('aside > div:last-child');
        if (!container) return;
        const oldBtn = document.getElementById('authBtn');
        if(oldBtn) oldBtn.remove();

        const btn = document.createElement('div');
        btn.id = 'authBtn';
        btn.style.marginTop = '10px';
        btn.style.textAlign = 'center';

        if (isLoggedIn) {
            const name = this.user.user_metadata.full_name || this.user.email;
            btn.innerHTML = `
                <div style="font-size:11px; color:var(--success); margin-bottom:5px">● ${name}</div>
                <button class="btn ghost danger" style="width:100%; font-size:12px" onclick="app.cloud.logout()">Sair</button>
            `;
        } else {
            btn.innerHTML = `
                <div style="font-size:11px; color:var(--warning); margin-bottom:5px">● Convidado</div>
                <button class="btn ghost" style="width:100%; font-size:12px" onclick="app.cloud.logout()">Fazer Login</button>
            `;
        }
        container.appendChild(btn);
    }
};
