let username = '';
let isScrolledToBottom = true; // 记录滚动状态
let selectedFile = null; // 存储选择的文件

// 检查本地存储中是否有用户名
document.addEventListener("DOMContentLoaded", () => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
        username = savedUsername;
        enterChat();
    } else {
        // 检查用户名输入框是否为空，生成随机用户名
        const usernameInput = document.getElementById('username');
        if (!usernameInput.value) {
            const randomUsername = generateRandomUsername();
            usernameInput.value = randomUsername;
        }
    }

    // 隐藏表情、文件和公告弹窗
    document.getElementById('emoji-popup').style.display = 'none';
    document.getElementById('file-popup').style.display = 'none';
    document.getElementById('notice-popup').style.display = 'none';

    // 随机用户名按钮事件
    document.getElementById('random-username').addEventListener('click', () => {
        document.getElementById('username').value = generateRandomUsername();
    });

    // 进入聊天室按钮事件
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
});

// 生成随机用户名
function generateRandomUsername() {
    const adjectives = ["快乐的", "神秘的", "勇敢的", "可爱的", "聪明的", "冷酷的", "迷人的", "忍耐的", "机智的", "热情的"];
    const movieCharacters = ["哈利波特", "黑豹", "小丑", "冰雪女王", "超人", "蜘蛛侠", "迪士尼公主", "钢铁侠", "绿巨人", "银河护卫队"];
    const animeCharacters = ["哆啦A梦", "火影忍者", "小樱", "海贼王", "佐助", "喜羊羊", "樱木", "艾伦", "绿谷", "柯南"];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const character = [...movieCharacters, ...animeCharacters][Math.floor(Math.random() * (movieCharacters.length + animeCharacters.length))];
    return adjective + character;
}



// 进入聊天室
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

// 添加 Emoji 按钮功能
const emojiButton = document.getElementById('emoji-button');
const emojiPopup = document.getElementById('emoji-popup');
const messageInput = document.getElementById('message');

// 切换表情选择器的显示
emojiButton.addEventListener('click', (event) => {
    emojiPopup.style.display = emojiPopup.style.display === 'none' ? 'block' : 'none';
    const rect = emojiButton.getBoundingClientRect();
    emojiPopup.style.top = `${rect.top - emojiPopup.offsetHeight}px`; // 弹出在上方
    emojiPopup.style.left = `${rect.left}px`;
});

// 选择 Emoji
emojiPopup.addEventListener('click', (event) => {
    if (event.target.classList.contains('emoji')) {
        const emoji = event.target.getAttribute('data-emoji');
        messageInput.value += emoji; // 将选中的 Emoji 插入到输入框中
        emojiPopup.style.display = 'none'; // 选择后关闭表情选择器
    }
});

// 上传文件按钮功能
const fileButton = document.getElementById('file-button');
const filePopup = document.getElementById('file-popup');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const selectedFileNameElement = document.getElementById('file-name-display'); // 更新为正确的 ID

// 切换文件上传选择器的显示
fileButton.addEventListener('click', (event) => {
    filePopup.style.display = filePopup.style.display === 'none' ? 'block' : 'none';
    const rect = fileButton.getBoundingClientRect();
    filePopup.style.top = `${rect.top - filePopup.offsetHeight}px`; // 弹出在上方
    filePopup.style.left = `${rect.left}px`;
});

// 选择文件并显示文件名
fileInput.addEventListener('change', () => {
    selectedFile = fileInput.files[0];
    if (selectedFile) {
        selectedFileNameElement.textContent = selectedFile.name.length > 20 
            ? selectedFile.name.slice(0, 20) + '...' 
            : selectedFile.name; // 如果文件名过长，截断并加上省略号
        uploadButton.style.display = 'block'; // 显示上传按钮
    } else {
        selectedFileNameElement.textContent = '无选择文件';
        uploadButton.style.display = 'none'; // 隐藏上传按钮
    }
});

