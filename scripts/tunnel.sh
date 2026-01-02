#!/bin/bash
echo "Starting Serveo tunnel on port 3000..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:3000 serveo.net
