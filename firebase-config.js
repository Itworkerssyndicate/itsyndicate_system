// assets/js/firebase-config.js

// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    child, 
    onValue, 
    push, 
    update, 
    remove,
    query,
    orderByChild,
    equalTo 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
    getStorage, 
    ref as storageRef, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCaPhRG_1c7Rsu5Ss_MUNqsE18Ky_nyEAA",
    authDomain: "itws-system.firebaseapp.com",
    databaseURL: "https://itws-system-default-rtdb.firebaseio.com",
    projectId: "itws-system",
    storageBucket: "itws-system.firebasestorage.app",
    messagingSenderId: "770452248691",
    appId: "1:770452248691:web:0e94e65e01298b398bb206",
    measurementId: "G-8V5WSYEX0B"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// تصدير المتغيرات والدوال
export { 
    app, 
    auth, 
    database, 
    storage,
    ref,
    set,
    get,
    child,
    onValue,
    push,
    update,
    remove,
    query,
    orderByChild,
    equalTo,
    storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
};
