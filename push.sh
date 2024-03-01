pkill -f node 
cd /home/node/bridge 
git pull 
git fetch --all 
git reset --hard 
node --no-deprecation index.js
