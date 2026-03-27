document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments UI ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const stepScreen = document.getElementById('step-screen');
    const gameScreen = document.getElementById('game-screen');

    // Welcome
    const startBtn = document.getElementById('start-btn');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');

    // Step Screen
    const stepTitle = document.getElementById('step-title');
    const stepBody = document.getElementById('step-body');
    const stepMsg = document.getElementById('step-msg');
    const stepBtn = document.getElementById('step-btn');

    // Game Screen
    const turnNumSpan = document.getElementById('turn-num');
    const activePlayerSpan = document.getElementById('active-player-name');
    const restartBtn = document.getElementById('restart-btn');
    const piocheStatsDiv = document.getElementById('pioche-stats');
    const pionsCentreDiv = document.getElementById('pions-centre');
    const pionsDefausseDiv = document.getElementById('pions-defausse');
    const piocheHint = document.getElementById('pioche-hint');
    const centreHint = document.getElementById('centre-hint');
    const gotFiveBtn = document.getElementById('gotfive-btn');

    // Modales
    const modalView = document.getElementById('modal-view');
    const modalAuth = document.getElementById('modal-auth');
    const modalRestart = document.getElementById('modal-restart');
    const modalGotFive = document.getElementById('modal-gotfive');
    const modalWin = document.getElementById('modal-win');

    const viewTitle = document.getElementById('view-title');
    const viewPionsDiv = document.getElementById('view-pions');
    const authMsg = document.getElementById('auth-msg');
    const winHeadline = document.getElementById('win-headline');
    const winMsg = document.getElementById('win-msg');
    const confettiContainer = document.getElementById('confetti-container');

    // Boutons de navigation/actions
    const navButtons = document.querySelectorAll('.nav-btn');
    const navBtnJ1 = document.querySelector('.nav-btn[data-info="joueur1"]');
    const navBtnJ2 = document.querySelector('.nav-btn[data-info="joueur2"]');
    const winJ1Btn = document.getElementById('win-j1-btn');
    const winJ2Btn = document.getElementById('win-j2-btn');
    const continueGameBtn = document.getElementById('continue-game-btn');
    const closeViewBtn = document.getElementById('close-view');
    const authConfirmBtn = document.getElementById('auth-confirm');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // --- État du Jeu ---
    const COLORS = ["vert", "rose", "bleu", "rouge", "orange"];
    const COLOR_MAP = {
        "vert": "#10b981",
        "rose": "#ec4899",
        "bleu": "#0ea5e9",
        "rouge": "#ef4444",
        "orange": "#f59e0b"
    };

    let state = {
        nom1: "",
        nom2: "",
        tour: 0,
        pioche: {},
        joueur1: {},
        joueur2: {},
        centre: {},
        defausse: [],
        phase: "pioche",
        initStep: 0
    };

    let pendingView = null;

    // --- Logique Métier ---
    function initData() {
        state.pioche = {
            "vert": [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56],
            "rose": [2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57],
            "bleu": [3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58],
            "rouge": [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59],
            "orange": [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
        };
        COLORS.forEach(c => {
            state.joueur1[c] = [];
            state.joueur2[c] = [];
            state.centre[c] = [];
        });
        state.defausse = [];
        state.tour = 0;
        state.phase = "pioche";
        state.initStep = 0;
    }

    function tirerPion(source, destination, couleur) {
        if (!state.pioche[couleur] || state.pioche[couleur].length === 0) return null;
        const index = Math.floor(Math.random() * state.pioche[couleur].length);
        const pion = state.pioche[couleur].splice(index, 1)[0];
        destination[couleur].push(pion);
        return pion;
    }

    function initialisationTirage() {
        COLORS.forEach(c => {
            tirerPion(state.pioche, state.joueur1, c);
            tirerPion(state.pioche, state.joueur2, c);
            tirerPion(state.pioche, state.centre, c);
        });
    }

    // --- Rendu UI ---
    function updateUI() {
        turnNumSpan.textContent = state.tour + 1;
        const currentPlayer = state.tour % 2 === 0 ? state.nom1 : state.nom2;
        activePlayerSpan.textContent = currentPlayer;

        // Pioche cliquable
        piocheStatsDiv.innerHTML = '';
        COLORS.forEach(c => {
            const count = state.pioche[c].length;
            const item = document.createElement('div');
            item.className = 'stat-item';
            if (state.phase !== "pioche" || count === 0) item.classList.add('disabled');

            item.innerHTML = `<div class="stat-count">${count}</div>`;
            item.style.setProperty('background', COLOR_MAP[c], 'important');
            item.style.color = 'white';
            item.style.boxShadow = `0 4px 10px rgba(0,0,0,0.3)`;

            if (state.phase === "pioche" && count > 0) {
                item.addEventListener('click', () => {
                    const pion = tirerPion(state.pioche, state.centre, c);
                    if (pion) {
                        state.phase = "defausse";
                        updateUI();
                    }
                });
            }
            piocheStatsDiv.appendChild(item);
        });

        // Défausse : Ordre INVERSE
        renderPionList(pionsDefausseDiv, [...state.defausse].reverse(), false);

        // Centre : Tri numérique STRICT
        pionsCentreDiv.innerHTML = '';
        const flatCentre = [];
        COLORS.forEach(c => {
            state.centre[c].forEach(num => flatCentre.push({ num, color: c }));
        });
        flatCentre.sort((a, b) => a.num - b.num).forEach(item => {
            const p = createPionElement(item.num, item.color);
            if (state.phase === "defausse") {
                p.addEventListener('click', () => defausserPion(item.num, item.color));
            }
            pionsCentreDiv.appendChild(p);
        });

        // Instructions
        piocheHint.style.display = (state.phase === "pioche") ? 'block' : 'none';
        centreHint.style.display = (state.phase === "defausse") ? 'block' : 'none';
    }

    function renderPionList(targetDiv, content, sorted = true) {
        targetDiv.innerHTML = '';
        if (Array.isArray(content)) {
            content.forEach(item => {
                const p = createPionElement(item.num, item.color);
                targetDiv.appendChild(p);
            });
        } else {
            const flatList = [];
            COLORS.forEach(c => {
                content[c].forEach(num => flatList.push({ num, color: c }));
            });
            if (sorted) flatList.sort((a, b) => a.num - b.num);
            flatList.forEach(item => {
                const p = createPionElement(item.num, item.color);
                targetDiv.appendChild(p);
            });
        }
        if (targetDiv.innerHTML === '') targetDiv.innerHTML = '<p style="color:var(--text-secondary); grid-column:1/-1">Vide</p>';
    }

    function nextInitStep() {
        state.initStep++;
        switch (state.initStep) {
            case 1: showScreen(stepScreen); stepTitle.textContent = "Confirmation"; stepMsg.textContent = `${state.nom1}, confirmez que vous avez bien le téléphone en main.`; stepBody.style.display = 'none'; stepBtn.textContent = "Je confirme"; break;
            case 2: stepTitle.textContent = `Tirage de ${state.nom1}`; stepMsg.textContent = "Mémorisez bien vos cartes avant de continuer."; stepBody.style.display = 'flex'; renderPionList(stepBody, state.joueur1, true); stepBtn.textContent = "J'ai retenu mes cartes"; break;
            case 3: stepTitle.textContent = "Passage de relai"; stepMsg.textContent = `Donnez le téléphone à ${state.nom2}. \n\n ${state.nom2}, confirmez que vous avez bien le téléphone en main.`; stepBody.style.display = 'none'; stepBtn.textContent = "Je confirme"; break;
            case 4: stepTitle.textContent = `Tirage de ${state.nom2}`; stepMsg.textContent = "Mémorisez bien vos cartes avant de continuer."; stepBody.style.display = 'flex'; renderPionList(stepBody, state.joueur2, true); stepBtn.textContent = "C'est OK"; break;
            case 5: showScreen(gameScreen); updateUI(); break;
        }
    }

    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        setTimeout(() => { screen.classList.add('active'); }, 300);
    }

    function defausserPion(num, couleur) {
        const idx = state.centre[couleur].indexOf(num);
        if (idx > -1) {
            state.centre[couleur].splice(idx, 1);
            state.defausse.push({ num: num, color: couleur });
            state.tour++;
            state.phase = "pioche";
            updateUI();
        }
    }

    function showPileContent(type) {
        let content, sorted;
        if (type === "joueur1") { content = state.joueur1; sorted = true; }
        else if (type === "joueur2") { content = state.joueur2; sorted = true; }
        viewTitle.textContent = (type === "joueur1") ? `Pile de ${state.nom1}` : `Pile de ${state.nom2}`;
        renderPionList(viewPionsDiv, content, sorted);
        modalView.style.display = 'flex';
    }

    function resetGame(samePlayers) {
        modalRestart.style.display = 'none';
        modalWin.style.display = 'none';
        initData();
        if (samePlayers) {
            navBtnJ1.textContent = `Pile ${state.nom1}`;
            navBtnJ2.textContent = `Pile ${state.nom2}`;
            initialisationTirage();
            nextInitStep();
        } else {
            showScreen(welcomeScreen);
        }
    }

    function createConfetti() {
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#ef4444'];
        confettiContainer.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + '%';
            c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const duration = 2 + Math.random() * 3;
            const delay = Math.random() * 2;
            c.style.animation = `confetti-fall ${duration}s ${delay}s linear forwards`;
            confettiContainer.appendChild(c);
        }
    }

    // --- Événements ---
    startBtn.addEventListener('click', () => {
        state.nom1 = player1Input.value.trim() || 'Joueur 1';
        state.nom2 = player2Input.value.trim() || 'Joueur 2';
        navBtnJ1.textContent = `Pile ${state.nom1}`;
        navBtnJ2.textContent = `Pile ${state.nom2}`;

        // Mettre à jour les noms des boutons de victoire
        winJ1Btn.textContent = state.nom1;
        winJ2Btn.textContent = state.nom2;

        initData();
        initialisationTirage();
        nextInitStep();
    });

    restartBtn.addEventListener('click', () => { modalRestart.style.display = 'flex'; });

    // Gestion groupée des boutons Restart (ID & Classe pour modalRestart et modalWin)
    document.querySelectorAll('.restart-same').forEach(btn => btn.addEventListener('click', () => resetGame(true)));
    document.querySelectorAll('.restart-new').forEach(btn => btn.addEventListener('click', () => resetGame(false)));

    stepBtn.addEventListener('click', nextInitStep);

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-info');
            if (!type) return;
            pendingView = type;
            authMsg.textContent = `Êtes-vous bien ${type === "joueur1" ? state.nom1 : state.nom2} ?`;
            modalAuth.style.display = 'flex';
        });
    });

    authConfirmBtn.addEventListener('click', () => { modalAuth.style.display = 'none'; showPileContent(pendingView); });

    // Got Five handlers
    gotFiveBtn.addEventListener('click', () => { modalGotFive.style.display = 'flex'; });
    continueGameBtn.addEventListener('click', () => { modalGotFive.style.display = 'none'; });

    winJ1Btn.addEventListener('click', () => {
        modalGotFive.style.display = 'none';
        winHeadline.textContent = `Félicitations ${state.nom1} ! 🎉`;
        winMsg.textContent = `Victoire bien méritée !`;
        modalWin.style.display = 'flex';
        createConfetti();
    });
    winJ2Btn.addEventListener('click', () => {
        modalGotFive.style.display = 'none';
        winHeadline.textContent = `Félicitations ${state.nom2} ! 🎉`;
        winMsg.textContent = `Victoire bien méritée !`;
        modalWin.style.display = 'flex';
        createConfetti();
    });

    closeViewBtn.addEventListener('click', () => { modalView.style.display = 'none'; });
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none'));

    function createPionElement(num, color) {
        const p = document.createElement('div');
        p.className = 'pion';
        p.style.backgroundColor = COLOR_MAP[color];

        const numSpan = document.createElement('span');
        numSpan.className = 'pion-number';
        numSpan.textContent = num;
        p.appendChild(numSpan);

        const starsDiv = document.createElement('div');
        starsDiv.className = 'pion-stars';

        // Formule: de 1 à 5 -> 1 pt, 6 à 10 -> 2 pts, 11 à 15 -> 3 pts (cyclique)
        const count = Math.floor(((num - 1) % 15) / 5) + 1;
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'star-dot';
            starsDiv.appendChild(dot);
        }
        p.appendChild(starsDiv);

        return p;
    }
});
