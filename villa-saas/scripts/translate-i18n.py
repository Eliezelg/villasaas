#!/usr/bin/env python3
"""
Script pour traduire automatiquement les fichiers i18n JSON
Utilise deep-translator pour traduire depuis le français vers toutes les langues manquantes
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
from deep_translator import GoogleTranslator
import time

# Configuration
BASE_DIR = Path(__file__).parent.parent / "packages" / "i18n" / "src" / "locales"
SOURCE_LANG = "fr"  # Langue source
TARGET_LANGS = ["ar", "de", "es", "he", "hi", "it", "ja", "nl", "pl", "pt", "ru", "tr", "zh"]
JSON_FILES = ["admin.json", "booking.json", "common.json", "emails.json"]

# Mapping des codes de langue pour deep-translator
LANG_MAPPING = {
    "zh": "zh-CN",  # Chinois simplifié
    "pt": "pt",     # Portugais
    "he": "iw",     # Hébreu (Google utilise 'iw' au lieu de 'he')
}

# Langues RTL (Right-to-Left)
RTL_LANGS = ["ar", "he"]


def translate_text(text: str, target_lang: str, translator: GoogleTranslator) -> str:
    """
    Traduit un texte vers la langue cible
    """
    try:
        # Ne pas traduire les chaînes vides ou les placeholders
        if not text or text.strip() == "" or all(c in "{}" for c in text):
            return text
        
        # Préserver les placeholders (ex: {name}, {date}, etc.)
        import re
        placeholders = re.findall(r'\{[^}]+\}', text)
        
        # Remplacer temporairement les placeholders
        temp_text = text
        for i, placeholder in enumerate(placeholders):
            temp_text = temp_text.replace(placeholder, f"PLACEHOLDER{i}")
        
        # Traduire
        translated = translator.translate(temp_text)
        
        # Restaurer les placeholders
        for i, placeholder in enumerate(placeholders):
            translated = translated.replace(f"PLACEHOLDER{i}", placeholder)
        
        return translated
    except Exception as e:
        print(f"Erreur lors de la traduction de '{text}': {e}")
        return text


def translate_json_content(content: Dict[str, Any], target_lang: str, translator: GoogleTranslator, path: str = "") -> Dict[str, Any]:
    """
    Traduit récursivement le contenu d'un dictionnaire JSON
    """
    translated = {}
    
    for key, value in content.items():
        current_path = f"{path}.{key}" if path else key
        
        if isinstance(value, dict):
            # Récursion pour les objets imbriqués
            translated[key] = translate_json_content(value, target_lang, translator, current_path)
        elif isinstance(value, str):
            # Traduire la chaîne
            print(f"  Traduction de {current_path}...")
            translated[key] = translate_text(value, target_lang, translator)
            # Petit délai pour éviter de surcharger l'API
            time.sleep(0.1)
        elif isinstance(value, list):
            # Gérer les listes (si présentes)
            translated[key] = [
                translate_text(item, target_lang, translator) if isinstance(item, str) else item
                for item in value
            ]
        else:
            # Conserver les autres types (nombres, booléens, etc.)
            translated[key] = value
    
    return translated


def ensure_dir_exists(path: Path):
    """Crée le répertoire s'il n'existe pas"""
    path.mkdir(parents=True, exist_ok=True)


def main():
    """Fonction principale"""
    print("=== Script de traduction i18n ===")
    print(f"Dossier de base: {BASE_DIR}")
    print(f"Langue source: {SOURCE_LANG}")
    print(f"Langues cibles: {', '.join(TARGET_LANGS)}")
    print(f"Fichiers à traduire: {', '.join(JSON_FILES)}")
    print()
    
    # Vérifier que le dossier source existe
    source_dir = BASE_DIR / SOURCE_LANG
    if not source_dir.exists():
        print(f"Erreur: Le dossier source {source_dir} n'existe pas!")
        sys.exit(1)
    
    # Traiter chaque langue cible
    for target_lang in TARGET_LANGS:
        print(f"\n--- Traduction vers {target_lang} ---")
        
        # Mapper le code de langue si nécessaire
        translator_lang = LANG_MAPPING.get(target_lang, target_lang)
        
        # Créer le translator
        try:
            translator = GoogleTranslator(source=SOURCE_LANG, target=translator_lang)
        except Exception as e:
            print(f"Erreur lors de la création du translator pour {target_lang}: {e}")
            continue
        
        # Créer le dossier de destination
        target_dir = BASE_DIR / target_lang
        ensure_dir_exists(target_dir)
        
        # Traiter chaque fichier JSON
        for json_file in JSON_FILES:
            source_file = source_dir / json_file
            target_file = target_dir / json_file
            
            # Vérifier si le fichier source existe
            if not source_file.exists():
                print(f"  Avertissement: {json_file} n'existe pas dans {SOURCE_LANG}")
                continue
            
            # Vérifier si le fichier cible existe déjà
            if target_file.exists():
                print(f"  {json_file} existe déjà, ignoré (supprimer pour retraduire)")
                continue
            
            print(f"\n  Traitement de {json_file}...")
            
            try:
                # Lire le fichier source
                with open(source_file, 'r', encoding='utf-8') as f:
                    source_content = json.load(f)
                
                # Traduire le contenu
                translated_content = translate_json_content(source_content, target_lang, translator)
                
                # Ajouter les métadonnées pour les langues RTL
                if target_lang in RTL_LANGS and isinstance(translated_content, dict):
                    translated_content["_rtl"] = True
                
                # Sauvegarder le fichier traduit
                with open(target_file, 'w', encoding='utf-8') as f:
                    json.dump(translated_content, f, ensure_ascii=False, indent=2)
                
                print(f"  ✓ {json_file} traduit avec succès")
                
            except Exception as e:
                print(f"  ✗ Erreur lors du traitement de {json_file}: {e}")
    
    print("\n=== Traduction terminée ===")
    print("\nPour installer les dépendances:")
    print("  pip install deep-translator")
    print("\nPour exécuter:")
    print("  python scripts/translate-i18n.py")
    print("\nNote: Les fichiers existants ne sont pas écrasés.")
    print("Supprimez les fichiers cibles pour les retraduire.")


if __name__ == "__main__":
    main()