document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments UI ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const stepScreen = document.getElementById('step-screen');
    const gameScreen = document.getElementById('game-screen');

    // Welcome
    const startBtn = document.getElementById('start-btn');
    const playerNamesContainer = document.getElementById('player-names-container');
    const playerCountBtns = document.querySelectorAll('.count-btn');

    let currentNumPlayers = 2;

    function generatePlayerInputs(count) {
        playerNamesContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const group = document.createElement('div');
            group.className = 'input-group';
            group.innerHTML = `
                <label for="player${i}">Joueur ${i}</label>
                <input type="text" id="player${i}" placeholder="Nom du joueur ${i}" autocomplete="off">
            `;
            playerNamesContainer.appendChild(group);
        }
    }

    playerCountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playerCountBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentNumPlayers = parseInt(btn.dataset.count);
            generatePlayerInputs(currentNumPlayers);
        });
    });

    // Initialisation par défaut
    generatePlayerInputs(2);

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
        players: [], // { name: "", pile: { color: [] } }
        numPlayers: 2,
        tour: 0,
        pioche: {},
        centre: [],
        defausse: [],
        phase: "pioche",
        initStep: 0,
        currentSetupPlayer: 0,
        setupSubStep: 1
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
        
        state.players = [];
        for (let i = 0; i < currentNumPlayers; i++) {
            const playerObj = {
                name: document.getElementById(`player${i + 1}`).value.trim() || `Joueur ${i + 1}`,
                pile: {}
            };
            COLORS.forEach(c => playerObj.pile[c] = []);
            state.players.push(playerObj);
        }

        state.numPlayers = currentNumPlayers;
        state.centre = [];
        state.defausse = [];
        state.tour = 0;
        state.phase = "pioche";
        state.initStep = 0;
        state.currentSetupPlayer = 0; // Index du détenteur actuel (Holder)
        state.setupSubStep = 1;
        stepBtn.onclick = null;
    }

    function tirerPion(source, destination, couleur) {
        if (!state.pioche[couleur] || state.pioche[couleur].length === 0) return null;
        const index = Math.floor(Math.random() * state.pioche[couleur].length);
        const pion = state.pioche[couleur].splice(index, 1)[0];
        
        if (Array.isArray(destination)) {
            destination.unshift({ num: pion, color: couleur });
        } else {
            destination[couleur].push(pion);
        }
        return pion;
    }

    function initialisationTirage() {
        COLORS.forEach(c => {
            state.players.forEach(p => tirerPion(state.pioche, p.pile, c));
            tirerPion(state.pioche, state.centre, c);
        });
    }

    // --- Rendu UI ---
    function updateUI() {
        turnNumSpan.textContent = state.tour + 1;
        const activeIdx = state.tour % state.numPlayers;
        activePlayerSpan.textContent = state.players[activeIdx].name;

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

        // Centre : Ajout du dernier tiré à gauche
        pionsCentreDiv.innerHTML = '';
        state.centre.forEach(item => {
            const p = createPionElement(item.num, item.color);
            if (state.phase === "defausse") {
                p.addEventListener('click', () => defausserPion(item.num, item.color));
            }
            pionsCentreDiv.appendChild(p);
        });

        // Section Piles Dynamiques
        const sectionPiles = document.querySelector('.section-piles');
        sectionPiles.innerHTML = '';
        state.players.forEach((p, idx) => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.innerHTML = `Pile<br><span style="font-size: 0.9em;">${p.name}</span>`;
            btn.onclick = () => {
                pendingView = idx;
                authMsg.textContent = `Attention ! ${p.name} ne doit pas regarder. Les autres, confirmez pour voir la pile.`;
                modalAuth.style.display = 'flex';
            };
            sectionPiles.appendChild(btn);
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
        const N = state.numPlayers;
        const holderIdx = state.currentSetupPlayer;
        // Le détenteur regarde la pile de la personne juste avant lui (sens anti-horaire)
        const targetIdx = (holderIdx - 1 + N) % N;
        
        const targetName = state.players[targetIdx].name;
        const holderName = state.players[holderIdx].name;

        // Calcul des "autres" joueurs pour l'instruction
        const others = state.players
            .filter((_, idx) => idx !== targetIdx && idx !== holderIdx)
            .map(p => p.name);
        
        let othersText = "";
        if (others.length > 0) {
            othersText = ` et montre-la à ${others.join(' et ')}`;
        }

        if (state.setupSubStep === 1) {
            // Étape de passage du téléphone (Sauf pour le premier joueur qui l'a déjà)
            showScreen(stepScreen);
            stepTitle.textContent = "Passage de relai";
            
            if (holderIdx === 0 && state.initStep === 0) {
                stepMsg.textContent = `${holderName}, tu commences ! Tu vas regarder une pile adverse.\n\nConfirme que tu es prêt.`;
            } else {
                stepMsg.textContent = `Donne le téléphone à ${holderName}.\n\n${holderName}, confirme que tu as bien le téléphone en main.`;
            }
            
            stepBody.style.display = 'none';
            stepBtn.textContent = "Je confirme";
            state.setupSubStep = 2;
        } else {
            // Étape d'affichage de la pile
            stepTitle.textContent = `Pile de ${targetName}`;
            stepMsg.textContent = `${holderName}, regarde bien cette pile, note-la sur ta fiche${othersText}.`;
            stepBody.style.display = 'flex';
            renderPionList(stepBody, state.players[targetIdx].pile, true);
            stepBtn.textContent = "C'est noté";
            
            // Passer au joueur suivant
            state.setupSubStep = 1;
            state.currentSetupPlayer++;
            state.initStep++; // On utilise initStep pour savoir si c'est le tout début
            
            if (state.currentSetupPlayer >= N) {
                // On change immédiatement le texte pour le dernier clic
                stepBtn.textContent = "Lancer la partie";
                stepBtn.onclick = () => {
                    showScreen(gameScreen);
                    updateUI();
                    stepBtn.onclick = null;
                };
            }
        }
    }

    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        setTimeout(() => { screen.classList.add('active'); }, 300);
    }

    function defausserPion(num, couleur) {
        const idx = state.centre.findIndex(item => item.num === num && item.color === couleur);
        if (idx > -1) {
            state.centre.splice(idx, 1);
            state.defausse.push({ num: num, color: couleur });
            state.tour++;
            state.phase = "pioche";
            updateUI();
        }
    }

    function showPileContent(idx) {
        const player = state.players[idx];
        viewTitle.textContent = `Pile de ${player.name}`;
        renderPionList(viewPionsDiv, player.pile, true);
        modalView.style.display = 'flex';
    }

    function resetGame(samePlayers) {
        modalRestart.style.display = 'none';
        modalWin.style.display = 'none';
        
        if (samePlayers) {
            initData(); // Reprend les noms déjà stockés
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
        initData();
        initialisationTirage();
        nextInitStep();
    });

    restartBtn.addEventListener('click', () => { modalRestart.style.display = 'flex'; });

    // Gestion groupée des boutons Restart (ID & Classe pour modalRestart et modalWin)
    document.querySelectorAll('.restart-same').forEach(btn => btn.addEventListener('click', () => resetGame(true)));
    document.querySelectorAll('.restart-new').forEach(btn => btn.addEventListener('click', () => resetGame(false)));

    stepBtn.addEventListener('click', nextInitStep);

    authConfirmBtn.addEventListener('click', () => { modalAuth.style.display = 'none'; showPileContent(pendingView); });

    // Got Five handlers
    gotFiveBtn.addEventListener('click', () => {
        // Générer les boutons de gagnants dans la modale
        const actions = document.getElementById('winner-buttons');
        actions.innerHTML = '';
        state.players.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'primary-btn';
            btn.textContent = p.name;
            btn.onclick = () => {
                modalGotFive.style.display = 'none';
                winHeadline.textContent = `Félicitations ${p.name} ! 🎉`;
                winMsg.textContent = `Victoire bien méritée !`;
                modalWin.style.display = 'flex';
                createConfetti();
            };
            actions.appendChild(btn);
        });
        modalGotFive.style.display = 'flex';
    });

    continueGameBtn.addEventListener('click', () => { modalGotFive.style.display = 'none'; });

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
