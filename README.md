# 文章管理系统

一个基于Node.js和Express的轻量级文章管理系统，支持标签分类、文章发布、草稿保存等功能。

## 功能特性

- 标签管理：创建、删除标签，支持标签显示/隐藏
- 文章发布：支持Markdown格式，可选隐藏文章
- 草稿功能：保存草稿，支持继续编辑
- 用户认证：基于Basic Auth的用户验证
- 文章删除：删除文章及其关联数据

## 技术栈

- 后端：Node.js + Express
- 前端：原生HTML/CSS/JavaScript
- 数据存储：本地文件系统（JSON）

## 安装运行

```bash
# 安装依赖
npm install

# 启动服务器
node server.js
```

访问地址：http://localhost

## 默认用户

- 用户名：admin
- 密码：admin123

- 用户名：user
- 密码：user123

## 项目结构

```
article-system/
├── server.js          # 服务器主文件
├── package.json       # 项目配置
├── README.md          # 项目说明
├── .gitignore         # Git忽略文件
├── icon.png           # 网站图标
└── 文章/              # 文章数据目录
    ├── 标签选择.html    # 标签选择页面
    ├── 添加文章.html    # 添加文章页面
    ├── 添加标签.html    # 添加标签页面
    ├── 草稿/            # 草稿存储
    └── 标签/            # 标签数据
```

## API接口

- POST /api/verify-user - 用户验证
- POST /api/save-tag - 保存标签
- POST /api/save-draft - 保存草稿
- GET /api/get-drafts - 获取草稿列表
- POST /api/save-article - 保存文章
- POST /api/delete-article - 删除文章
- POST /api/delete-tag - 删除标签

## 许可证

MIT License
