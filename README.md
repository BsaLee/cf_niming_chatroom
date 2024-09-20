# 项目 README

## 步骤

1. **创建 D1 数据库**
   - 数据库名称可以自定义。

2. **执行 SQL 语句生成表结构**
   ```sql
   CREATE TABLE IF NOT EXISTS messages (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT NOT NULL,
       message TEXT NOT NULL,
       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE IF NOT EXISTS user_info (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT NOT NULL,
       latitude REAL,
       longitude REAL,
       ipAddress TEXT,
       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
   );

4. **创建 Worker**
   - 创建一个名为 `chat-worker` 的 Worker 并绑定域名。

5. **粘贴 Worker 代码**
   - 将 `worker.js` 代码粘贴进去并保存。

6. **绑定 D1 数据库**
   - Worker 绑定 D1 数据库，变量名为 `DB`。

7. **创建 Pages**
   - 创建一个 Pages，名称可以自定义。

8. **修改 API 地址**
   - 修改 `/pages/script.js` 中的 `api.bhb.us.kg` 为你 Worker 的域名。

9. **上传 Pages 目录**
   - 将 Pages 目录上传到 Pages。

10. **访问分配的 Pages 域名**
   - 访问分配给你的 Pages 域名即可。
[演示网站](https://chat.bhb.us.kg/)
![演示截图](blob:https://github.com/cd76b5b4-79b0-49fa-b06b-1428e57696cd)

