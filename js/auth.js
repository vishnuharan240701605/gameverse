/* ============================================
   auth.js — Login, profile, XP/level/coins system
   ============================================ */
const Auth = (() => {
    const STORAGE_KEY = 'gv_player';

    function defaultPlayer(username) {
        return {
            username,
            gamesPlayed: 0,
            wins: 0,
            totalScore: 0,
            highestScore: 0,
            xp: 0,
            coins: 0,
            avatar: '🎮',
            memoryWins: 0,
            snakeBest: 0,
            quizBest: 0,
            rpsBest: 0,
            tttWins: 0,
            reactionBest: 9999,
            colormatchBest: 0,
            mathsprintBest: 0,
            wordscrambleBest: 0,
            whackamoleBest: 0,
            gameScores: {},
        };
    }

    function getPlayer() {
        const d = localStorage.getItem(STORAGE_KEY);
        if (!d) return null;
        const p = JSON.parse(d);
        // Migrate old profiles: add missing fields
        if (p.coins === undefined) p.coins = 0;
        if (p.avatar === undefined) p.avatar = '🎮';
        if (p.highestScore === undefined) p.highestScore = 0;
        if (p.colormatchBest === undefined) p.colormatchBest = 0;
        if (p.mathsprintBest === undefined) p.mathsprintBest = 0;
        if (p.wordscrambleBest === undefined) p.wordscrambleBest = 0;
        if (p.whackamoleBest === undefined) p.whackamoleBest = 0;
        return p;
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

    function addCoins(amount) {
        const p = getPlayer();
        if (!p) return;
        p.coins = (p.coins || 0) + amount;
        savePlayer(p);
        updateNavbar();
    }

    function getCoins() {
        const p = getPlayer();
        return p ? (p.coins || 0) : 0;
    }

    function recordGame(gameName, score, won) {
        const p = getPlayer();
        if (!p) return;
        p.gamesPlayed = (p.gamesPlayed || 0) + 1;
        p.totalScore = (p.totalScore || 0) + score;
        if (score > (p.highestScore || 0)) p.highestScore = score;
        if (won) p.wins = (p.wins || 0) + 1;
        if (!p.gameScores) p.gameScores = {};
        if (!p.gameScores[gameName] || score > p.gameScores[gameName]) {
            p.gameScores[gameName] = score;
        }
        // XP
        p.xp = (p.xp || 0) + 10 + (won ? 25 : 0);
        // Coins
        p.coins = (p.coins || 0) + 5 + (won ? 15 : 0);
        savePlayer(p);
        Leaderboard.update(p.username, p.totalScore, p.gamesPlayed);
        Achievements.checkAndNotify();
        updateNavbar();
    }

    function setAvatar(emoji) {
        const p = getPlayer();
        if (!p) return;
        p.avatar = emoji;
        savePlayer(p);
    }

    function updateNavbar() {
        const p = getPlayer();
        const loginLink = document.getElementById('nav-login-link');
        const userDisplay = document.getElementById('nav-user-display');
        const navUsername = document.getElementById('nav-username');
        const navLevel = document.getElementById('nav-level-badge');
        const navCoins = document.getElementById('nav-coins');
        if (p) {
            if (loginLink) loginLink.style.display = 'none';
            if (userDisplay) userDisplay.style.display = 'flex';
            if (navUsername) navUsername.textContent = p.username;
            if (navLevel) navLevel.textContent = 'Lv ' + getLevel(p.xp);
            if (navCoins) navCoins.textContent = '🪙 ' + (p.coins || 0);
        } else {
            if (loginLink) loginLink.style.display = '';
            if (userDisplay) userDisplay.style.display = 'none';
        }
    }

    return { getPlayer, savePlayer, login, isLoggedIn, getLevel, getXpProgress, addXp, addCoins, getCoins, recordGame, setAvatar, updateNavbar };
})();
