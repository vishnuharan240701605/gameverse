/* ============================================
   auth.js — Multi-user Login/Register, XP/Level/Coins
   ============================================ */
const Auth = (() => {
    const USERS_KEY = 'gv_users';      // All registered users
    const SESSION_KEY = 'gv_session';  // Current logged-in username
    const REMEMBER_KEY = 'gv_remember';

    /* ---------- Safe default player ---------- */
    function defaultPlayer(username, email, passHash, avatar) {
        return {
            username,
            email: email || '',
            passHash: passHash || '',
            avatar: avatar || '🎮',
            gamesPlayed: 0,
            wins: 0,
            totalScore: 0,
            highestScore: 0,
            xp: 0,
            coins: 0,
            level: 1,
            memoryWins: 0,
            snakeBest: 0,
            quizBest: 0,
            rpsBest: 0,
            tttWins: 0,
            reactionBest: 0,       // ← FIX: was 9999, now 0
            colormatchBest: 0,
            mathsprintBest: 0,
            wordscrambleBest: 0,
            whackamoleBest: 0,
            gameScores: {},
            achievements: [],
            createdAt: Date.now(),
        };
    }

    /* ---------- Simple string hash (client-side only) ---------- */
    function hashPass(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash |= 0;
        }
        return 'h_' + Math.abs(hash).toString(36);
    }

    /* ---------- Users DB ---------- */
    function getAllUsers() {
        const d = localStorage.getItem(USERS_KEY);
        if (!d) return {};
        try { return JSON.parse(d); } catch (e) { return {}; }
    }

    function saveAllUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    /* ---------- Migration: convert old gv_player to new system ---------- */
    function migrateOldData() {
        const old = localStorage.getItem('gv_player');
        if (!old) return;
        try {
            const p = JSON.parse(old);
            if (p && p.username) {
                const users = getAllUsers();
                if (!users[p.username]) {
                    // Fix 9999 bug in old data
                    if (p.reactionBest === 9999) p.reactionBest = 0;
                    // Ensure all fields exist with safe defaults
                    p.passHash = p.passHash || '';
                    p.email = p.email || '';
                    p.level = Math.floor((p.xp || 0) / 100) + 1;
                    p.coins = Number(p.coins) || 0;
                    p.totalScore = Number(p.totalScore) || 0;
                    p.gamesPlayed = Number(p.gamesPlayed) || 0;
                    p.highestScore = Number(p.highestScore) || 0;
                    p.wins = Number(p.wins) || 0;
                    p.xp = Number(p.xp) || 0;
                    p.gameScores = p.gameScores || {};
                    p.achievements = p.achievements || [];
                    p.createdAt = p.createdAt || Date.now();
                    users[p.username] = p;
                    saveAllUsers(users);
                    // Set session
                    localStorage.setItem(SESSION_KEY, p.username);
                }
                localStorage.removeItem('gv_player');
            }
        } catch (e) { /* ignore corrupt data */ }
    }

    /* ---------- Session ---------- */
    function getSessionUser() {
        return localStorage.getItem(SESSION_KEY) || null;
    }

    function getPlayer() {
        const uname = getSessionUser();
        if (!uname) return null;
        const users = getAllUsers();
        const p = users[uname];
        if (!p) return null;
        // Live migration: ensure all fields
        if (p.reactionBest === 9999) p.reactionBest = 0;  // FIX 9999
        if (p.coins === undefined) p.coins = 0;
        if (p.avatar === undefined) p.avatar = '🎮';
        if (p.highestScore === undefined) p.highestScore = 0;
        if (p.colormatchBest === undefined) p.colormatchBest = 0;
        if (p.mathsprintBest === undefined) p.mathsprintBest = 0;
        if (p.wordscrambleBest === undefined) p.wordscrambleBest = 0;
        if (p.whackamoleBest === undefined) p.whackamoleBest = 0;
        if (p.level === undefined) p.level = getLevel(p.xp);
        if (p.gameScores === undefined) p.gameScores = {};
        if (p.achievements === undefined) p.achievements = [];
        return p;
    }

    function savePlayer(data) {
        const uname = getSessionUser();
        if (!uname) return;
        const users = getAllUsers();
        // Ensure all scores are numbers, never strings
        data.totalScore = Number(data.totalScore) || 0;
        data.gamesPlayed = Number(data.gamesPlayed) || 0;
        data.wins = Number(data.wins) || 0;
        data.xp = Number(data.xp) || 0;
        data.coins = Number(data.coins) || 0;
        data.highestScore = Number(data.highestScore) || 0;
        data.level = getLevel(data.xp);
        users[uname] = data;
        saveAllUsers(users);
    }

    /* ---------- Register ---------- */
    function register(username, email, password, avatar) {
        if (!username || !username.trim()) return { ok: false, msg: 'Username is required' };
        username = username.trim();
        if (username.length < 3) return { ok: false, msg: 'Username must be at least 3 characters' };
        if (password && password.length < 4) return { ok: false, msg: 'Password must be at least 4 characters' };

        const users = getAllUsers();
        if (users[username]) return { ok: false, msg: 'Username already taken' };

        const ph = password ? hashPass(password) : '';
        users[username] = defaultPlayer(username, email, ph, avatar || '🎮');
        saveAllUsers(users);
        localStorage.setItem(SESSION_KEY, username);
        return { ok: true };
    }

    /* ---------- Login ---------- */
    function login(username, password, remember) {
        if (!username || !username.trim()) return { ok: false, msg: 'Username is required' };
        username = username.trim();
        const users = getAllUsers();
        const user = users[username];

        if (!user) return { ok: false, msg: 'User not found. Please register first.' };
        if (user.passHash && password && hashPass(password) !== user.passHash) {
            return { ok: false, msg: 'Incorrect password' };
        }
        if (user.passHash && !password) {
            return { ok: false, msg: 'Password required' };
        }

        localStorage.setItem(SESSION_KEY, username);
        if (remember) localStorage.setItem(REMEMBER_KEY, username);
        return { ok: true };
    }

    /* ---------- Guest ---------- */
    function loginAsGuest() {
        const guestName = 'Guest_' + Math.random().toString(36).slice(2, 7);
        const users = getAllUsers();
        users[guestName] = defaultPlayer(guestName, '', '', '👤');
        saveAllUsers(users);
        localStorage.setItem(SESSION_KEY, guestName);
        return guestName;
    }

    /* ---------- Logout ---------- */
    function logout() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        updateNavbar();
    }

    function isLoggedIn() {
        return !!getPlayer();
    }

    /* ---------- Levels / XP ---------- */
    function getLevel(xp) {
        // Tiered: 0→L1, 200→L2, 500→L3, 900→L4, 1400→L5, ...
        xp = Number(xp) || 0;
        let lv = 1, threshold = 0, step = 200;
        while (xp >= threshold + step) {
            threshold += step;
            lv++;
            step += 100;
        }
        return lv;
    }

    function getXpForLevel(lv) {
        let threshold = 0, step = 200;
        for (let i = 1; i < lv; i++) { threshold += step; step += 100; }
        return threshold;
    }

    function getXpProgress(xp) {
        xp = Number(xp) || 0;
        const lv = getLevel(xp);
        const curr = getXpForLevel(lv);
        const next = getXpForLevel(lv + 1);
        const range = next - curr;
        return range > 0 ? Math.round(((xp - curr) / range) * 100) : 0;
    }

    function addXp(amount) {
        const p = getPlayer();
        if (!p) return;
        const oldLv = getLevel(p.xp);
        p.xp = (Number(p.xp) || 0) + Number(amount);
        p.level = getLevel(p.xp);
        savePlayer(p);
        if (p.level > oldLv) showLevelUp(p.level);
        updateNavbar();
    }

    function addCoins(amount) {
        const p = getPlayer();
        if (!p) return;
        p.coins = (Number(p.coins) || 0) + Number(amount);
        savePlayer(p);
        updateNavbar();
    }

    function getCoins() {
        const p = getPlayer();
        return p ? (Number(p.coins) || 0) : 0;
    }

    /* ---------- Record game (ONLY called by game logic) ---------- */
    function recordGame(gameName, score, won) {
        const p = getPlayer();
        if (!p) return;
        score = Number(score) || 0;             // Always parse as number
        p.gamesPlayed = (Number(p.gamesPlayed) || 0) + 1;
        p.totalScore = (Number(p.totalScore) || 0) + score;
        if (score > (Number(p.highestScore) || 0)) p.highestScore = score;
        if (won) p.wins = (Number(p.wins) || 0) + 1;
        if (!p.gameScores) p.gameScores = {};
        if (!p.gameScores[gameName] || score > Number(p.gameScores[gameName])) {
            p.gameScores[gameName] = score;
        }
        // XP: 10 base + 25 bonus for win
        const oldLv = getLevel(p.xp);
        p.xp = (Number(p.xp) || 0) + 10 + (won ? 25 : 0);
        p.level = getLevel(p.xp);
        // Coins: 5 base + 15 bonus for win
        p.coins = (Number(p.coins) || 0) + 5 + (won ? 15 : 0);
        savePlayer(p);
        if (p.level > oldLv) showLevelUp(p.level);
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

    /* ---------- Level Up Animation ---------- */
    function showLevelUp(newLevel) {
        const popup = document.createElement('div');
        popup.className = 'levelup-popup';
        popup.innerHTML = `
            <div class="levelup-icon">⬆️</div>
            <div class="levelup-text">LEVEL UP!</div>
            <div class="levelup-level">Level ${newLevel}</div>
        `;
        document.body.appendChild(popup);
        SoundFX.play('win');
        setTimeout(() => popup.remove(), 3500);
    }

    /* ---------- Navbar ---------- */
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
            if (navCoins) navCoins.textContent = '🪙 ' + (Number(p.coins) || 0);
        } else {
            if (loginLink) loginLink.style.display = '';
            if (userDisplay) userDisplay.style.display = 'none';
        }
    }

    /* ---------- Init: migrate old data ---------- */
    migrateOldData();
    // Auto-login from remember
    if (!getSessionUser()) {
        const rem = localStorage.getItem(REMEMBER_KEY);
        if (rem) localStorage.setItem(SESSION_KEY, rem);
    }

    return {
        getPlayer, savePlayer, login, register, loginAsGuest, logout,
        isLoggedIn, getLevel, getXpForLevel, getXpProgress,
        addXp, addCoins, getCoins, recordGame, setAvatar, updateNavbar,
        hashPass, getAllUsers
    };
})();
