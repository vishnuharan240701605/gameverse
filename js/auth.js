/* ============================================
   auth.js — Brain Boost Challenge Auth System
   Firebase Auth + Firestore backed
   Multi-user, XP/Level/Coins, Streak, Skills
   ============================================ */
const Auth = (() => {
    const LOCAL_CACHE_KEY = 'bb_player_cache';
    const SESSION_KEY = 'bb_session';
    const REMEMBER_KEY = 'bb_remember';

    let _currentPlayer = null;
    let _currentUID = null;
    let _authReady = false;
    let _onAuthReadyCallbacks = [];

    /* ---------- Default player with full skill model ---------- */
    function defaultPlayer(username, email, avatar) {
        return {
            username,
            email: email || '',
            avatar: avatar || '🧠',
            age: '',
            education: '',
            interests: [],
            gamesPlayed: 0,
            wins: 0,
            totalScore: 0,
            highestScore: 0,
            xp: 0,
            coins: 0,
            level: 1,
            streak: 0,
            lastLoginDate: new Date().toISOString().split('T')[0],
            brainDominance: { left: 50, right: 50 },
            brainAge: 0,
            onboardingComplete: false,
            difficulty: 'easy',
            skillScores: {
                memory: 0,
                logic: 0,
                creativity: 0,
                focus: 0,
                reaction: 0,
                analysis: 0,
                observation: 0,
                visual: 0
            },
            memoryWins: 0,
            snakeBest: 0,
            quizBest: 0,
            rpsBest: 0,
            tttWins: 0,
            reactionBest: 0,
            colormatchBest: 0,
            mathsprintBest: 0,
            wordscrambleBest: 0,
            whackamoleBest: 0,
            gameScores: {},
            achievements: [],
            activityHistory: [],
            createdAt: Date.now(),
        };
    }

    /* ---------- Local Cache for fast reads ---------- */
    function cachePlayer(data) {
        _currentPlayer = data;
        if (data) {
            localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data));
        } else {
            localStorage.removeItem(LOCAL_CACHE_KEY);
        }
    }

    function getCachedPlayer() {
        if (_currentPlayer) return _currentPlayer;
        const cached = localStorage.getItem(LOCAL_CACHE_KEY);
        if (cached) {
            try {
                _currentPlayer = JSON.parse(cached);
                return _currentPlayer;
            } catch (e) { return null; }
        }
        return null;
    }

    /* ---------- Firebase Auth State Listener ---------- */
    firebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
            _currentUID = user.uid;
            // Try to load profile from Firebase
            const profile = await FirebaseDB.getUserProfile(user.uid);
            if (profile) {
                _currentPlayer = migratePlayerFields(profile);
                cachePlayer(_currentPlayer);
            }
            localStorage.setItem(SESSION_KEY, user.uid);
        } else {
            _currentUID = null;
            _currentPlayer = null;
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(LOCAL_CACHE_KEY);
        }
        _authReady = true;
        _onAuthReadyCallbacks.forEach(cb => cb());
        _onAuthReadyCallbacks = [];
        updateNavbar();
    });

    function onAuthReady(cb) {
        if (_authReady) { cb(); return; }
        _onAuthReadyCallbacks.push(cb);
    }

    /* ---------- Field Migration (ensure all fields exist) ---------- */
    function migratePlayerFields(p) {
        if (p.reactionBest === 9999) p.reactionBest = 0;
        if (p.coins === undefined) p.coins = 0;
        if (p.avatar === undefined) p.avatar = '🧠';
        if (p.highestScore === undefined) p.highestScore = 0;
        if (p.colormatchBest === undefined) p.colormatchBest = 0;
        if (p.mathsprintBest === undefined) p.mathsprintBest = 0;
        if (p.wordscrambleBest === undefined) p.wordscrambleBest = 0;
        if (p.whackamoleBest === undefined) p.whackamoleBest = 0;
        if (p.level === undefined) p.level = getLevel(p.xp);
        if (p.gameScores === undefined) p.gameScores = {};
        if (p.achievements === undefined) p.achievements = [];
        if (!p.skillScores) p.skillScores = { memory: 0, logic: 0, creativity: 0, focus: 0, reaction: 0, analysis: 0, observation: 0, visual: 0 };
        if (!p.brainDominance) p.brainDominance = { left: 50, right: 50 };
        if (p.brainAge === undefined) p.brainAge = 0;
        if (p.streak === undefined) p.streak = 0;
        if (!p.lastLoginDate) p.lastLoginDate = new Date().toISOString().split('T')[0];
        if (p.onboardingComplete === undefined) p.onboardingComplete = false;
        if (!p.activityHistory) p.activityHistory = [];
        if (!p.age) p.age = '';
        if (!p.education) p.education = '';
        if (!p.interests) p.interests = [];
        if (!p.difficulty) p.difficulty = 'easy';
        if (p.gamesPlayed === undefined) p.gamesPlayed = 0;
        if (p.wins === undefined) p.wins = 0;
        if (p.totalScore === undefined) p.totalScore = 0;
        if (p.xp === undefined) p.xp = 0;
        if (p.memoryWins === undefined) p.memoryWins = 0;
        if (p.snakeBest === undefined) p.snakeBest = 0;
        if (p.quizBest === undefined) p.quizBest = 0;
        if (p.rpsBest === undefined) p.rpsBest = 0;
        if (p.tttWins === undefined) p.tttWins = 0;
        if (p.reactionBest === undefined) p.reactionBest = 0;
        return p;
    }

    /* ---------- Get Player (synchronous, from cache) ---------- */
    function getPlayer() {
        const p = getCachedPlayer();
        if (!p) return null;
        return migratePlayerFields(p);
    }

    /* ---------- Save Player (to cache + Firebase) ---------- */
    function savePlayer(data) {
        if (!_currentUID) return;
        data.totalScore = Number(data.totalScore) || 0;
        data.gamesPlayed = Number(data.gamesPlayed) || 0;
        data.wins = Number(data.wins) || 0;
        data.xp = Number(data.xp) || 0;
        data.coins = Number(data.coins) || 0;
        data.highestScore = Number(data.highestScore) || 0;
        data.level = getLevel(data.xp);

        // Save to local cache immediately (fast)
        cachePlayer(data);

        // Save to Firebase (async, non-blocking)
        FirebaseDB.saveUserProfile(_currentUID, data).catch(err => {
            console.error('Failed to sync to Firebase:', err);
        });
    }

    /* ---------- Register (Firebase Auth) ---------- */
    async function register(username, email, password, avatar) {
        if (!username || !username.trim()) return { ok: false, msg: 'Username is required' };
        username = username.trim();
        if (username.length < 3) return { ok: false, msg: 'Username must be at least 3 characters' };
        if (!email || !email.trim()) return { ok: false, msg: 'Email is required for Firebase registration' };
        if (!password) return { ok: false, msg: 'Password is required' };
        if (password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters (Firebase requirement)' };

        try {
            // Check if username is already taken
            const existingUsers = await firebaseDB.collection('users')
                .where('username', '==', username).limit(1).get();
            if (!existingUsers.empty) {
                return { ok: false, msg: 'Username already taken' };
            }

            // Create Firebase Auth account
            const userCred = await firebaseAuth.createUserWithEmailAndPassword(email.trim(), password);
            const uid = userCred.user.uid;

            // Update display name
            await userCred.user.updateProfile({ displayName: username });

            // Create player profile
            const player = defaultPlayer(username, email.trim(), avatar || '🧠');
            player.uid = uid;

            // Save to Firestore
            await FirebaseDB.saveUserProfile(uid, player);

            // Cache locally
            _currentUID = uid;
            cachePlayer(player);

            return { ok: true };
        } catch (err) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                return { ok: false, msg: 'This email is already registered. Please login instead.' };
            }
            if (err.code === 'auth/invalid-email') {
                return { ok: false, msg: 'Invalid email address.' };
            }
            if (err.code === 'auth/weak-password') {
                return { ok: false, msg: 'Password is too weak. Use at least 6 characters.' };
            }
            return { ok: false, msg: err.message || 'Registration failed. Please try again.' };
        }
    }

    /* ---------- Login (Firebase Auth) ---------- */
    async function login(username, password, remember) {
        if (!username || !username.trim()) return { ok: false, msg: 'Email is required' };
        username = username.trim();
        if (!password) return { ok: false, msg: 'Password required' };

        try {
            // Firebase Auth uses email for login
            let email = username;

            // If username provided instead of email, look up email from Firestore
            if (!email.includes('@')) {
                const snapshot = await firebaseDB.collection('users')
                    .where('username', '==', username).limit(1).get();
                if (snapshot.empty) {
                    return { ok: false, msg: 'User not found. Please register first.' };
                }
                email = snapshot.docs[0].data().email;
                if (!email) {
                    return { ok: false, msg: 'No email associated with this account.' };
                }
            }

            // Sign in with Firebase Auth
            const userCred = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const uid = userCred.user.uid;

            // Load profile from Firestore
            const profile = await FirebaseDB.getUserProfile(uid);
            if (profile) {
                _currentUID = uid;
                const player = migratePlayerFields(profile);

                // Update streak
                updateStreak(player);
                cachePlayer(player);
                await FirebaseDB.saveUserProfile(uid, player);
            }

            if (remember) localStorage.setItem(REMEMBER_KEY, email);

            return { ok: true };
        } catch (err) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found') {
                return { ok: false, msg: 'User not found. Please register first.' };
            }
            if (err.code === 'auth/wrong-password') {
                return { ok: false, msg: 'Incorrect password.' };
            }
            if (err.code === 'auth/invalid-email') {
                return { ok: false, msg: 'Invalid email address.' };
            }
            if (err.code === 'auth/too-many-requests') {
                return { ok: false, msg: 'Too many attempts. Please try again later.' };
            }
            return { ok: false, msg: err.message || 'Login failed. Please try again.' };
        }
    }

    /* ---------- Streak Logic ---------- */
    function updateStreak(player) {
        const today = new Date().toISOString().split('T')[0];
        const last = player.lastLoginDate || '';

        if (last === today) return; // Already logged in today

        const lastDate = new Date(last);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / 86400000);

        if (diffDays === 1) {
            player.streak = (player.streak || 0) + 1;
        } else if (diffDays > 1) {
            player.streak = 1;
        }

        player.lastLoginDate = today;
    }

    /* ---------- Guest (Firebase Anonymous Auth) ---------- */
    async function loginAsGuest() {
        try {
            const userCred = await firebaseAuth.signInAnonymously();
            const uid = userCred.user.uid;
            const guestName = 'Guest_' + Math.random().toString(36).slice(2, 7);

            const p = defaultPlayer(guestName, '', '👤');
            p.uid = uid;
            p.onboardingComplete = true; // Skip onboarding for guests
            p.isGuest = true;

            _currentUID = uid;
            await FirebaseDB.saveUserProfile(uid, p);
            cachePlayer(p);

            return guestName;
        } catch (err) {
            console.error('Guest login error:', err);
            // Fallback: create local-only guest
            const guestName = 'Guest_' + Math.random().toString(36).slice(2, 7);
            const p = defaultPlayer(guestName, '', '👤');
            p.onboardingComplete = true;
            p.isGuest = true;
            cachePlayer(p);
            return guestName;
        }
    }

    /* ---------- Logout ---------- */
    async function logout() {
        try {
            await firebaseAuth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        }
        _currentPlayer = null;
        _currentUID = null;
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LOCAL_CACHE_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        updateNavbar();
    }

    function isLoggedIn() {
        return !!getPlayer();
    }

    function getSessionUser() {
        return localStorage.getItem(SESSION_KEY) || null;
    }

    /* ---------- Levels / XP ---------- */
    function getLevel(xp) {
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

    /* ---------- Cognitive Skills Update ---------- */
    function updateSkills(skillMap) {
        const p = getPlayer();
        if (!p) return;
        if (!p.skillScores) p.skillScores = {};

        Object.entries(skillMap).forEach(([skill, delta]) => {
            const current = Number(p.skillScores[skill]) || 0;
            const boost = Math.max(1, Math.round(delta * (1 - current / 150)));
            p.skillScores[skill] = Math.min(100, current + boost);
        });

        savePlayer(p);
    }

    /* ---------- Record game ---------- */
    function recordGame(gameName, score, won) {
        const p = getPlayer();
        if (!p) return;
        score = Number(score) || 0;
        p.gamesPlayed = (Number(p.gamesPlayed) || 0) + 1;
        p.totalScore = (Number(p.totalScore) || 0) + score;
        if (score > (Number(p.highestScore) || 0)) p.highestScore = score;
        if (won) p.wins = (Number(p.wins) || 0) + 1;
        if (!p.gameScores) p.gameScores = {};
        if (!p.gameScores[gameName] || score > Number(p.gameScores[gameName])) {
            p.gameScores[gameName] = score;
        }
        const oldLv = getLevel(p.xp);
        p.xp = (Number(p.xp) || 0) + 10 + (won ? 25 : 0);
        p.level = getLevel(p.xp);
        p.coins = (Number(p.coins) || 0) + 5 + (won ? 15 : 0);

        // Update streak on game play
        updateStreak(p);

        savePlayer(p);
        if (p.level > oldLv) showLevelUp(p.level);

        // Update Firestore leaderboard
        if (_currentUID) {
            FirebaseDB.updateLeaderboard(_currentUID, p.username, p.totalScore, p.gamesPlayed);
        }

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

    /* ---------- Get all users (for compatibility) ---------- */
    function getAllUsers() {
        // Synchronous fallback for features that need it
        const cached = localStorage.getItem('bb_users');
        if (cached) {
            try { return JSON.parse(cached); } catch (e) { return {}; }
        }
        return {};
    }

    /* ---------- Legacy hash (kept for compatibility) ---------- */
    function hashPass(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash |= 0;
        }
        return 'h_' + Math.abs(hash).toString(36);
    }

    /* ---------- Migration from old localStorage data ---------- */
    function migrateOldData() {
        // Check if there's old data to migrate
        const oldUsers = localStorage.getItem('bb_users') || localStorage.getItem('gv_users');
        const oldPlayer = localStorage.getItem('gv_player');
        if (oldUsers || oldPlayer) {
            console.log('📦 Old localStorage data detected. Will migrate on next Firebase login.');
        }
    }

    async function migrateLocalDataToFirebase() {
        if (!_currentUID || !_currentPlayer) return;

        // Check if old localStorage data exists
        const oldUsersRaw = localStorage.getItem('bb_users') || localStorage.getItem('gv_users');
        if (!oldUsersRaw) return;

        try {
            const oldUsers = JSON.parse(oldUsersRaw);
            const username = _currentPlayer.username;
            const oldData = oldUsers[username];

            if (oldData && oldData.gamesPlayed > (_currentPlayer.gamesPlayed || 0)) {
                // Merge old data into current profile
                const merged = { ..._currentPlayer, ...oldData, uid: _currentUID };
                merged.level = getLevel(merged.xp);
                await FirebaseDB.saveUserProfile(_currentUID, merged);
                cachePlayer(merged);
                console.log('✅ Migrated old localStorage data to Firebase');
            }
        } catch (e) {
            console.error('Migration error:', e);
        }
    }

    /* ---------- Init ---------- */
    migrateOldData();

    return {
        getPlayer, savePlayer, login, register, loginAsGuest, logout,
        isLoggedIn, getLevel, getXpForLevel, getXpProgress,
        addXp, addCoins, getCoins, recordGame, setAvatar, updateNavbar,
        hashPass, getAllUsers, updateSkills, defaultPlayer, onAuthReady,
        getSessionUser, migrateLocalDataToFirebase
    };
})();
