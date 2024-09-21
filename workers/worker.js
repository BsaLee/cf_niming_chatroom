export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const DB = env.DB;
        const R2 = env.cos;

        if (!DB) {
            return new Response('Database not configured', { status: 500 });
        }

        const allowedOrigin = 'https://chat.bhb.us.kg';

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': allowedOrigin,
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        // 违禁词库
        const forbiddenWords = [
            '习近平', '李克强', '张德江', '王沪宁', '赵紫阳', '胡锦涛', '温家宝', 
            '江泽民', '邓小平', '毛泽东', '朱德', '周恩来', '刘少奇', '陈毅', 
            '邓小平', '林彪', '李克农', '聂荣臻', '徐向前', '叶剑英', '陈独秀', 
            '张闻天', '贺龙', '彭德怀', '罗荣桓', '杨尚昆', '张云逸', '李克农', 
            '王明', '抗日战士', '国家', '政府', '政权', '反动', '革命', '抗议', 
            '示威', '政治', '腐败', '特权', '镇压', '反对派', '民族', '领袖', 
            '自由', '权利', '派别', '统治', '斗争', '局势', '社会', '政府官员', 
            '干预', '合法性', '不满', '抗争', '抵抗', '集会', '言论', '法治', 
            '制裁', '反抗', '捍卫', '抵制', '民族主义', '极端', '骚乱', '异议', 
            '专制', '独裁', '流亡', '煽动', '暴动', '谴责', '动乱', '选举', 
            '抗击', '暴力', '仇恨', '辱骂', '攻击', '谩骂', '抨击', '挑衅', 
            '侮辱', '仇视', '敌对', '叛国', '暴徒', '极端主义', '恐怖', 
            '反叛', '制裁', '不满', '分裂', '分裂主义', '阴谋', '腐蚀', 
            '阴暗', '镇压', '人权', '冲突', '武装', '动荡', '恶性', '敌人', 
            '清洗', '骚扰', '诽谤', '骚动', '斗殴', '冲突', '战斗', '绑架', 
            '纵火', '极端分子', '暗杀', '暴乱', '镇压', '反抗军', '敌对势力', 
            '恐怖活动', '破坏', '阴谋论', '政治迫害', '群体性事件', '民间抗争', 
            '民权', '煽动暴力', '反社会', '冲突升级', '人权侵犯', '社会动荡', 
            '持不同政见者', '打压', '剥夺', '暴力行为', '激进分子', '违法', 
            '抵制', '非法', '网络暴力', '恶意中伤', '谩骂', '仇恨言论', 
            '政治斗争', '暴动', '公民权利', '经济制裁', '敌意', '煽动性', 
            '分裂政府', '暗流涌动', '暴力镇压', '乌托邦', '反抗运动', 
            '政治危机', '群体冲突', '不公正', '失业', '流亡者', '敌对行为', 
            '法外', '动荡不安', '破坏活动', '动员', '非暴力抗争', '难民', 
            '政治洗牌', '国务院', '中央政府', '全国人民代表大会', 
            '国家安全部', '外交部', '国防部', '财政部', '公安部', 
            '最高人民法院', '最高人民检察院', '全国政协', '人民解放军', 
            '中共中央', '中共中央政治局', '中共中央委员会', '各省市政府', 
            '地方政府', '副总理', '部长', '省长', '市长', '王岐山', 
            '张德江', '汪洋', '李克强', '马凯', '傻逼', 'SB', '草泥马', 
            '操你妈', '操你', '草你', '曹你', '麻痹', '妈逼', '妈币', 
            '母亲', '死去', '贱人', '废物', '无耻', '混蛋', '傻瓜', 
            '脑残', '白痴', '低能', '去你妈的', '傻叉', '王八蛋', 
            '恶心', '狗屎', '畜生', '臭不要脸', '滚蛋', '可恶', '丫头', 
            '二货', '神经病', '丫的', '大鸡', '小鸡', '你爹', '你爸'
        ];

        // 过滤函数
        const filterMessage = (text) => {
            let filteredText = text;
            forbiddenWords.forEach(word => {
                const regex = new RegExp(word, 'g');
                filteredText = filteredText.replace(regex, ' ');
            });
            return filteredText;
        };

        try {
            if (request.method === 'POST' && url.pathname === '/api/upload') {
                const formData = await request.formData();
                const file = formData.get('file');
                const username = formData.get('username');

                if (!file || !username) {
                    return new Response('Missing file or username', { status: 400 });
                }

                const originalFileName = file.name;
                const extension = originalFileName.split('.').pop();
                const baseName = originalFileName.slice(0, -(extension.length + 1));
                const truncatedBaseName = baseName.length > 20 ? baseName.slice(0, 20) : baseName;
                const newFileName = `${username}_${Date.now()}_${truncatedBaseName}.${extension}`;
                const fileBuffer = await file.arrayBuffer();

                await R2.put(newFileName, fileBuffer, {
                    httpMetadata: {
                        contentType: file.type,
                    },
                });

                const filePath = `https://r2.bhb.us.kg/${newFileName}`;
                const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

                let message;
                if (imageExtensions.includes(extension.toLowerCase())) {
                    message = `[img]${filePath}[/img]`;
                } else {
                    message = `[url=${filePath}]${originalFileName}[/url]`;
                }

                await DB.prepare('DELETE FROM messages WHERE message LIKE ? OR message LIKE ?')
                    .bind('%[img]%', '%[/url]%')
                    .run();

                const filteredUsername = filterMessage(username);
                const filteredMessage = filterMessage(message);

                await DB.prepare('INSERT INTO messages (username, message, timestamp) VALUES (?, ?, ?)')
                    .bind(filteredUsername, filteredMessage, new Date().toISOString())
                    .run();

                return new Response('File uploaded and message saved successfully', {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': allowedOrigin }
                });
            }

            if (request.method === 'POST' && url.pathname === '/api/sendMessage') {
                const { username, message } = await request.json();

                // 清空数据库和 R2 存储桶
                if (message === 'admin123456') {
                    await DB.prepare('DELETE FROM messages').run();
                    
                    const objects = await R2.list(); // 列出存储桶中的所有对象
                    console.log('R2 list result:', objects); // 打印 R2.list() 的结果
                
                    // 确保 objects 存在并且包含 objects 数组
                    if (objects.objects && Array.isArray(objects.objects)) {
                        console.log('Objects in R2 bucket:', objects.objects); // 打印所有文件名
                        for (const object of objects.objects) {
                            await R2.delete(object.key); // 删除每个对象
                        }
                    } else {
                        console.log('No objects found in R2 bucket or objects is not an array.');
                    }
                    
                    return new Response('All messages and files deleted', {
                        status: 200,
                        headers: { 'Access-Control-Allow-Origin': allowedOrigin }
                    });
                }
                
                

                const filteredUsername = filterMessage(username);
                const filteredMessage = filterMessage(message);

                if (filteredUsername.length > 16 || filteredMessage.length > 80) {
                    return new Response('Username must be 16 characters or less, and message must be 80 characters or less', { status: 400 });
                }

                await DB.prepare('DELETE FROM messages WHERE message = ?')
                    .bind(filteredMessage)
                    .run();

                const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

                await DB.prepare('INSERT INTO messages (username, message, timestamp) VALUES (?, ?, ?)')
                    .bind(filteredUsername, filteredMessage, timestamp)
                    .run();

                return new Response('Message saved (duplicates removed)', {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': allowedOrigin }
                });
            } else if (request.method === 'GET' && url.pathname === '/api/messages') {
                const { results } = await DB.prepare('SELECT username, message, timestamp FROM messages ORDER BY id DESC LIMIT 50').all();
                return new Response(JSON.stringify(results), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': allowedOrigin
                    },
                });
            } else if (request.method === 'POST' && url.pathname === '/api/name') {
                const { username } = await request.json();
                const filteredUsername = filterMessage(username);
                return new Response(`Username received: ${filteredUsername}`, {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': allowedOrigin }
                });
            }
        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(`Failed to process request: ${error.message}`, {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': allowedOrigin }
            });
        }

        return new Response('Not Found', {
            status: 404,
            headers: { 'Access-Control-Allow-Origin': allowedOrigin }
        });
    },
};
