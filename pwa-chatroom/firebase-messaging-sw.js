importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ⚠️ 替换为你的 Firebase 配置（与 app.js 相同）
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 处理后台消息 - 兼容声明式推送和传统推送
messaging.onBackgroundMessage((payload) => {
    console.log('收到后台消息:', payload);

    let notificationTitle, notificationOptions;

    // 检查是否是声明式格式（通过 data 字段传递）
    if (payload.data && payload.data.web_push === '8030') {
        // 声明式格式：payload.data.notification 是 JSON 字符串
        try {
            const declarativeData = JSON.parse(payload.data.notification);
            notificationTitle = declarativeData.title;
            notificationOptions = {
                body: declarativeData.body,
                icon: declarativeData.icon || '/icon-192x192.png',
                badge: declarativeData.badge || '/icon-192x192.png',
                data: {
                    url: declarativeData.navigate || '/'
                }
            };
        } catch (e) {
            console.error('解析声明式推送失败', e);
            return;
        }
    } else {
        // 传统 Firebase 推送格式
        notificationTitle = payload.notification?.title || '新消息';
        notificationOptions = {
            body: payload.notification?.body || '有人发送了一条消息',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: {
                url: '/'  // 默认打开首页
            }
        };
    }

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 处理通知点击事件
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.openWindow(urlToOpen)
    );
});