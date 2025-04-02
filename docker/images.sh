#!/bin/bash

IMAGES=($(awk '/^[[:blank:]]+image:/ {sub(/^[[:blank:]]+image:[[:blank:]]*"?/,""); gsub(/"|'"'"'/,""); print}' docker-compose.yml | sort -u))

PLATFORM=linux/amd64

docker rmi "${IMAGES[@]}" 2>/dev/null

for image in "${IMAGES[@]}"; do
  docker pull --platform $PLATFORM $image
done

# Extract arch from $PLATFORM
docker save -o images-${PLATFORM##*/}.tar "${IMAGES[@]}"