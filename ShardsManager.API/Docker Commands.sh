docker login
docker build . -f 'ShardsManager.API/Dockerfile' -t shard-management-api
docker tag shard-management-api peerengineer/shard-management-api:v1.0
docker push peerengineer/shard-management-api:v1.0
