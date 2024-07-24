#!/bin/bash

pkill -f node 
cd /nodeFiles/bridge
git pull 
git fetch --all 
git reset --hard 
npm install
node --no-deprecation index.js
