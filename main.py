import zipfile
import os

# Chemin vers le fichier zip
zip_file_path = "main.zip"

# Dossier où extraire le contenu
extract_folder = "main"

# Créer le dossier si nécessaire
os.makedirs(extract_folder, exist_ok=True)

# Ouvrir et extraire le fichier zip
with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
    zip_ref.extractall(extract_folder)

print(f"Fichiers extraits dans le dossier : {extract_folder}")