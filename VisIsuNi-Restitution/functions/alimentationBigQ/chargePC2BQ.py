import os 
import csv
from google.cloud import storage, bigquery
from datetime import datetime

# Variables d'environnement
BUCKET_NAME = os.environ.get("BUCKET_NAME", "batiment-dirif.firebasestorage.app")
FOLDER = "charge_PC/"
BQ_DATASET = os.environ.get("BQ_DATASET", "vizissuni")  
BQ_TABLE = os.environ.get("BQ_TABLE", "configPC")

def charge_PC2BQ(request):
    """HTTP-triggered entrypoint for Cloud Run Job."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    # Liste des blobs CSV dans le dossier
    blobs = list(bucket.list_blobs(prefix=FOLDER))
    if not blobs:
        return "No CSV files found."
    rows_to_insert = []
# comment initialiser blob ? 
    if not blob.name.endswith(".csv"):
        return "Not a CSV file.",400
    # Téléchargement CSV en mémoire
    content = blob.download_as_text().splitlines()
    reader = csv.DictReader(content, fieldnames=["codePC", "codeRC","descPC", "descRC","commentaireObl","gravité"])
    for row in reader:
        rows_to_insert.append({
            "codePC": row["codePC"],
            "codeRC": row["codeRC"],
            "descPC": row["descPC"],
            "descRC": row["descRC"],
            "commentaireObl": row["commentaireObl"],
            "gravité": row["gravité"]
        })
    if not rows_to_insert:
        return "No rows to insert."
    # Envoi dans BigQuery
    bq_client = bigquery.Client()
    table_id = f"{bq_client.project}.{BQ_DATASET}.{BQ_TABLE}"
    errors = bq_client.insert_rows_json(table_id, rows_to_insert)
    if errors:
        print(f"BigQuery insertion errors: {errors}")
        return f"Errors inserting rows: {errors}"
    return f"Inserted {len(rows_to_insert)} rows into {table_id}."
