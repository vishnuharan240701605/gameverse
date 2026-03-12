/* ============================================
   auth.js — Login, profile, XP/level system
   ============================================ */
const Auth = (() => {
    const STORAGE_KEY = 'gv_player';

    function defaultPlayer(username) {
        return {
            username,
            gamesPlayed: 0,
            wins: 0,
            totalScore: 0,
            xp: 0,
            memoryWins: 0,
            snakeBest: 0,
            quizBest: 0,
            rpsBest: 0,
            tttWins: 0,
            reactionBest: 9999,
            gameScores: {},
        };
    }

    function getPlayer() {
        const d = localStorage.getItem(STORAGE_KEY);
        return d ? JSON.parse(d) : null;
    }

    function savePlayer(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function login(username) {
        if (!username || !username.trim()) return false;
        const existing = getPlayer();
        if (existing && existing.username === username.trim()) return true;
        savePlayer(defaultPlayer(username.trim()));
        return true;
    }

    function logout() {
        // Keep data but "log out"
        // We'll just leave data — simpler UX
    }

    function isLoggedIn() {
        return !!getPlayer();
    }

    function getLevel(xp) {
        return Math.floor((xp || 0) / 100) + 1;
    }

    function getXpProgress(xp) {
        return (xp || 0) % 100;
    }

    function addXp(amount) {
        const p = getPlayer();
        if (!p) return;
        p.xp = (p.xp || 0) + amount;
        savePlayer(p);
        updateNavbar();
    }

    function recordGame(gameName, score, won) {
        const p = getPlayer();
        if (!p) return;
        p.gamesPlayed = (p.gamesPlayed || 0) + 1;
        p.totalScore = (p.totalScore || 0) + score;
        if (won) p.wins = (p.wins || 0) + 1;
        if (!p.gameScores) p.gameScores = {};
        if (!p.gameScores[gameName] || score > p.gameScores[gameName]) {
            p.gameScores[gameName] = score;
        }
        // XP
        p.xp = (p.xp || 0) + 10 + (won ? 25 : 0);
        savePlayer(p);
        Leaderboard.update(p.username, p.totalScore, p.gamesPlayed);
        Achievements.checkAndNotify();
        updateNavbar();
    }

    function updateNavbar() {
        const p = getPlayer();
        const loginLink = document.getElementById('nav-login-link');
        const userDisplay = document.getElementById('nav-user-display');
        const navUsername = document.getElementById('nav-username');
        const navLevel = document.getElementById('nav-level-badge');
        if (p) {
            if (loginLink) loginLink.style.display = 'none';
            if (userDisplay) userDisplay.style.display = 'flex';
            if (navUsername) navUsername.textContent = p.username;
            if (navLevel) navLevel.textContent = 'Lv ' + getLevel(p.xp);
        } else {
            if (loginLink) loginLink.style.display = '';
            if (userDisplay) userDisplay.style.display = 'none';
        }
    }

    return { getPlayer, savePlayer, login, isLoggedIn, getLevel, getXpProgress, addXp, recordGame, updateNavbar };
})();
