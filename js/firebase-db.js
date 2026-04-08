/* ============================================
   firebase-db.js — Firebase Database Service Layer
   Centralized Firestore read/write operations
   ============================================ */
const FirebaseDB = (() => {

  /* ---------- User Profiles ---------- */
  async function saveUserProfile(uid, data) {
    try {
      // Clean undefined values (Firestore doesn't accept them)
      const cleanData = JSON.parse(JSON.stringify(data));
      await firebaseDB.collection('users').doc(uid).set(cleanData, { merge: true });
      console.log('☁️ Profile saved to Firebase');
      return true;
    } catch (err) {
      console.error('❌ Firebase saveUserProfile error:', err);
      return false;
    }
  }

  async function getUserProfile(uid) {
    try {
      const doc = await firebaseDB.collection('users').doc(uid).get();
      if (doc.exists) {
        console.log('☁️ Profile loaded from Firebase');
        return doc.data();
      }
      return null;
    } catch (err) {
      console.error('❌ Firebase getUserProfile error:', err);
      return null;
    }
  }

  /* ---------- Leaderboard ---------- */
  async function updateLeaderboard(uid, username, score, gamesPlayed) {
    try {
      await firebaseDB.collection('leaderboard').doc(uid).set({
        uid,
        username,
        score: Number(score) || 0,
        gamesPlayed: Number(gamesPlayed) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('❌ Firebase updateLeaderboard error:', err);
      return false;
    }
  }

  async function getLeaderboardTop(n = 10) {
    try {
      const snapshot = await firebaseDB.collection('leaderboard')
        .orderBy('score', 'desc')
        .limit(n)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (err) {
      console.error('❌ Firebase getLeaderboardTop error:', err);
      return [];
    }
  }

  /* ---------- Daily Challenges ---------- */
  async function saveDailyCompletion(uid, date) {
    try {
      await firebaseDB.collection('dailyChallenges').doc(`${uid}_${date}`).set({
        uid,
        date,
        completed: true,
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('❌ Firebase saveDailyCompletion error:', err);
      return false;
    }
  }

  async function checkDailyCompletion(uid, date) {
    try {
      const doc = await firebaseDB.collection('dailyChallenges').doc(`${uid}_${date}`).get();
      return doc.exists && doc.data().completed === true;
    } catch (err) {
      console.error('❌ Firebase checkDailyCompletion error:', err);
      return false;
    }
  }

  /* ---------- Batch Operations ---------- */
  async function getAllUsers() {
    try {
      const snapshot = await firebaseDB.collection('users').get();
      const users = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        users[data.username] = data;
      });
      return users;
    } catch (err) {
      console.error('❌ Firebase getAllUsers error:', err);
      return {};
    }
  }

  return {
    saveUserProfile,
    getUserProfile,
    updateLeaderboard,
    getLeaderboardTop,
    saveDailyCompletion,
    checkDailyCompletion,
    getAllUsers
  };
})();
