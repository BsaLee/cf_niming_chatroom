export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 获取 D1 数据库实例
        const DB = env.DB;

        if (!DB) {
            return new Response('Database not configured', { status: 500 });
        }

        if (request.method === 'OPTIONS') {
            // 处理预检请求 (CORS preflight request)
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        try {
            if (request.method === 'POST' && url.pathname === '/api/messages') {
                const { username, message, timestamp } = await request.json();

                console.log('Received POST Data:', { username, message, timestamp });

                // 插入消息到 D1 数据库，包括 timestamp
                const result = await DB.prepare('INSERT INTO messages (username, message, timestamp) VALUES (?, ?, ?)')
                    .bind(username, message, timestamp)
                    .run();

                console.log('Insert Result:', result);

                return new Response('Message saved', {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            } else if (request.method === 'GET' && url.pathname === '/api/messages') {
                // 获取最多 50 条消息
                const { results } = await DB.prepare('SELECT username, message, timestamp FROM messages ORDER BY id DESC LIMIT 50')
                    .all();

                console.log('Fetched Messages:', results);

                return new Response(JSON.stringify(results), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                });
            } else if (request.method === 'POST' && url.pathname === '/api/name') {
                const { username, latitude, longitude, ipAddress, timestamp } = await request.json();

                console.log('Received User Info:', { username, latitude, longitude, ipAddress, timestamp });

                // 将用户信息插入到 D1 数据库
                const result = await DB.prepare('INSERT INTO user_info (username, latitude, longitude, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?)')
                    .bind(username, latitude, longitude, ipAddress, timestamp)
                    .run();

                console.log('User Info Insert Result:', result);

                return new Response('User info saved', {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }
        } catch (error) {
            console.error('Worker Error:', error); // 输出详细的错误信息
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
