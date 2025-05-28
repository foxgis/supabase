#!/bin/bash

set -euo pipefail

PLATFORM=linux/amd64

# 解析镜像列表
IMAGES=($(awk '/^[[:blank:]]+image:/ {sub(/^[[:blank:]]+image:[[:blank:]]*"?/,""); gsub(/"|'"'"'/,""); print}' docker-compose.yml | sort -u))

# 删除旧镜像
docker rmi "${IMAGES[@]}" 2>/dev/null

# 拉取镜像
for image in "${IMAGES[@]}"; do
  docker pull --platform $PLATFORM $image
done

# 导出为镜像包
docker save "${IMAGES[@]}" | gzip > images-${PLATFORM##*/}.tar.gz