// 点击上传按钮
uploadButton.addEventListener('click', () => {
    if (selectedFile) {
        const formData = new FormData();
        const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
        formData.append('file', selectedFile);
        formData.append('username', username);
        formData.append('timestamp', timestamp);

        fetch('https://api.bhb.us.kg/api/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.text())
        .then(data => {
            console.log('File uploaded successfully:', data);
            fileInput.value = ''; // 清空文件输入
            filePopup.style.display = 'none'; // 上传后关闭文件选择器
            selectedFileNameElement.textContent = ''; // 清空文件名显示
            selectedFile = null; // 清空选择的文件
            uploadButton.style.display = 'none'; // 隐藏上传按钮
        })
        .catch(error => {
            console.error('Error uploading file:', error);
        });
    }
});

// 点击输入框外部时关闭表情和文件选择器
document.addEventListener('click', (event) => {
    if (!emojiButton.contains(event.target) && !emojiPopup.contains(event.target)) {
        emojiPopup.style.display = 'none';
    }
    if (!fileButton.contains(event.target) && !filePopup.contains(event.target)) {
        filePopup.style.display = 'none';
    }
});

// 发送消息
function sendMessage() {
    const messageInput = document.getElementById('message');
    const message = messageInput.value;
    if (message) {
        const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
        fetch('https://api.bhb.us.kg/api/sendMessage', {
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

// 拉取消息
function fetchMessages() {
    const messagesContainer = document.getElementById('messages');
    const previousScrollHeight = messagesContainer.scrollHeight; // 获取消息前记录高度

    fetch('https://api.bhb.us.kg/api/messages')
        .then(response => response.json())
        .then(data => {
            messagesContainer.innerHTML = '';
            data.reverse(); // 按json倒序
            data.forEach(msg => {
                const msgElement = document.createElement('div');
                msgElement.classList.add('msg-box');
                msgElement.classList.add(msg.username === username ? 'self' : 'other');

                // 创建用户名元素
                const usernameElement = document.createElement('div');
                usernameElement.classList.add('username');
                usernameElement.textContent = msg.username;

                // 创建消息内容元素
                const contentElement = document.createElement('div');
                contentElement.classList.add('message');

                // 解析消息内容
                let messageContent = msg.message;
                if (msg.message.startsWith('[img]') && msg.message.endsWith('[/img]')) {
                    // 处理图片消息
                    const imgUrl = msg.message.slice(5, -6); // 提取URL
                    messageContent = `<img src="${imgUrl}" class="thumbnail" alt="Image" onclick="enlargeImage('${imgUrl}')">`;
                } else if (msg.message.startsWith('[url=') && msg.message.endsWith(']')) {
                    // 处理链接消息
                    const url = msg.message.match(/\[url=(.*?)\](.*?)\[\/url\]/);
                    if (url && url[1] && url[2]) {
                        const linkUrl = url[1];
                        const linkText = url[2];
                        messageContent = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
                    }
                }

                contentElement.innerHTML = `${messageContent} <span class="timestamp">${msg.timestamp}</span>`;

                // 将用户名和消息内容添加到消息元素中
                msgElement.appendChild(usernameElement);
                msgElement.appendChild(contentElement);
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

// 放大图片功能
function enlargeImage(imgUrl) {
    const overlay = document.createElement('div');
    overlay.classList.add('image-overlay');
    overlay.innerHTML = `<img src="${imgUrl}" class="enlarged-image" alt="Image" onclick="closeImage()">`;
    document.body.appendChild(overlay);
}

// 关闭放大图片
function closeImage() {
    const overlay = document.querySelector('.image-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
    }
}

// 点击提示按钮弹出公告栏
const noticeButton = document.getElementById('notice-button');
const noticePopup = document.getElementById('notice-popup');

// 切换公告栏的显示
noticeButton.addEventListener('click', (event) => {
    noticePopup.style.display = noticePopup.style.display === 'none' ? 'block' : 'none';
    const rect = noticeButton.getBoundingClientRect();
    noticePopup.style.top = `${rect.top - noticePopup.offsetHeight}px`; // 弹出在上方
    noticePopup.style.left = `${rect.left}px`;
});

// 点击输入框外部时关闭表情和文件选择器以及公告栏
document.addEventListener('click', (event) => {
    if (!emojiButton.contains(event.target) && !emojiPopup.contains(event.target)) {
        emojiPopup.style.display = 'none';
    }
    if (!fileButton.contains(event.target) && !filePopup.contains(event.target)) {
        filePopup.style.display = 'none';
    }
    if (!noticeButton.contains(event.target) && !noticePopup.contains(event.target)) {
        noticePopup.style.display = 'none'; // 关闭公告栏
    }
});
