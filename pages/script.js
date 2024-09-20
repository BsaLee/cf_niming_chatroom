let username = '';
let isScrolledToBottom = true; // 记录滚动状态

// 检查本地存储中是否有用户名
document.addEventListener("DOMContentLoaded", () => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
        username = savedUsername;
        enterChat();
    }
});

document.getElementById('set-username').addEventListener('click', () => {
    username = document.getElementById('username').value;
    const rememberCheckbox = document.getElementById('remember-username');

    if (username) {
        if (rememberCheckbox.checked) {
            localStorage.setItem("username", username);
        } else {
            localStorage.removeItem("username");
        }
        enterChat();
    }
});

// 监听回车键提交用户名
document.getElementById('username').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('set-username').click();
    }
});

function enterChat() {
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    fetchUserInfo(); // 获取用户信息
    fetchMessages(); // 进入聊天时拉取消息
    setInterval(fetchMessages, 1000); // 每隔1秒获取最新消息
}

function fetchUserInfo() {
    const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    const latitude = 0; // 默认值
    const longitude = 0; // 默认值
    const ipAddress = 0; // 默认值

    // 获取用户的经纬度和IP地址
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            const ipAddress = ''; // 可以通过其他方式获取IP地址
            sendUserInfo(username, lat, lon, ipAddress, timestamp);
        },
        () => {
            sendUserInfo(username, latitude, longitude, ipAddress, timestamp); // 获取失败时使用默认值
        }
    );
}

function sendUserInfo(username, latitude, longitude, ipAddress, timestamp) {
    fetch('https://api.bhb.us.kg/api/name', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, latitude, longitude, ipAddress, timestamp })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save user info');
        }
        return response.text();
    })
    .then(data => {
        console.log(data); // 成功消息
    })
    .catch(error => {
        console.error('Error sending user info:', error);
    });
}

document.getElementById('send-message').addEventListener('click', () => {
    sendMessage();
});

// 监听回车键发送消息
document.getElementById('message').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const messageInput = document.getElementById('message');
    const message = messageInput.value;
    if (message) {
        const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
        fetch('https://api.bhb.us.kg/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, message, timestamp })
        })
        .then(() => {
            messageInput.value = '';
            fetchMessages();
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
    }
}

function fetchMessages() {
    const messagesContainer = document.getElementById('messages');
    const previousScrollHeight = messagesContainer.scrollHeight; // 获取消息前记录高度

    fetch('https://api.bhb.us.kg/api/messages')
        .then(response => response.json())
        .then(data => {
            messagesContainer.innerHTML = '';
            data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // 按时间排序
            data.forEach(msg => {
                const msgElement = document.createElement('div');
                msgElement.classList.add('message');
                msgElement.classList.add(msg.username === username ? 'self' : 'other');
                msgElement.innerHTML = `<strong>${msg.username}</strong>: ${msg.message} <span class="timestamp">${msg.timestamp}</span>`;
                messagesContainer.appendChild(msgElement);
            });
            
            // 判断是否滚动到最底部
            isScrolledToBottom = (messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 1);
            // 如果在底部则自动滚动
            if (isScrolledToBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                // 如果不在底部，保持当前位置
                const newScrollHeight = messagesContainer.scrollHeight;
                messagesContainer.scrollTop = newScrollHeight - previousScrollHeight + messagesContainer.scrollTop;
            }
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });

    // 监听滚动事件更新状态
    messagesContainer.addEventListener('scroll', () => {
        isScrolledToBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 1;
    });
}
