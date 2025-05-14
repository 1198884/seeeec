#!/usr/bin/env sh

# 发生错误时终止
set -e

# 构建
npm run build

# 使用Surge部署
# 注意：第一次使用时需要创建账户
cd dist && surge --domain https://your-custom-domain.surge.sh

# 完成
echo "部署完成！访问 https://your-custom-domain.surge.sh 查看" 