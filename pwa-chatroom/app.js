// ==================== 用户昵称管理 ====================
let username = localStorage.getItem('chat_username');
if (!username) {
    username = prompt('请输入你的昵称', '用户' + Math.floor(Math.random()*1000));
    if (!username) username = '匿名';
    localStorage.setItem('chat_username', username);
}
document.getElementById('name-btn').addEventListener('click', () => {
    const newName = prompt('修改昵称', username);
    if (newName) {
        username = newName;
        localStorage.setItem('chat_username', username);
    }
});

// ==================== Firebase 初始化 ====================
// ⚠️ 请替换为你的 Firebase 项目配置
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
const db = firebase.firestore();

// 启用离线持久化
db.enablePersistence()
    .catch(err => console.warn('离线持久化失败:', err));

// ==================== DOM 元素 ====================
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// 启用输入框
input.disabled = false;
sendBtn.disabled = false;

// ==================== 实时消息监听 ====================
db.collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const msg = change.doc.data();
                displayMessage(msg, change.doc.id);
            }
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, error => {
        console.error('监听错误:', error);
        alert('无法连接到聊天服务器，请检查网络。');
    });

// ==================== 发送消息 ====================
async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    try {
        await db.collection('messages').add({
            name: username,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    } catch (error) {
        console.error('发送失败:', error);
        alert('发送失败，请稍后重试。');
    }
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});

// ==================== 显示消息 ====================
function displayMessage(msg, id) {
    const msgElem = document.createElement('div');
    msgElem.classList.add('message');
    msgElem.classList.add(msg.name === username ? 'own' : 'other');

    const nameSpan = document.createElement('div');
    nameSpan.className = 'name';
    nameSpan.textContent = msg.name;

    const textSpan = document.createElement('div');
    textSpan.className = 'text';
    textSpan.textContent = msg.text;

    const timeSpan = document.createElement('div');
    timeSpan.className = 'time';
    if (msg.timestamp) {
        const date = msg.timestamp.toDate();
        timeSpan.textContent = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
        timeSpan.textContent = '发送中...';
    }

    msgElem.appendChild(nameSpan);
    msgElem.appendChild(textSpan);
    msgElem.appendChild(timeSpan);
    messagesDiv.appendChild(msgElem);
}

// ==================== 声明式网页推送（iOS 18.4+） ====================
// 注意：此功能需要 HTTPS 环境，且用户必须将网页添加到主屏幕后从主屏幕打开
(async function initPush() {
    // 检查浏览器是否支持 pushManager
    if (!window.PushManager) {
        console.log('当前浏览器不支持推送通知');
        return;
    }

    // 检查是否已授予通知权限
    if (Notification.permission !== 'granted') {
        console.log('尚未授予通知权限');
        // 可以在这里显示一个提示按钮
        return;
    }

    try {
        // 将 VAPID 公钥转换为 Uint8Array（替换为你的 VAPID 公钥）
        const applicationServerKey = urlBase64ToUint8Array('BOQmbWhCBDZ3iNBh8b-Yypr8ppk9nHVmJx03PFFlijqC5OkcLk8Znml37oQwbllX2cvQ0NSsJXlpo_ZpQfy-iMo');

        // 获取现有的订阅（如果有）
        let subscription = await window.pushManager.getSubscription();
        
        if (!subscription) {
            // 没有订阅，则创建一个新的
            subscription = await window.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            console.log('新订阅创建成功', subscription);
        } else {
            console.log('已有订阅', subscription);
        }

        // 将订阅保存到 Firestore（与当前用户关联）
        await saveSubscriptionToDatabase(subscription);
    } catch (error) {
        console.error('推送订阅失败:', error);
    }
})();

// 如果页面上有“开启通知”按钮，可以绑定点击事件
const enableBtn = document.getElementById('enable-notifications-btn');
if (enableBtn) {
    enableBtn.addEventListener('click', async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // 重新初始化推送
            initPush();
        }
    });
}

// 辅助函数：将 base64 字符串转换为 Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// 将推送订阅保存到 Firestore
async function saveSubscriptionToDatabase(subscription) {
    const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
        userAgent: navigator.userAgent,
        lastUsed: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 以用户名为文档ID，存储该用户的所有订阅
    const userRef = db.collection('pushSubscriptions').doc(username);
    await userRef.set({
        subscriptions: firebase.firestore.FieldValue.arrayUnion(subscriptionData)
    }, { merge: true });
}

// ==================== 接收前台消息（可选） ====================
// 如果你希望在前台也处理推送，可以监听来自 FCM 的消息

// 但这里我们主要依赖后台 Service Worker，所以省略

