// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ⚠️ 替换为你的 Firebase 配置
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZM5tLnB3FuDQZKl8rfcg_G2utQKwzke4",
  authDomain: "minichat-e73dd.firebaseapp.com",
  projectId: "minichat-e73dd",
  storageBucket: "minichat-e73dd.firebasestorage.app",
  messagingSenderId: "702728270281",
  appId: "1:702728270281:web:5049608bb8a01ad20f7818",
  measurementId: "G-0REK75WZ0V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

firebase.initializeApp(firebaseConfig);

// 注意：这里不需要再调用 getMessaging，因为兼容模式下会自动处理
const messaging = firebase.messaging();

// 处理后台消息
messaging.onBackgroundMessage((payload) => {
    console.log('收到后台消息:', payload);
    
    const notificationTitle = payload.notification?.title || '新消息';
    const notificationOptions = {
        body: payload.notification?.body || '有人发送了一条消息',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});
