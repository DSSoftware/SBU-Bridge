#!/bin/bash

pkill -f node 
git pull 
git fetch --all 
git reset --hard 
npm install
npm update
node --no-deprecation index.js
