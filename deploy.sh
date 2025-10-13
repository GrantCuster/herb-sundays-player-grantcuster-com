#!/usr/bin/env bash
set -euo pipefail

APP_YAML="./app.yaml"
ENV_FILE="./backend/.env"

# Backup
cp "$APP_YAML" "$APP_YAML.bak"

# Start env_variables section if not already there
echo "env_variables:" >> "$APP_YAML"

# Append each key/value from .env
while IFS='=' read -r key value; do
  # Skip empty lines or comments
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  # Quote the value to avoid YAML type issues
  echo "  $key: \"$value\"" >> "$APP_YAML"
done < "$ENV_FILE"

echo "  NODE_ENV: 'production'" >> "$APP_YAML"
echo "  PORT: '8080'" >> "$APP_YAML"

# Deploy
gcloud app deploy "$APP_YAML" --quiet --project computing-experiments

# Restore clean version
mv "$APP_YAML.bak" "$APP_YAML"
