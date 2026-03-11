#!/bin/sh

echo "Waiting for n8n to start..."

sleep 20

echo "Importing workflows..."

for file in /workflows/*.json; do
  echo "Importing $file"
  n8n import:workflow --input=$file
done

echo "Workflows imported!"