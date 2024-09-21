export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const DB = env.DB;
        const R2 = env.cos; 

        if (!DB) {
            return new Response('Database not configured', { status: 500 });
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        // 违禁词库
        const forbiddenWords = [
            '习近平',
            '主席',
            '毛泽东',
            '国家',
            '政府',
            '政权',
            '反动',
            '革命',
            '抗议',
            '示威',
            '政治',
            '腐败',
            '特权',
            '镇压',
            '反对派',
        ];

        // 过滤函数
        const filterMessage = (text) => {
            let filteredText = text;
            forbiddenWords.forEach(word => {
                const regex = new RegExp(word, 'g'); // 创建正则表达式
                filteredText = filteredText.replace(regex, '***'); // 替换违禁词为 ***
            });
            return filteredText;
        };

        try {
            // 处理文件上传
            if (request.method === 'POST' && url.pathname === '/api/upload') {
                const formData = await request.formData();
                const file = formData.get('file'); // 获取上传的文件
                const username = formData.get('username'); // 获取传递的用户名
                const timestamp = Date.now(); // 使用当前时间戳

                if (!file || !username) {
                    return new Response('Missing file or username', { status: 400 });
                }

                const originalFileName = file.name; // 原始文件名
                const extension = originalFileName.split('.').pop(); // 文件扩展名
                const baseName = originalFileName.slice(0, -(extension.length + 1)); // 去掉扩展名的文件名
                const newFileName = `${username}_${timestamp}_${baseName}.${extension}`; // 生成新文件名，保留原文件名
                const fileBuffer = await file.arrayBuffer(); // 将文件转换为 ArrayBuffer

                // 上传到 R2 存储桶
                await R2.put(newFileName, fileBuffer, {
                    httpMetadata: {
                        contentType: file.type,
                    },
                });

                const filePath = `https://r2.bhb.us.kg/${newFileName}`; // 生成文件路径

                let message;
                const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']; // 常见图片格式

                if (imageExtensions.includes(extension.toLowerCase())) {
                    message = `[img]${filePath}[/img]`; // 拼接成图片格式的消息
                } else {
                    message = `[url=${filePath}]${originalFileName}[/url]`; // 拼接成非图片格式的消息
                }

                // 将文件路径、用户名和时间写入数据库
                const filteredUsername = filterMessage(username);
                const filteredMessage = filterMessage(message);

                const result = await DB.prepare('INSERT INTO messages (username, message, timestamp) VALUES (?, ?, ?)')
                    .bind(filteredUsername, filteredMessage, new Date(timestamp).toISOString())
                    .run();

                console.log('File Uploaded and Message Inserted:', result);

                return new Response('File uploaded and message saved successfully', {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            // 其他已有的处理代码...
            if (request.method === 'POST' && url.pathname === '/api/messages') {
                const { username, message, timestamp } = await request.json();

                console.log('Received POST Data:', { username, message, timestamp });

                const filteredUsername = filterMessage(username);
                const filteredMessage = filterMessage(message);

                const result = await DB.prepare('INSERT INTO messages (username, message, timestamp) VALUES (?, ?, ?)')
                    .bind(filteredUsername, filteredMessage, timestamp)
                    .run();

                console.log('Insert Result:', result);

                return new Response('Message saved', {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            } else if (request.method === 'GET' && url.pathname === '/api/messages') {
                const { results } = await DB.prepare('SELECT username, message, timestamp FROM messages ORDER BY id DESC LIMIT 50').all();
                return new Response(JSON.stringify(results), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                });
            } else if (request.method === 'POST' && url.pathname === '/api/name') {
                const { username, latitude, longitude, ipAddress, timestamp } = await request.json();
                const filteredUsername = filterMessage(username);
                const result = await DB.prepare('INSERT INTO user_info (username, latitude, longitude, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?)')
                    .bind(filteredUsername, latitude, longitude, ipAddress, timestamp)
                    .run();

                return new Response('User info saved', {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }
        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(`Failed to process request: ${error.message}`, {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        return new Response('Not Found', {
            status: 404,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    },
};
