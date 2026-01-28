#!/bin/bash

# React质押项目 - 快速设置脚本

echo "🚀 开始React质押项目设置..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 复制环境配置
echo "⚙️ 设置环境配置..."
if [ ! -f ".env" ]; then
    cp .env.development .env
    echo "✅ 使用开发环境配置"
else
    echo "✅ 环境配置已存在"
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo ""
    echo "🎯 下一步："
    echo "1. 运行 'npm run dev' 启动开发服务器"
    echo "2. 访问 http://localhost:5173 查看应用"
    echo "3. 连接钱包测试质押功能"
    echo ""
    echo "📁 重要文件："
    echo "- src/views/StakeView.jsx - 质押界面"
    echo "- src/stores/stakeStore.js - 状态管理"
    echo "- src/App.jsx - Mova网络配置"
    echo "- .env - 环境配置（包含Mova RPC）"
    echo ""
    echo "🌐 网络信息："
    echo "- 链名称: Mova Mainnet"
    echo "- 链ID: 61900"
    echo "- RPC: https://rpc.movachain.com/"
    echo "- 浏览器: https://explorer.movachain.com/"
    echo ""
    echo "🎊 React质押功能（Mova网络）已准备就绪！"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi