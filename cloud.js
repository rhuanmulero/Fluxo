/**
 * Módulo de Nuvem (CORRIGIDO V3)
 */

console.log("☁️ Carregando Cloud...");

// 1. CRIA UM "DUMMY" TEMPORÁRIO
// Isso garante que o botão no HTML nunca dê erro de "undefined", mesmo se o script quebrar depois.
if (typeof window.app !== 'undefined') {
    window.app.cloud = {
        loginGoogle: () => alert("⚠️ O sistema de Nuvem não iniciou. Verifique se colou as CHAVES no arquivo cloud.js!"),
        init: () => console.warn("Cloud aguardando configuração..."),
        updateUI: () => {}
    };
}

// COLOQUE SUAS CHAVES AQUI
const SB_URL = 'https://sxucayghtnwqusovqnky.supabase.co'; 
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dWNheWdodG53cXVzb3Zxbmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzc5NDUsImV4cCI6MjA4MDQxMzk0NX0._gWvp26nFVXY82fa_Rq0rg3sm4O8ZF1BIiLN4Q80cYg'; 

let _client = null;

try {
    if (SB_URL.includes('COLE_SUA')) console.error("❌ Chaves não configuradas.");
    
    _client = window.supabase.createClient(SB_URL, SB_KEY);
    console.log("✅ Supabase Conectado.");

} catch (err) {
    console.error("❌ ERRO CLOUD:", err);
}

const cloudModule = {
    user: null,

    async init() {
        if (!_client) return;

        // 1. Verifica se JÁ existe uma sessão salva (Corrige o problema do F5)
        const { data } = await _client.auth.getSession();
        
        if (data?.session) {
            console.log("🔄 Sessão restaurada.");
            this.handleLoginSuccess(data.session.user);
        } else {
            console.log("🔒 Nenhum usuário. Tela bloqueada.");
            // Não faz nada, deixa a tela de login aparecer (que é o padrão do HTML)
            // Apenas remove o modo convidado antigo se existir
            localStorage.removeItem('fluxo_guest_mode');
            this.updateUI(false);
        }

        // 2. Escuta eventos de Login (Google redirect cai aqui)
        _client.auth.onAuthStateChange((evt, session) => {
            if (evt === 'SIGNED_IN' && session) {
                this.handleLoginSuccess(session.user);
            }
            if (evt === 'SIGNED_OUT') {
                window.location.reload();
            }
        });
    },

    async loginGoogle() {
        if (!_client) return alert("Erro de configuração.");
        const { error } = await _client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
        if (error) alert("Erro Google: " + error.message);
    },

    async handleLoginSuccess(user) {
        this.user = user;
        
        // --- LIMPEZA DA URL (CORREÇÃO DA URL GIGANTE) ---
        // Remove o #access_token... da barra de endereço sem recarregar
        if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
        }
        // ------------------------------------------------

        if(window.app) {
            if(user.user_metadata?.full_name) app.userName = user.user_metadata.full_name.split(' ')[0];
            
            // Libera o app
            app.hideLoginScreen();
            this.updateUI(true);
            
            // Carrega dados
            this.loadFromCloud();
        }
    },

    async logout() {
        console.log("Saindo...");
        
        // 1. Limpeza de dados locais do FLUXO
        localStorage.removeItem('fluxo_user_cache');
        localStorage.removeItem('fluxo_guest_mode');
        localStorage.removeItem('fluxo_google_key');
        
        // 2. Aguarda o Supabase finalizar o logout completamente
        if(_client) {
            await _client.auth.signOut();
        }
        
        // 3. Só agora recarrega a página
        window.location.reload();
    },

    async save() {
        if(!this.user || !_client) return;
        // Salva estado
        await _client.from('user_state').upsert({ 
            id: this.user.id, data: app.state, updated_at: new Date()
        });
    },

    async loadFromCloud() {
        if(!this.user || !_client) return;
        
        const { data } = await _client.from('user_state').select('data').single();
        
        if(data?.data && window.app) {
            app.state = { ...app.state, ...data.data };
            // Atualiza cache local para o próximo F5 ser rápido
            localStorage.setItem('fluxo_user_cache', JSON.stringify(app.state));
            
            if(app.router) app.router('dashboard');
            if(app.fetchWeather) app.fetchWeather();
        }
    },

updateUI(isLoggedIn) {
        const container = document.querySelector('aside > div:last-child');
        if (!container) return;
        
        const existing = document.getElementById('authBtn');
        if(existing) existing.remove();

        const div = document.createElement('div');
        div.id = 'authBtn';
        div.style.textAlign = 'center';
        div.style.marginTop = '15px'; // Um pouco de espaço do storage
        
        if(isLoggedIn) {
            // Logado: Mostra nome pequeno e Link de Sair (Estilo Minimalista)
            const name = app.userName || (this.user?.email ? this.user.email.split('@')[0] : 'Usuário');
            
            div.innerHTML = `
                <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px">
                    Olá, <span style="color:var(--text-main); font-weight:600">${name}</span>
                </div>
                
                <a onclick="app.cloud.logout()" style="color: #ef4444; text-decoration: none; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    <i class="ph ph-sign-out"></i> Sair
                </a>
            `;
        } else {
            // Deslogado: Botão normal para chamar atenção
            div.innerHTML = `<button class="btn ghost" style="font-size:12px; width:100%" onclick="location.reload()">Fazer Login</button>`;
        }
        container.appendChild(div);
    },

    async login(e, p) {
        if (!_client) return;
        const { error } = await _client.auth.signInWithPassword({ email:e, password:p });
        if(error) {
            const res = await _client.auth.signUp({ email:e, password:p });
            if(res.error) alert(res.error.message);
            else alert("Conta criada! Verifique seu e-mail.");
        }
    }
};

// Vincula ao App
const bindCloud = setInterval(() => {
    if (typeof window.app !== 'undefined') {
        window.app.cloud = cloudModule;
        clearInterval(bindCloud);
    }
}, 100);

