pkill -f node 
cd /nodeFiles/bridge 
git pull 
git fetch --all 
git reset --hard 
node --no-deprecation index.js
