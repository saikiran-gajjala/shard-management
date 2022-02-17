docker login
docker build . -f 'Dockerfile' -t cosmos2mongui
docker tag cosmos2mongcdc peerengineer/cosmos2mongo-ui:v1.1
docker push peerengineer/cosmos2mongo-ui:v1.1
