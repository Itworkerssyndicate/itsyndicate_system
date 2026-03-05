// assets/js/auth.js

import { auth, database, ref, get, update } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// تسجيل الدخول
export async function login(username, password) {
    try {
        showLoading(true);
        
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            let foundUser = null;
            let userId = null;
            
            for (const [id, userData] of Object.entries(users)) {
                if (userData.username === username || userData.fullName === username) {
                    if (userData.password === password || userData.nationalId === password) {
                        foundUser = userData;
                        userId = id;
                        break;
                    }
                }
            }
            
            if (foundUser) {
                await update(ref(database, `users/${userId}`), {
                    lastLogin: new Date().toISOString(),
                    online: true
                });
                
                sessionStorage.setItem('currentUser', JSON.stringify({
                    userId: userId,
                    ...foundUser
                }));
                
                showMessage('تم تسجيل الدخول بنجاح', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
                return true;
            } else {
                showMessage('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
                return false;
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('حدث خطأ في تسجيل الدخول', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// تسجيل الخروج
export async function logout() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        await update(ref(database, `users/${currentUser.userId}`), {
            online: false,
            lastSeen: new Date().toISOString()
        });
    }
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// التحقق من حالة المستخدم
export function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(user);
}

// عرض رسالة
function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000);
    }
}

// عرض تحميل
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// تصدير دوال المساعدة
export { showMessage, showLoading };
