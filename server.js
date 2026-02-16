const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3456;

// 设置 CORS 响应头中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 保留原有静态文件服务（支持访问根目录及子文件夹文件�?app.use(express.static(__dirname));
// 解析 JSON 请求体（用于接收表单数据�?app.use(express.json());

// 用户配置（生产环境建议使用环境变量或加密存储�?const USERS = {
    'admin': 'admin123',
    'user': 'user123'
};

// 认证中间�?- 验证用户凭据
function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '需要认�? });
    }
    
    // 从Base64解码 Basic Auth: base64(username:password)
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (USERS[username] && USERS[username] === password) {
        req.user = username;
        next();
    } else {
        res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
}

// 用户验证接口
app.post('/api/verify-user', (req, res) => {
    const { username, password } = req.body;
    
    if (USERS[username] && USERS[username] === password) {
        res.json({ success: true, message: '验证成功' });
    } else {
        res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
});

// 根路径路由：保留原有返回 main.html 的功�?app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// 保存反馈标签的API接口
app.post('/api/save-feedback-tag', (req, res) => {
    try {
        const { tags } = req.body;
        const tagsDir = path.join(__dirname, '联系', '标签');
        
        if (!fs.existsSync(tagsDir)) {
            fs.mkdirSync(tagsDir, { recursive: true });
        }
        
        const metadataPath = path.join(tagsDir, 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify({ tags: tags }, null, 2), 'utf8');
        
        res.json({ success: true, message: '标签保存成功' });
        console.log(`�?反馈标签保存成功`);
    } catch (error) {
        console.error('�?保存反馈标签失败:', error);
        res.status(500).json({ success: false, message: '保存失败，请重试' });
    }
});

// 检查反馈重名的API接口
app.post('/api/check-feedback-duplicate', (req, res) => {
    try {
        const { baseTitle } = req.body;
        const saveDir = path.join(__dirname, '联系', '反馈');
        
        if (!baseTitle) {
            return res.status(400).json({ success: false, message: '标题不能为空' });
        }
        
        if (!fs.existsSync(saveDir)) {
            return res.json({ exists: false, sequence: 0 });
        }
        
        // 读取所有反馈文�?        const files = fs.readdirSync(saveDir).filter(file => file.endsWith('.html'));
        
        // 查找匹配的标�?        const pattern = new RegExp(`^${baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:-(\\d+))?\\.html$`);
        const matches = [];
        
        files.forEach(file => {
            const match = file.match(pattern);
            if (match) {
                const sequence = match[1] ? parseInt(match[1]) : 1;
                matches.push(sequence);
            }
        });
        
        if (matches.length === 0) {
            return res.json({ exists: false, sequence: 0 });
        }
        
        // 找到最大序号并返回下一个序�?        const maxSequence = Math.max(...matches);
        return res.json({ exists: true, sequence: maxSequence + 1 });
        
    } catch (error) {
        console.error('�?检查重名失�?', error);
        res.status(500).json({ success: false, message: '检查失败，请重�? });
    }
});

// 接收工单提交的接口（修改后）
app.post('/save-ticket', (req, res) => {
    try {
        const { title, fileName, tag, publisher, content } = req.body;
        const saveDir = path.join(__dirname, '联系', '反馈');
        
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
            console.log(`📁 自动创建反馈文件�? ${saveDir}`);
        }
        
        // 使用前端传递的文件名（格式：标�?标题�?用户名）
        const safeFileName = fileName.replace(/[\/:*?"<>|]/g, '-') + '.html';
        const filePath = path.join(saveDir, safeFileName);
        
        // 调整文件内容格式为完整的HTML，使�?<br> 处理换行
        const formattedContent = content.replace(/\n/g, '<br>');
        const fileContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #3498db; padding-bottom: 15px; margin-bottom: 20px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #666; }
        .content { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="info-item"><span class="info-label">标签�?/span>${tag}</div>
        <div class="info-item"><span class="info-label">提交时间�?/span>${new Date().toLocaleString()}</div>
        <div class="info-item"><span class="info-label">提交人：</span>${publisher}</div>
        <div class="content">${formattedContent}</div>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(filePath, fileContent, 'utf8');
        res.json({ success: true, message: '工单保存成功', filePath: `/联系/反馈/${safeFileName}` });
        console.log(`�?新工单保�? ${filePath}`);
    } catch (error) {
        console.error('�?工单保存失败:', error);
        res.status(500).json({ success: false, message: '保存失败，请重试' });
    }
});

// 启动服务器（支持公网访问�?app.listen(port, '0.0.0.0', () => {
    console.log(`�?服务器启动成�?`);
    console.log(`📡 公网访问表单: http://47.117.126.60:40006/%E8%81%94%E7%B3%BB/%E5%8F%8D%E9%A6%88.html`);
    console.log(`💻 本地访问根目�? http://localhost:${port}`);
    console.log(`📁 服务目录: ${__dirname}`);
    console.log(`📂 工单保存目录: ${path.join(__dirname, '联系', '反馈')}`);
    console.log(`📚 文章目录: ${path.join(__dirname, '文章')}`);
});

// 保存标签的API接口
app.post('/api/save-tag', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '需要登录才能创建标�? });
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!USERS[username] || USERS[username] !== password) {
        return res.status(401).json({ success: false, message: '无权限创建标�? });
    }
    
    try {
        const { name, description, hidden } = req.body;
        const articlesDir = path.join(__dirname, '文章', '标签');
        
        if (!name || !description) {
            return res.status(400).json({ success: false, message: '标签名称和说明不能为�? });
        }
        
        if (!fs.existsSync(articlesDir)) {
            fs.mkdirSync(articlesDir, { recursive: true });
        }
        
        // 加载或创建标签元数据
        const metadataPath = path.join(articlesDir, 'metadata.json');
        let metadata = { tags: [] };
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        
        // 检查标签名是否已存�?        if (metadata.tags.some(t => t.name === name)) {
            return res.status(400).json({ success: false, message: '标签名称已存�? });
        }
        
        // 创建新标�?        const newTagId = 'tag_' + Date.now();
        const newTagFolder = name.replace(/[\/:*?"<>|]/g, '-');
        
        // 添加新标签到元数�?        metadata.tags.push({
            id: newTagId,
            name: name,
            description: description,
            folder: newTagFolder,
            hidden: hidden || false,
            articles: []
        });
        
        // 创建新标签文件夹
        const newTagDir = path.join(articlesDir, newTagFolder);
        if (!fs.existsSync(newTagDir)) {
            fs.mkdirSync(newTagDir, { recursive: true });
        }
        
        // 创建新标签的元数�?        const tagMetadata = {
            tagId: newTagId,
            tagName: name,
            articles: []
        };
        fs.writeFileSync(path.join(newTagDir, 'metadata.json'), JSON.stringify(tagMetadata, null, 2), 'utf8');
        
        // 创建新标签的文章列表页面
        createArticleListPage(newTagDir, name, '../../标签选择.html');
        
        // 更新主元数据
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        
        res.json({
            success: true,
            message: '标签创建成功',
            tagId: newTagId
        });
        console.log(`🏷�? 创建新标�? ${name}`);
    } catch (error) {
        console.error('�?标签创建失败:', error);
        res.status(500).json({ success: false, message: '创建失败，请重试' });
    }
});

// 保存草稿的API接口
app.post('/api/save-draft', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '需要登录才能保存草�? });
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!USERS[username] || USERS[username] !== password) {
        return res.status(401).json({ success: false, message: '无权限保存草�? });
    }
    
    try {
        const { id, title, tagId, tagName, author, publishTime, content, hidden } = req.body;
        const draftsDir = path.join(__dirname, '文章', '草稿');
        
        if (!fs.existsSync(draftsDir)) {
            fs.mkdirSync(draftsDir, { recursive: true });
        }
        
        // 加载或创建草稿元数据
        const metadataPath = path.join(draftsDir, 'metadata.json');
        let metadata = { drafts: [] };
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        
        const draftId = id || 'draft_' + Date.now();
        const saveTime = new Date().toLocaleString('zh-CN');
        
        const draftData = {
            id: draftId,
            title: title,
            tagId: tagId,
            tagName: tagName,
            author: author,
            publishTime: publishTime,
            content: content,
            hidden: hidden || false,
            saveTime: saveTime
        };
        
        // 查找并更新或添加草稿
        const existingIndex = metadata.drafts.findIndex(d => d.id === draftId);
        if (existingIndex >= 0) {
            metadata.drafts[existingIndex] = draftData;
        } else {
            metadata.drafts.push(draftData);
        }
        
        // 保存草稿文件
        const draftFilePath = path.join(draftsDir, draftId + '.json');
        fs.writeFileSync(draftFilePath, JSON.stringify(draftData, null, 2), 'utf8');
        
        // 更新元数�?        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        
        res.json({
            success: true,
            message: '草稿保存成功',
            draftId: draftId
        });
        console.log(`💾 草稿保存: ${draftId}`);
    } catch (error) {
        console.error('�?草稿保存失败:', error);
        res.status(500).json({ success: false, message: '保存失败，请重试' });
    }
});

// 获取草稿列表的API接口
app.get('/api/get-drafts', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '需要登录才能获取草�? });
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!USERS[username] || USERS[username] !== password) {
        return res.status(401).json({ success: false, message: '无权限获取草�? });
    }
    
    try {
        const draftsDir = path.join(__dirname, '文章', '草稿');
        const metadataPath = path.join(draftsDir, 'metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return res.json({ success: true, drafts: [] });
        }
        
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        res.json({ success: true, drafts: metadata.drafts || [] });
    } catch (error) {
        console.error('�?获取草稿失败:', error);
        res.status(500).json({ success: false, message: '获取失败，请重试' });
    }
});

// 保存文章的API接口
app.post('/api/save-article', (req, res) => {
    // 验证用户权限
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '需要登录才能发布文�? });
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!USERS[username] || USERS[username] !== password) {
        return res.status(401).json({ success: false, message: '无权限发布文�? });
    }
    
    try {
        const { title, tagId, tagName, author, publishTime, content, hidden, draftId } = req.body;
        const articlesDir = path.join(__dirname, '文章', '标签');
        
        if (!fs.existsSync(articlesDir)) {
            fs.mkdirSync(articlesDir, { recursive: true });
        }
        
        // 加载标签元数�?        const metadataPath = path.join(articlesDir, 'metadata.json');
        let metadata = { tags: [] };
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        
        // 找到现有标签
        const existingTag = metadata.tags.find(t => t.id === tagId);
        if (!existingTag) {
            return res.status(400).json({ success: false, message: '标签不存�? });
        }
        
        const targetTagName = existingTag.name;
        const targetTagFolder = existingTag.folder;
        
        // 创建文章文件�?        const safeTitle = title.replace(/[\/:*?"<>|]/g, '-');
        const articleFolder = safeTitle;
        const tagDir = path.join(articlesDir, targetTagFolder);
        const articleDir = path.join(tagDir, articleFolder);
        
        if (!fs.existsSync(articleDir)) {
            fs.mkdirSync(articleDir, { recursive: true });
        }
        
        // 生成文章ID
        const articleId = 'art_' + Date.now();
        
        // 创建文章元数�?        const articleMetadata = {
            articleId: articleId,
            title: title,
            author: author,
            publishTime: publishTime,
            tag: targetTagName,
            tagId: tagId,
            hidden: hidden || false,
            summary: content.substring(0, 100) + '...',
            versions: [{
                version: '1.0',
                createTime: publishTime,
                description: '初始版本'
            }]
        };
        fs.writeFileSync(path.join(articleDir, 'metadata.json'), JSON.stringify(articleMetadata, null, 2), 'utf8');
        
        // 转换Markdown内容为HTML
        const htmlContent = convertMarkdownToHtml(content);
        
        // 创建文章HTML
        const articleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${targetTagName}</title>
    <link rel="icon" href="../../../icon.png">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; padding: 20px; background: #f5f5f5; color: #333; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; color: #38a038; border: 2px solid #ff0000; background: white; border-radius: 5px; cursor: pointer; transition: all 0.3s; text-decoration: none; margin-bottom: 20px; }
        .back-btn:hover { background: #0000008a; color: white; }
        .article-header { border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
        .article-title { font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0 0 15px 0; }
        .article-meta { display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; color: #666; }
        .meta-item { display: flex; align-items: center; gap: 5px; }
        .tag-badge { display: inline-block; padding: 4px 12px; background: #3498db; color: white; border-radius: 15px; font-size: 12px; }
        .article-content { font-size: 16px; line-height: 1.8; }
        .article-content h1, .article-content h2, .article-content h3 { color: #2c3e50; margin-top: 30px; margin-bottom: 15px; }
        .article-content h1 { border-left: 5px solid #3498db; padding-left: 15px; }
        .article-content h2 { border-left: 4px solid #3498db; padding-left: 15px; }
        .article-content h3 { border-left: 3px solid #3498db; padding-left: 12px; }
        .article-content pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; border-left: 4px solid #3498db; }
        .article-content code { font-family: 'Consolas', monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        .article-content pre code { background: transparent; padding: 0; }
        .article-content ul, .article-content ol { padding-left: 20px; }
        .article-content li { margin: 8px 0; }
        .article-content p { margin: 10px 0; }
        .article-content blockquote { border-left: 4px solid #e74c3c; padding-left: 15px; color: #7f8c8d; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <a href="../文章列表.html" class="back-btn">�?返回标签</a>
        <div class="article-header">
            <h1 class="article-title">${title}</h1>
            <div class="article-meta">
                <div class="meta-item"><span class="tag-badge">${targetTagName}</span></div>
                <div class="meta-item">👤 作�? ${author}</div>
                <div class="meta-item">📅 发布时间: ${publishTime.replace('T', ' ')}</div>
            </div>
        </div>
        <div class="article-content">${htmlContent}</div>
    </div>
</body>
</html>`;
        fs.writeFileSync(path.join(articleDir, '文章.html'), articleHtml, 'utf8');
        
        // 创建文章TXT
        fs.writeFileSync(path.join(articleDir, '文章.txt'), content, 'utf8');
        
        // 更新标签元数�?        const tagMetadataPath = path.join(tagDir, 'metadata.json');
        let tagMetadata = { tagId: tagId, tagName: targetTagName, articles: [] };
        if (fs.existsSync(tagMetadataPath)) {
            tagMetadata = JSON.parse(fs.readFileSync(tagMetadataPath, 'utf8'));
        }
        tagMetadata.articles.push({
            id: articleId,
            title: title,
            folder: articleFolder,
            createTime: publishTime.split('T')[0],
            author: author,
            hidden: hidden || false
        });
        fs.writeFileSync(tagMetadataPath, JSON.stringify(tagMetadata, null, 2), 'utf8');
        
        // 更新主元数据
        const mainTag = metadata.tags.find(t => t.id === tagId);
        if (mainTag) {
            mainTag.articles = tagMetadata.articles;
        }
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        
        // 删除草稿（如果有�?        if (draftId) {
            const draftsDir = path.join(__dirname, '文章', '草稿');
            const draftFilePath = path.join(draftsDir, draftId + '.json');
            const draftMetadataPath = path.join(draftsDir, 'metadata.json');
            
            if (fs.existsSync(draftFilePath)) {
                fs.unlinkSync(draftFilePath);
            }
            
            if (fs.existsSync(draftMetadataPath)) {
                const draftMetadata = JSON.parse(fs.readFileSync(draftMetadataPath, 'utf8'));
                draftMetadata.drafts = draftMetadata.drafts.filter(d => d.id !== draftId);
                fs.writeFileSync(draftMetadataPath, JSON.stringify(draftMetadata, null, 2), 'utf8');
            }
            
            console.log(`🗑�? 删除草稿: ${draftId}`);
        }
        
        res.json({
            success: true,
            message: '文章保存成功',
            filePath: `/文章/标签/${targetTagFolder}/${articleFolder}/文章.html`
        });
        console.log(`�?新文章保�? ${path.join(articleDir, '文章.html')}`);
    } catch (error) {
        console.error('�?文章保存失败:', error);
        res.status(500).json({ success: false, message: '保存失败，请重试' });
    }
});

// 删除文章的API接口
app.post('/api/delete-article', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '需要登录才能删除文�? });
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!USERS[username] || USERS[username] !== password) {
        return res.status(401).json({ success: false, message: '无权限删除文�? });
    }
    
    try {
        const { articleId } = req.body;
        const articlesDir = path.join(__dirname, '文章', '标签');
        
        if (!articleId) {
            return res.status(400).json({ success: false, message: '文章ID不能为空' });
        }
        
        // 加载标签元数�?        const metadataPath = path.join(articlesDir, 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            return res.status(404).json({ success: false, message: '未找到标签数�? });
        }
        
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // 查找文章所在的标签
        let targetTag = null;
        let targetArticle = null;
        
        for (const tag of metadata.tags) {
            if (tag.articles) {
                const article = tag.articles.find(a => a.id === articleId);
                if (article) {
                    targetTag = tag;
                    targetArticle = article;
                    break;
                }
            }
        }
        
        if (!targetTag || !targetArticle) {
            return res.status(404).json({ success: false, message: '未找到指定的文章' });
        }
        
        // 删除文章文件�?        const articleDir = path.join(articlesDir, targetTag.folder, targetArticle.folder);
        if (fs.existsSync(articleDir)) {
            fs.rmSync(articleDir, { recursive: true, force: true });
            console.log(`🗑�? 删除文章文件�? ${articleDir}`);
        }
        
        // 更新标签元数�?        const tagDir = path.join(articlesDir, targetTag.folder);
        const tagMetadataPath = path.join(tagDir, 'metadata.json');
        if (fs.existsSync(tagMetadataPath)) {
            const tagMetadata = JSON.parse(fs.readFileSync(tagMetadataPath, 'utf8'));
            tagMetadata.articles = tagMetadata.articles.filter(a => a.id !== articleId);
            fs.writeFileSync(tagMetadataPath, JSON.stringify(tagMetadata, null, 2), 'utf8');
        }
        
        // 更新主元数据
        targetTag.articles = targetTag.articles.filter(a => a.id !== articleId);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        
        res.json({
            success: true,
            message: `文章 "${targetArticle.title}" 删除成功`
        });
        console.log(`�?文章删除成功: ${targetArticle.title}`);
    } catch (error) {
        console.error('�?删除文章失败:', error);
        res.status(500).json({ success: false, message: '删除失败，请重试' });
    }
});

// 删除标签的API接口
app.post('/api/delete-tag', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: '需要登录才能删除标�? });
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!USERS[username] || USERS[username] !== password) {
        return res.status(401).json({ success: false, message: '无权限删除标�? });
    }
    
    try {
        const { tagId } = req.body;
        const articlesDir = path.join(__dirname, '文章', '标签');
        
        if (!tagId) {
            return res.status(400).json({ success: false, message: '标签ID不能为空' });
        }
        
        // 加载标签元数�?        const metadataPath = path.join(articlesDir, 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            return res.status(404).json({ success: false, message: '未找到标签数�? });
        }
        
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // 查找要删除的标签
        const targetTagIndex = metadata.tags.findIndex(t => t.id === tagId);
        if (targetTagIndex === -1) {
            return res.status(404).json({ success: false, message: '未找到指定的标签' });
        }
        
        const targetTag = metadata.tags[targetTagIndex];
        const articleCount = targetTag.articles ? targetTag.articles.length : 0;
        
        // 删除标签文件夹（包括所有文章）
        const tagDir = path.join(articlesDir, targetTag.folder);
        if (fs.existsSync(tagDir)) {
            fs.rmSync(tagDir, { recursive: true, force: true });
            console.log(`🗑�? 删除标签文件�? ${tagDir}（包�?${articleCount} 篇文章）`);
        }
        
        // 从主元数据中移除标签
        metadata.tags.splice(targetTagIndex, 1);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        
        res.json({
            success: true,
            message: `标签 "${targetTag.name}" 及其 ${articleCount} 篇文章删除成功`
        });
        console.log(`�?标签删除成功: ${targetTag.name}`);
    } catch (error) {
        console.error('�?删除标签失败:', error);
        res.status(500).json({ success: false, message: '删除失败，请重试' });
    }
});

// 简单的Markdown转HTML函数
function convertMarkdownToHtml(markdown) {
    let html = markdown
        // 处理代码�?        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // 处理行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 处理标题
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // 处理粗体
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // 处理斜体
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // 处理引用
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        // 处理无序列表
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        // 处理有序列表
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        // 处理换行
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // 包裹段落
    html = '<p>' + html + '</p>';
    
    // 修复列表
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    html = html.replace(/<\/ul><ul>/g, '');
    
    return html;
}

// 创建文章列表页面的函�?function createArticleListPage(tagDir, tagName, backUrl) {
    const listHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tagName} - 文章列表</title>
    <link rel="icon" href="../../../icon.png">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 20px; background: #f5f5f5; color: #333; min-height: 100vh; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: white; border-radius: 10px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; color: #38a038; border: 2px solid #ff0000; background: white; border-radius: 5px; cursor: pointer; transition: all 0.3s; text-decoration: none; margin-bottom: 20px; }
        .back-btn:hover { background: #0000008a; color: white; }
        .tag-title { font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0 0 10px 0; }
        .tag-description { color: #7f8c8d; }
        .articles-list { display: flex; flex-direction: column; gap: 20px; }
        .article-card { background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; border-left: 4px solid #3498db; }
        .article-card:hover { transform: translateX(5px); box-shadow: 0 5px 20px rgba(0,0,0,0.15); }
        .article-title { font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .article-meta { display: flex; gap: 15px; flex-wrap: wrap; color: #7f8c8d; font-size: 14px; }
        .loading, .empty { text-align: center; padding: 40px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <a href="${backUrl}" class="back-btn">�?返回标签选择</a>
        <div class="header">
            <h1 class="tag-title">${tagName}</h1>
            <p class="tag-description">用户创建的标�?/p>
        </div>
        <div id="articles-container" class="articles-list"></div>
    </div>

    <script>
        async function loadArticles() {
            const container = document.getElementById('articles-container');
            container.innerHTML = '<div class="loading">加载�?..</div>';
            
            try {
                const response = await fetch('metadata.json');
                if (!response.ok) throw new Error('加载失败');
                
                const data = await response.json();
                container.innerHTML = '';
                
                data.articles.forEach(article => {
                    const card = document.createElement('div');
                    card.className = 'article-card';
                    card.onclick = () => window.location.href = article.folder + '/文章.html';
                    card.innerHTML = '<div class="article-title">' + article.title + '</div><div class="article-meta"><span>👤 ' + article.author + '</span><span>📅 ' + article.createTime + '</span></div>';
                    container.appendChild(card);
                });
                
                if (data.articles.length === 0) {
                    container.innerHTML = '<div class="empty">暂无文章</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="empty">加载文章失败</div>';
                console.error('加载文章失败:', error);
            }
        }
        
        window.addEventListener('DOMContentLoaded', loadArticles);
    </script>
</body>
</html>`;
    fs.writeFileSync(path.join(tagDir, '文章列表.html'), listHtml, 'utf8');
}

