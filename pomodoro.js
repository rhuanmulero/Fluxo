/**
 * Módulo Pomodoro (Foco)
 */

// Assets definidos externamente à função de render para fácil acesso
app.pomoAssets = {
    gifs: {
        focus: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG1wdndsNjB5b25qZDh4aTltazRiMDhlaTNybWNxNGF2YTJyZWcyNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mjTpgz6FGNVDoMg5lx/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bDdmeWJvdTJ0cTVoaWV6dWJmb2pwMjhqdnFtcm0wNml2MmltMHdlaiZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/KxbHmvL3MGcctzlfdX/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bDdmeWJvdTJ0cTVoaWV6dWJmb2pwMjhqdnFtcm0wNml2MmltMHdlaiZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/Basrh159dGwKY/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3azRiMWZjOGZuaGNiY2k4aGhkaHdkaWE3cTd5MXoyZHh5Y29wZ3F0eiZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/ckr4W2ppxPBeIF8dx4/giphy.gif",
        ],
        break: [
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cWhkMWppNnY1ZzNwdmo0OHhmNmZuMHl6aGJjYnFod2ZqNzhnbjIybiZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/xWMPYx55WNhX136T0V/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a3FjazM0OHVkb2M2a3NieWpnYmRmM2hjcTQ1Z2k4dG83cXF3ZzF3dyZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/iF2AMbSYPQ7PKof26V/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bmI5bHNrbXM3eGo0aW01bDFrM2VwOXpia3E4bWI5ZDFhMTEzd3djZSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/RMwgs5kZqkRyhF24KK/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYm50cTF5MzJieDM3N3QwMGJuNzhmZXZjeHdwZmpoYjR0NXhpeHl0NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oz8xKkuY65HJlC4lq/giphy.gif"
        ]
    },
    sounds: {
        rain: { url: 'https://assets.mixkit.co/active_storage/sfx/2493/2493-preview.mp3', label: 'Chuva Pesada', icon: 'ph-cloud-rain' },
        forest: { url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_39447470b8.mp3', label: 'Floresta Noturna', icon: 'ph-tree' },
        lofi: { url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', label: 'Lofi City', icon: 'ph-headphones' },
        coffee: { url: 'https://assets.mixkit.co/active_storage/sfx/139/139-preview.mp3', label: 'Cafeteria', icon: 'ph-coffee' },
        keyboard: { url: '', label: 'Teclado Mecânico', icon: 'ph-keyboard' },
        white: { url: '', label: 'White Noise', icon: 'ph-waves' }
    }
};

app.render_pomodoro = (root) => {
    // Inicialização de Estado e Áudio (Singleton Pattern para não recriar audio a cada render)
    if (!app.state.pomodoro.history) app.state.pomodoro.history = [];
    if (!app.state.pomodoro.sounds) app.state.pomodoro.sounds = {};
    
    if (!app.pomodoroSounds) {
        app.pomodoroSounds = {};
        Object.keys(app.pomoAssets.sounds).forEach(key => {
            // Verifica se a URL não é vazia antes de criar Audio
            if(app.pomoAssets.sounds[key].url) {
                const audio = new Audio(app.pomoAssets.sounds[key].url);
                audio.loop = true; 
                audio.volume = 0.5;
                app.pomodoroSounds[key] = audio;
            } else {
                // Placeholder para sons sem URL (ex: keyboard)
                app.pomodoroSounds[key] = { play:()=>{}, pause:()=>{}, paused: true };
            }
        });
    }
    
    if (!app.currentGif) app.currentGif = app.pomoAssets.gifs.focus[0];

    // CSS Injetado específico deste módulo
    const style = `
    <style>
        .pomo-wrapper { display: flex; flex-wrap: wrap; gap: 24px; height: 100%; align-content: center; overflow-y: auto; }
        .pomo-section { flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 20px; }
        .wd-player { background: rgba(15, 23, 42, 0.9); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.5); height: 100%; }
        .wd-screen { height: 200px; position: relative; background: black; border-bottom: 2px solid var(--primary); }
        .wd-screen img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
        .wd-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 50%); pointer-events: none; }
        .wd-playlist { padding: 0; margin: 0; list-style: none; overflow-y: auto; flex: 1; }
        .wd-track { 
            padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; 
            font-family: 'Courier New', monospace; font-size: 13px; letter-spacing: -0.5px;
        }
        .wd-track:hover { background: rgba(255,255,255,0.05); padding-left: 20px; }
        .wd-track.active { background: rgba(99, 102, 241, 0.15); border-left: 3px solid var(--accent); color: var(--accent); font-weight: bold; }
        .wd-track i { font-size: 18px; width: 24px; text-align: center; }
        .time-input-group { 
            display: flex !important; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px; 
            background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 30px; 
            border: 1px solid var(--border); width: fit-content; margin-left: auto; margin-right: auto; 
        }
        .time-input { 
            background: transparent; border: none; color: var(--text-main); font-size: 18px; font-weight: 700; width: 50px; text-align: center; border-bottom: 2px solid var(--primary); 
            -moz-appearance: textfield;
        }
        .time-input::-webkit-outer-spin-button, .time-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @media (max-width: 768px) {
            .pomo-wrapper { flex-direction: column; height: auto; padding-bottom: 80px; }
            .pomo-section { min-width: 100%; }
            .wd-screen { height: 150px; }
        }
    </style>`;

    root.innerHTML = style + `
        <div class="pomo-wrapper">
            <!-- Esquerda: Controle do Timer -->
            <div class="pomo-section">
                <div class="card" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; position:relative; overflow:hidden;">
                    
                    <div style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:var(--accent); margin-bottom:15px; font-weight:700">Fluxo Profundo</div>
                    
                    <div style="position:relative; width:240px; height:240px; margin-bottom:25px;">
                        <svg width="240" height="240" style="transform: rotate(-90deg);">
                            <circle cx="120" cy="120" r="110" stroke="rgba(255,255,255,0.05)" stroke-width="6" fill="transparent"/>
                            <circle id="pomoProgress" cx="120" cy="120" r="110" stroke="url(#grad1)" stroke-width="6" fill="transparent" stroke-dasharray="691" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear; stroke-linecap: round;"/>
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column;">
                            <div id="pomoDisplay" style="font-size:56px; font-weight:700; font-family:monospace; letter-spacing:-2px; line-height:1;">--:--</div>
                            <div id="pomoMode" class="muted" style="margin-top:5px; font-size:12px">Aguardando</div>
                        </div>
                    </div>

                    <div class="time-input-group">
                        <i class="ph ph-timer" style="color:var(--text-muted)"></i>
                        <input id="customMinutes" class="time-input" type="number" value="25" min="1" max="120">
                        <span style="font-size:12px; text-transform:uppercase; font-weight:600; color:var(--text-muted)">Minutos</span>
                    </div>

                    <button class="btn" style="padding:12px 40px; border-radius:30px; font-size:16px; box-shadow: 0 0 20px rgba(99,102,241,0.3); margin-bottom:20px; width:100%; max-width:260px;" 
                        onclick="app.startCustomTimer()">
                        <i class="ph ph-play"></i> INICIAR FOCO
                    </button>
                    
                    <div style="display:flex; gap:8px; justify-content:center; width:100%">
                        <button class="btn ghost" style="font-size:12px" onclick="app.setInputValue(5); app.startCustomTimer(true)">Pausa Curta</button>
                        <button class="btn ghost" style="font-size:12px" onclick="app.setInputValue(15); app.startCustomTimer(true)">Pausa Longa</button>
                        <button class="btn danger ghost" style="font-size:12px" onclick="app.stopTimer()">Parar</button>
                    </div>

                    <div style="margin-top:20px; padding-top:15px; border-top:1px solid var(--border); display:flex; gap:30px; text-align:center;">
                        <div>
                            <div class="muted" style="font-size:10px">SESSÕES</div>
                            <div style="font-weight:700; font-size:16px">${app.state.pomodoro.history.filter(h => h.date === new Date().toISOString().slice(0, 10)).length}</div>
                        </div>
                        <div>
                            <div class="muted" style="font-size:10px">TEMPO (H)</div>
                            <div style="font-weight:700; font-size:16px">${(app.state.pomodoro.history.filter(h => h.date === new Date().toISOString().slice(0, 10)).reduce((a, b) => a + (b.duration || 25), 0) / 60).toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Direita: Player e GIF -->
            <div class="pomo-section">
                <div class="wd-player">
                    
                    <div class="wd-screen">
                        <img id="pomoGif" src="${app.currentGif}">
                        <div class="wd-overlay"></div>
                        <button onclick="app.changeGif(app.pomoIsBreak ? 'break' : 'focus')" class="btn ghost" 
                            style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:4px; font-size:10px; border:1px solid rgba(255,255,255,0.2)">
                            <i class="ph ph-shuffle"></i> CAM
                        </button>
                        <div style="position:absolute; bottom:10px; left:15px; color:white; font-family:'Courier New', monospace;">
                            <div style="font-size:10px; opacity:0.7">VISUALIZER.EXE</div>
                            <div style="font-weight:bold; font-size:14px; color:var(--primary)">AMBIENTE CONECTADO</div>
                        </div>
                    </div>

                    <div style="padding:10px 15px; background:rgba(0,0,0,0.3); font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700; display:flex; justify-content:space-between;">
                        <span>Sound Layers</span>
                        <span><i class="ph ph-faders"></i> Mixer</span>
                    </div>

                    <ul class="wd-playlist">
                        ${Object.keys(app.pomoAssets.sounds).map(key => `
                            <li id="track-${key}" class="wd-track" onclick="app.toggleSound('${key}')">
                                <i class="ph ${app.pomoAssets.sounds[key].icon}"></i>
                                <div style="flex:1">${app.pomoAssets.sounds[key].label}</div>
                                <i class="ph ph-wave-sine" style="opacity: ${app.state.pomodoro.sounds[key] ? '1' : '0.1'}"></i>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    app.refreshAudioButtons();
    if (app.pomoActive) app.updatePomodoroUI();
};

// --- FUNÇÕES AUXILIARES GLOBAIS ---

app.setInputValue = (val) => {
    const input = document.getElementById('customMinutes');
    if(input) input.value = val;
};

app.startCustomTimer = (isBreak = false) => {
    const input = document.getElementById('customMinutes');
    let val = 25; 

    if (input) {
        val = parseInt(input.value);
        if (isNaN(val) || val <= 0) {
            val = 25; 
            app.toast("Tempo inválido! Usando 25 minutos.", "warning");
        }
    }
    app.startTimer(val, isBreak);
};

app.changeGif = (type) => {
    if (!app.pomoAssets) return;
    const list = type === 'break' ? app.pomoAssets.gifs.break : app.pomoAssets.gifs.focus;
    app.currentGif = list[Math.floor(Math.random() * list.length)];
    const imgEl = document.getElementById('pomoGif');
    if(imgEl) imgEl.src = app.currentGif;
};

app.toggleSound = (key) => {
    if (!app.pomodoroSounds) return;
    const audio = app.pomodoroSounds[key];
    
    if (!app.state.pomodoro.sounds[key]) {
        // Tenta tocar apenas se tiver URL válida (evita erros no placeholder)
        if(audio.src || audio.play.toString().includes('native')) {
             audio.play().catch(e => console.warn(`Falha ao tocar o áudio ${key}:`, e));
        }
        app.state.pomodoro.sounds[key] = true;
    } else {
        audio.pause();
        app.state.pomodoro.sounds[key] = false;
    }
    app.saveState();
    app.refreshAudioButtons();
};

app.refreshAudioButtons = () => {
    if (!app.pomoAssets) return;
    Object.keys(app.pomoAssets.sounds).forEach(key => {
        const row = document.getElementById(`track-${key}`);
        if (row) {
            if (app.state.pomodoro.sounds[key]) {
                row.classList.add('active');
                if(app.pomodoroSounds[key] && app.pomodoroSounds[key].paused && app.pomodoroSounds[key].src) {
                    app.pomodoroSounds[key].play().catch(()=>{});
                }
            } else {
                row.classList.remove('active');
            }
        }
    });
};

app.startTimer = (mins, isBreak = false) => {
    if (app.timerInterval) clearInterval(app.timerInterval);

    app.pomoActive = true;
    app.pomoIsBreak = isBreak;
    app.pomoRemaining = mins * 60;
    app.pomoTotal = app.pomoRemaining;

    app.changeGif(isBreak ? 'break' : 'focus');
    app.updatePomodoroUI();

    app.timerInterval = setInterval(() => {
        app.pomoRemaining--;
        app.updatePomodoroUI();

        if (app.pomoRemaining <= 0) {
            clearInterval(app.timerInterval);
            app.timerInterval = null;
            app.pomoActive = false;

            if (!isBreak) {
                const today = new Date().toISOString().slice(0, 10);
                app.state.pomodoro.history.push({ date: today, duration: mins });
                app.saveState();
                if(app.currentTab === 'pomodoro') app.render_pomodoro(document.getElementById('content'));
            }
            
            try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play(); } catch (e) {}
            app.toast(isBreak ? "Pausa finalizada!" : "Sessão concluída!", "success");
        }
    }, 1000);
};

app.stopTimer = () => {
    if (app.timerInterval) clearInterval(app.timerInterval);
    app.timerInterval = null;
    app.pomoActive = false;
    app.pomoRemaining = 0;
    app.updatePomodoroUI();
    app.changeGif('focus'); 
};

app.updatePomodoroUI = () => {
    const display = document.getElementById("pomoDisplay");
    const mode = document.getElementById("pomoMode");
    const circle = document.getElementById("pomoProgress");

    if (!app.pomoActive) {
        if (display) display.innerText = "--:--";
        if (mode) mode.innerText = "Aguardando";
        document.title = "FLUXO";
        return;
    }

    const m = Math.floor(app.pomoRemaining / 60);
    const s = app.pomoRemaining % 60;
    const timeStr = `${m}:${s < 10 ? "0" + s : s}`;

    if (display) display.innerText = timeStr;
    if (mode) mode.innerText = app.pomoIsBreak ? "Pausa regenerativa" : "Foco absoluto";
    document.title = `(${timeStr}) Foco`;

    if (circle && app.pomoTotal > 0) {
        const offset = 691 - (691 * (app.pomoTotal - app.pomoRemaining)) / app.pomoTotal;
        circle.style.strokeDashoffset = offset;
    }
};
