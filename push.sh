#!/bin/bash

pkill -f node 
cd /nodeFiles/bridge 
git pull 
git fetch --all 
git reset --hard 
npm install
npm rebuild
node --no-deprecation index.js
