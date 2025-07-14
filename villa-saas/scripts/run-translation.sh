#!/bin/bash

# Script pour exécuter la traduction automatique des fichiers i18n

echo "=== Installation des dépendances ==="
pip install -r scripts/requirements-translate.txt

echo -e "\n=== Lancement de la traduction ==="
python scripts/translate-i18n.py

echo -e "\n=== Traduction terminée ==="
echo "Les fichiers traduits sont dans packages/i18n/src/locales/"