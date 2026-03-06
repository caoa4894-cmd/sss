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
const firebaseConfig = {
    apiKey: "AIzaSyBZxJOMYY0HqBcMEAhWEGPj-9ze_uaKnFk",
    authDomain: "my-pwa-chatroom.firebaseapp.com",
    projectId: "my-pwa-chatroom",
    storageBucket: "my-pwa-chatroom.appspot.com",
    messagingSenderId: "101234567890",
    appId: "1:101234567890:web:abc123def456"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 启用离线持久化
db.enablePersistence()
    .then(() => console.log('✅ 离线持久化已启用'))
    .catch(err => {
        if (err.code == 'failed-precondition') {
            console.warn('⚠️ 多个标签页同时打开，离线持久化只能在单个标签页工作');
        } else if (err.code == 'unimplemented') {
            console.warn('⚠️ 当前浏览器不支持离线持久化');
        }
    });

// ==================== DOM 元素 ====================
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// 启用输入框
input.disabled = false;
sendBtn.disabled = false;
console.log('✅ 输入框和按钮已启用');

// ==================== 实时消息监听 ====================
db.collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
        console.log('📨 收到数据更新，消息数量:', snapshot.docs.length);
        
        // 清空并重新显示
        messagesDiv.innerHTML = '';
        
        snapshot.docs.forEach(doc => {
            const msg = doc.data();
            displayMessage(msg, doc.id);
        });
        
        // 滚动到底部
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, error => {
        console.error('❌ 监听错误:', error);
        alert('无法连接到聊天服务器，请检查网络。错误：' + error.message);
    });

// ==================== 发送消息 ====================
async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    try {
        console.log('📤 正在发送消息:', text);
        await db.collection('messages').add({
            name: username,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
        console.log('✅ 消息发送成功');
    } catch (error) {
        console.error('❌ 发送失败:', error);
        alert('发送失败，请稍后重试。错误：' + error.message);
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
    if (msg.timestamp && typeof msg.timestamp.toDate === 'function') {
        const date = msg.timestamp.toDate();
        timeSpan.textContent = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
        timeSpan.textContent = '刚刚';
    }

    msgElem.appendChild(nameSpan);
    msgElem.appendChild(textSpan);
    msgElem.appendChild(timeSpan);
    messagesDiv.appendChild(msgElem);
}

// ==================== 推送通知功能（VAPID在这里写入）====================
// 检查浏览器是否支持推送
if ('Notification' in window && 'PushManager' in window) {
    console.log('✅ 浏览器支持推送通知');
    
    // 自动检查权限（不自动请求，只是检查状态）
    if (Notification.permission === 'granted') {
        console.log('✅ 已有通知权限，尝试获取订阅');
        // 如果已有权限，尝试获取订阅
        setTimeout(() => getPushSubscription(), 1000);
    }
    
    // 如果有“开启通知”按钮，绑定点击事件
    const enableBtn = document.getElementById('enable-notifications-btn');
    if (enableBtn) {
        enableBtn.addEventListener('click', async () => {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✅ 通知权限已授予');
                // 权限授予后，获取推送订阅
                await getPushSubscription();
            }
        });
    }
}

// 获取推送订阅的函数
async function getPushSubscription() {
    try {
        // ⚠️ 重点：在这里填入你的 VAPID 公钥！
        // 从 Firebase 控制台 -> 项目设置 -> 云消息传递 -> Web推送证书 获取
        const applicationServerKey = urlBase64ToUint8Array('BOQmbWhCBDZ3iNBh8b-Yypr8ppk9nHVmJx03PFFlijqC5OkcLk8Znml37oQwbllX2cvQ0NSsJXlpo_ZpQfy-iMo'); // 👈 在这里粘贴你的VAPID公钥
        
        // 获取 Service Worker 注册
        const registration = await navigator.serviceWorker.ready;
        
        // 获取现有的订阅（如果有）
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            console.log('📡 正在创建新的推送订阅...');
            // 没有订阅，则创建一个新的
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            console.log('✅ 新订阅创建成功', subscription);
            
            // 将订阅保存到 Firestore
            await saveSubscriptionToDatabase(subscription);
        } else {
            console.log('✅ 已有推送订阅', subscription);
            
            // 可以选择更新订阅信息
            await saveSubscriptionToDatabase(subscription);
        }
    } catch (error) {
        console.error('❌ 推送订阅失败:', error);
    }
}

// 将推送订阅保存到 Firestore
async function saveSubscriptionToDatabase(subscription) {
    try {
        // 检查是否已存在相同的集合，不存在则创建
        const subscriptionData = {
            endpoint: subscription.endpoint,
            keys: subscription.toJSON().keys,
            userAgent: navigator.userAgent,
            lastUsed: firebase.firestore.FieldValue.serverTimestamp()
        };

        // 使用用户名作为文档ID的一部分，避免特殊字符问题
        const safeUsername = username.replace(/[.#$\/\[\]]/g, '_');
        
        // 以用户名为文档ID，存储该用户的所有订阅
        const userRef = db.collection('pushSubscriptions').doc(safeUsername);
        await userRef.set({
            subscriptions: firebase.firestore.FieldValue.arrayUnion(subscriptionData)
        }, { merge: true });
        
        console.log('✅ 订阅已保存到数据库');
    } catch (error) {
        console.error('❌ 保存订阅失败:', error);
    }
}

// 辅助函数：将 base64 字符串转换为 Uint8Array（推送API要求的格式）
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

console.log('🚀 应用初始化完成');
