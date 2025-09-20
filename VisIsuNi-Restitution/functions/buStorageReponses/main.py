import os
import datetime
from google.cloud import storage

# --- Variables d'environnement pour la configuration (meilleure pratique) ---
# Vous devez définir ces variables lors du déploiement de la fonction.
IN_BUCKET_NAME = os.environ.get('IN_BUCKET_NAME', 'batiment-dirif.firebasestorage.app')
OUT_BUCKET_NAME = os.environ.get('OUT_BUCKET_NAME', 'back-up-vizissuni')
SOURCE_FOLDER = 'stock-responses'

def backup_reponses_to_bu_bucket(event=None, context=None):
    """
    Sauvegarde les fichiers d'un dossier Cloud Storage vers un autre.

    Cette fonction est conçue pour être exécutée par un déclencheur Cloud Scheduler.
    Elle copie tous les fichiers du dossier SOURCE_FOLDER vers un nouveau
    dossier dans le bucket de sauvegarde, nommé d'après la date du jour.

    Args:
        event (dict): Un dictionnaire de données de l'événement. Non utilisé ici.
        context (google.cloud.functions.Context): Les métadonnées de l'événement. Non utilisé ici.
    """
    try:
        # Initialisation des clients de stockage
        storage_client = storage.Client()
        in_bucket = storage_client.bucket(IN_BUCKET_NAME)
        out_bucket = storage_client.bucket(OUT_BUCKET_NAME)

        # Création du nom du dossier de sauvegarde basé sur la date du jour (YYYY-MM-DD)
        # C'est plus clair que le jour de l'année et évite les problèmes de ré-écriture.
        now = datetime.datetime.now()
        backup_folder_name = f"reponses/{now.strftime('%Y-%m-%d')}"
        print(f"Démarrage de la sauvegarde pour les fichiers de '{SOURCE_FOLDER}' vers '{backup_folder_name}'.")

        # Liste les blobs (fichiers) avec le préfixe spécifié
        blobs_to_copy = []
        for blob in in_bucket.list_blobs(prefix=SOURCE_FOLDER):
            # Ignorer le dossier racine lui-même s'il est listé
            if blob.name == f"{SOURCE_FOLDER}/":
                continue

            # Construire le nouveau chemin du blob dans le bucket de destination
            # On remplace le préfixe d'entrée par le nouveau nom de dossier de sauvegarde.
            new_blob_name = f"{backup_folder_name}/{blob.name.replace(f'{SOURCE_FOLDER}/', '')}"
            
            # Copier le blob vers le bucket de sortie
            new_blob = in_bucket.copy_blob(blob, out_bucket, new_blob_name)
            blobs_to_copy.append(new_blob.name)
            
            print(f"Copié : {blob.name} -> {new_blob.name}")

        print(f"Sauvegarde terminée. Total de fichiers copiés : {len(blobs_to_copy)}")
        
    except Exception as e:
        print(f"Une erreur est survenue lors de la sauvegarde : {e}")
        return "KO", 500
    
    return "OK", 200

if __name__ == '__main__':
    # Exemple d'utilisation locale pour tester la fonction
    # Vous pouvez simuler l'exécution sans déclencheur.
    print("Exécution locale de la fonction de sauvegarde.")
    # Assurez-vous d'avoir les variables d'environnement définies ou utilisez des valeurs par défaut.
    backup_reponses_to_bu_bucket()