# Cloudflare 匿名聊天室

### 更新日志

***2024-09-22***
- 将获取消息和发送消息接口分成两个接口
- 新增密码 (admin123456) 在聊天框发送密码清空数据库和储存桶
- 防刷屏: 重复消息仅保留最后一条
- 防刷屏: UBB/文件/图片仅保留最后一条

***2024-09-21***
- 修复聊天室展示消息顺序错误的问题
- 增加上传文件/图片功能
- 增加超链接和图链 UBB
- 增加站标
- 增加违禁词替换

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
3. **创建 Worker**
   - 创建一个名为 `chat-worker` 的 Worker 并绑定域名。

4. **粘贴 Worker 代码**
   - 将 `worker.js` 代码粘贴进去并保存。

5. **绑定 D1 数据库**
   - Worker 绑定 D1 数据库，变量名为 `DB`。

6. **创建 Pages**
   - 创建一个 Pages，名称可以自定义。

7. **修改 API 地址**
   - 修改 `/pages/script.js` 中的 `api.bhb.us.kg` 为你 Worker 的域名。

8. **上传 Pages 目录**
   - 将 Pages 目录上传到 Pages。

9. **访问分配的 Pages 域名**
   - 访问分配给你的 Pages 域名即可。

10. **创建 R2 储存桶**
    - 名称随便，绑定到 Worker 变量名称为 `cos`。
    - 储存桶绑定域名，用于生成文件链接。

11. **修改储存桶地址**
    - 修改 `worker.js` 中的 `cos.bhb.us.kg` 为你的 R2 域名。

## 其他注意事项
- 输入用户名时会获取经纬度和 IP 地址写入数据库。
- 如果拒绝授权地理位置，数据库中经纬度和 IP 会为 0。
- 聊天室界面会每秒获取一次最新消息。
- Worker 接口一次最多返回 50 条消息。
- `cos.bhb.us.kg` 是 R2 绑定的域名。
- `api.bhb.us.kg` 是 Worker 绑定的域名。
- `chat.bhb.us.kg` 是 Pages 绑定的域名。
- 清空数据库和储存桶的密码在 `worker.js` 中 (默认 admin123456)。
- 防刷屏可以限制 `/api/sendMessage` 接口 10 秒 2 次。

#### **演示网站: [https://chat.bhb.us.kg/](https://chat.bhb.us.kg/)**
#### **演示截图**

![演示截图](https://github.com/BsaLee/cf_niming_chatroom/blob/main/1726857751514.jpg)
