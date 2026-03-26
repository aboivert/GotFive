import curses
import random

# ─────────────────────────────────────────────
#  DONNÉES
# ─────────────────────────────────────────────

COULEURS = ["vert", "rose", "bleu", "rouge", "orange"]

COULEURS_CURSES = {
    "vert":   1,
    "rose":   2,
    "bleu":   3,
    "rouge":  4,
    "orange": 5,
    "titre":  6,
    "info":   7,
}

def reinitialiser():
    pioche = {
        "vert":   [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56],
        "rose":   [2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57],
        "bleu":   [3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58],
        "rouge":  [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59],
        "orange": [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    }
    joueur1 = {c: [] for c in COULEURS}
    joueur2 = {c: [] for c in COULEURS}
    centre  = {c: [] for c in COULEURS}
    defausse = {c: [] for c in COULEURS}
    return pioche, joueur1, joueur2, centre, defausse

def tirer_carte(entree, sortie, couleur):
    if not entree[couleur]:
        return None
    carte = random.choice(entree[couleur])
    entree[couleur].remove(carte)
    sortie[couleur].append(carte)
    return carte

def deplacer_carte(entree, sortie, numero):
    for couleur, cartes in entree.items():
        if numero in cartes:
            cartes.remove(numero)
            sortie[couleur].append(numero)
            return True
    return False

def initialisation_tirage(entree, sortie):
    for couleur in COULEURS:
        tirer_carte(entree, sortie, couleur)

# ─────────────────────────────────────────────
#  AFFICHAGE CURSES
# ─────────────────────────────────────────────

def init_couleurs():
    curses.start_color()
    curses.use_default_colors()
    curses.init_pair(1, curses.COLOR_GREEN,   -1)
    curses.init_pair(2, curses.COLOR_MAGENTA, -1)
    curses.init_pair(3, curses.COLOR_CYAN,    -1)
    curses.init_pair(4, curses.COLOR_RED,     -1)
    curses.init_pair(5, curses.COLOR_YELLOW,  -1)
    curses.init_pair(6, curses.COLOR_WHITE,   -1)  # titres
    curses.init_pair(7, curses.COLOR_WHITE,   -1)  # info neutre

def draw_ligne(win, y, x, texte, pair=0, bold=False):
    """Écrit du texte de façon sécurisée (pas d'exception si hors écran)."""
    h, w = win.getmaxyx()
    if y >= h or x >= w:
        return
    texte = texte[:w - x - 1]
    attr = curses.color_pair(pair)
    if bold:
        attr |= curses.A_BOLD
    try:
        win.addstr(y, x, texte, attr)
    except curses.error:
        pass

def dessiner_panneau(win, etat):
    """Redessine tout le panneau d'informations."""
    win.erase()
    h, w = win.getmaxyx()

    nom1    = etat["nom1"]
    nom2    = etat["nom2"]
    tour    = etat["tour"]
    pioche  = etat["pioche"]
    centre  = etat["centre"]
    defausse = etat["defausse"]
    joueur_actif = nom1 if tour % 2 == 0 else nom2

    y = 0

    # ── En-tête ──────────────────────────────
    titre = f"  ♟  Got Five  —  Tour {tour + 1}  —  Tour de : {joueur_actif}  "
    draw_ligne(win, y, 0, titre.center(w - 1), pair=6, bold=True)
    y += 1
    draw_ligne(win, y, 0, "─" * (w - 1), pair=6)
    y += 2

    # ── Pioche ───────────────────────────────
    draw_ligne(win, y, 2, "PIOCHE", pair=6, bold=True)
    y += 1
    for couleur in COULEURS:
        nb = len(pioche[couleur])
        barre = "█" * nb + "░" * (12 - nb)
        texte = f"  {couleur:<8} {barre}  {nb:2}/12"
        draw_ligne(win, y, 2, texte, pair=COULEURS_CURSES[couleur])
        y += 1
    y += 1

    # ── Centre ───────────────────────────────
    carte_tiree = etat.get("carte_tiree")
    titre_centre = "CENTRE"
    if carte_tiree:
        titre_centre += f"   ← carte tirée : {carte_tiree[0]} ({carte_tiree[1]})"
    draw_ligne(win, y, 2, titre_centre, pair=6, bold=True)
    y += 1
    for couleur in COULEURS:
        cartes = sorted(centre[couleur])
        if cartes:
            texte = f"  {couleur:<8} {cartes}"
        else:
            texte = f"  {couleur:<8} —"
        draw_ligne(win, y, 2, texte, pair=COULEURS_CURSES[couleur])
        y += 1
    y += 1

    # ── Défausse ─────────────────────────────
    draw_ligne(win, y, 2, "DÉFAUSSE", pair=6, bold=True)
    y += 1
    for couleur in COULEURS:
        cartes = sorted(defausse[couleur])
        if cartes:
            texte = f"  {couleur:<8} {cartes}"
        else:
            texte = f"  {couleur:<8} —"
        draw_ligne(win, y, 2, texte, pair=COULEURS_CURSES[couleur])
        y += 1
    y += 1

    draw_ligne(win, y, 0, "─" * (w - 1), pair=6)

    win.refresh()
    return y + 1  # retourne la prochaine ligne libre


def saisir(win, y, prompt, etat=None, panneau_win=None):
    """Affiche un prompt et lit une saisie clavier, avec rafraîchissement du panneau."""
    h, w = win.getmaxyx()
    curses.echo()
    curses.curs_set(1)
    win.move(y, 0)
    win.clrtoeol()
    draw_ligne(win, y, 2, prompt, pair=7)
    win.refresh()
    try:
        raw = win.getstr(y, 2 + len(prompt) + 1, 40)
        valeur = raw.decode("utf-8").strip()
    except Exception:
        valeur = ""
    curses.noecho()
    curses.curs_set(0)
    return valeur

def afficher_message(win, y, msg, pair=7):
    win.move(y, 0)
    win.clrtoeol()
    draw_ligne(win, y, 2, msg, pair=pair)
    win.refresh()

# ─────────────────────────────────────────────
#  PHASES DE JEU
# ─────────────────────────────────────────────

def phase_init_joueur(stdscr, etat, nom, joueur_dict, cle_joueur):
    """Tirage initial d'un joueur."""
    h, w = stdscr.getmaxyx()

    while True:
        stdscr.erase()
        msg = f"  {nom}, appuyez sur Entrée pour commencer votre tirage..."
        draw_ligne(stdscr, h // 2, 2, msg, pair=6, bold=True)
        stdscr.refresh()
        stdscr.getch()

        initialisation_tirage(etat["pioche"], joueur_dict)

        stdscr.erase()
        y = h // 2 - 4
        draw_ligne(stdscr, y, 2, f"=== Tirage de {nom} ===", pair=6, bold=True)
        y += 2
        for couleur in COULEURS:
            cartes = joueur_dict[couleur]
            draw_ligne(stdscr, y, 4, f"{couleur:<8} {cartes}", pair=COULEURS_CURSES[couleur])
            y += 1
        y += 1
        draw_ligne(stdscr, y, 2, f"{nom}, appuyez sur Entrée quand vous avez mémorisé vos cartes...", pair=7)
        stdscr.refresh()
        stdscr.getch()
        break


def effectuer_tour_curses(stdscr, etat):
    """Un tour complet avec affichage curses. Retourne True si end_game."""
    h, w = stdscr.getmaxyx()
    panneau_h = h  # on utilise toute la fenêtre

    while True:
        # ── Réinitialiser la carte tirée (nouveau tour) ─
        etat["carte_tiree"] = None

        # ── Redessiner ─────────────────────────
        stdscr.erase()
        prochaine_ligne = dessiner_panneau(stdscr, etat)
        zone_saisie = prochaine_ligne

        # ── Demander une couleur ────────────────
        afficher_message(stdscr, zone_saisie, "Choisissez une couleur (ou 'end_game') : ", pair=7)
        couleur = saisir(stdscr, zone_saisie, "Choisissez une couleur (ou 'end_game') : ", etat)

        if couleur == "end_game":
            return True

        if couleur not in etat["pioche"] or len(etat["pioche"][couleur]) == 0:
            afficher_message(stdscr, zone_saisie + 1, "⚠  Couleur invalide ou pioche vide. Réessayez.", pair=4)
            stdscr.getch()
            continue

        # Tirer la carte
        carte = tirer_carte(etat["pioche"], etat["centre"], couleur)
        etat["carte_tiree"] = (carte, couleur)

        # ── Redessiner avec la nouvelle carte ──
        stdscr.erase()
        prochaine_ligne = dessiner_panneau(stdscr, etat)
        zone_saisie = prochaine_ligne

        # ── Demander un numéro ──────────────────
        while True:
            afficher_message(stdscr, zone_saisie, "Numéro à défausser du centre (ou 'end_game') : ", pair=7)
            saisie = saisir(stdscr, zone_saisie, "Numéro à défausser du centre (ou 'end_game') : ", etat)

            if saisie == "end_game":
                return True

            try:
                numero = int(saisie)
                if any(numero in cartes for cartes in etat["centre"].values()):
                    deplacer_carte(etat["centre"], etat["defausse"], numero)
                    break
                else:
                    afficher_message(stdscr, zone_saisie + 1, "⚠  Ce numéro n'est pas dans le centre.", pair=4)
                    stdscr.getch()
            except ValueError:
                afficher_message(stdscr, zone_saisie + 1, "⚠  Numéro invalide.", pair=4)
                stdscr.getch()

        return False  # tour terminé


# ─────────────────────────────────────────────
#  BOUCLE PRINCIPALE
# ─────────────────────────────────────────────

def main(stdscr):
    init_couleurs()
    curses.curs_set(0)
    curses.noecho()
    h, w = stdscr.getmaxyx()

    # ── Saisie des noms ───────────────────────
    stdscr.erase()
    draw_ligne(stdscr, h // 2 - 2, 2, "Bienvenue dans TIRAGE !", pair=6, bold=True)
    nom1 = saisir(stdscr, h // 2,     "Nom du Joueur 1 : ")
    nom2 = saisir(stdscr, h // 2 + 2, "Nom du Joueur 2 : ")

    # ── Initialisation de l'état ──────────────
    pioche, joueur1, joueur2, centre, defausse = reinitialiser()

    etat = {
        "nom1":        nom1,
        "nom2":        nom2,
        "tour":        0,
        "pioche":      pioche,
        "joueur1":     joueur1,
        "joueur2":     joueur2,
        "centre":      centre,
        "defausse":    defausse,
        "carte_tiree": None,
    }

    # ── Tirages initiaux ──────────────────────
    phase_init_joueur(stdscr, etat, nom1, joueur1, "joueur1")
    stdscr.erase()
    phase_init_joueur(stdscr, etat, nom2, joueur2, "joueur2")
    stdscr.erase()

    # Tirage initial du centre
    initialisation_tirage(pioche, centre)

    # ── Boucle de jeu ─────────────────────────
    joueurs = [(nom1, joueur1), (nom2, joueur2)]

    while True:
        nom, joueur = joueurs[etat["tour"] % 2]
        stdscr.erase()

        fin = effectuer_tour_curses(stdscr, etat)

        if fin:
            stdscr.erase()
            draw_ligne(stdscr, h // 2, 2, "═══ FIN DE LA PARTIE ═══", pair=6, bold=True)
            draw_ligne(stdscr, h // 2 + 1, 2, "Appuyez sur une touche pour quitter.", pair=7)
            stdscr.refresh()
            stdscr.getch()
            break

        etat["tour"] += 1


if __name__ == "__main__":
    curses.wrapper(main)