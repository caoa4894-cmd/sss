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

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 启用离线持久化
db.enablePersistence()
    .then(() => console.log('离线持久化已启用'))
    .catch(err => {
        if (err.code == 'failed-precondition') {
            console.warn('多个标签页同时打开，离线持久化只能在单个标签页工作');
        } else if (err.code == 'unimplemented') {
            console.warn('当前浏览器不支持离线持久化');
        }
    });

// ==================== DOM 元素 ====================
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// 启用输入框
input.disabled = false;
sendBtn.disabled = false;
console.log('输入框和按钮已启用');

// ==================== 实时消息监听 ====================
db.collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
        console.log('收到数据更新，消息数量:', snapshot.docs.length);
        
        // 清空并重新显示（简化版，避免重复）
        messagesDiv.innerHTML = '';
        
        snapshot.docs.forEach(doc => {
            const msg = doc.data();
            displayMessage(msg, doc.id);
        });
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, error => {
        console.error('监听错误:', error);
        alert('无法连接到聊天服务器，请检查网络。错误：' + error.message);
    });

// ==================== 发送消息 ====================
async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    try {
        console.log('正在发送消息:', text);
        await db.collection('messages').add({
            name: username,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
        console.log('消息发送成功');
    } catch (error) {
        console.error('发送失败:', error);
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
    if (msg.timestamp && msg.timestamp.toDate) {
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

// ==================== 推送通知相关（暂时注释掉，先确保基础功能）====================
/*
// 检查浏览器是否支持推送
if ('Notification' in window) {
    console.log('浏览器支持通知');
}

// 如果页面上有“开启通知”按钮，可以绑定点击事件
const enableBtn = document.getElementById('enable-notifications-btn');
if (enableBtn) {
    enableBtn.addEventListener('click', async () => {
        const permission = await Notification.requestPermission();
        console.log('通知权限:', permission);
    });
}
*/
