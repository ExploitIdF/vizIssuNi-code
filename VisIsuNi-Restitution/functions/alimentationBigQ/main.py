import os
import csv
import json
import base64
from google.cloud import storage, bigquery,firestore
from datetime import datetime
import pandas as pd
from pandas_gbq import to_gbq
from google.oauth2 import service_account

# Variables d'environnement
PROJECT_ID = 'batiment-dirif'
BUCKET_NAME = "batiment-dirif.firebasestorage.app" 
DATASET_ID = "vizissuni"
db = firestore.Client()
def Storage2BQ(cloudevent):
    try:
        data = json.loads(cloudevent.get_data().decode("utf-8"))
    except Exception as e:
        print(f"Failed to decode cloudevent data: {e}")
        return
    file_name = data.get('name')
    print("cloudevent.data:", data)
    bigquery_client = bigquery.Client(project='batiment-dirif')
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    uri = f"gs://{BUCKET_NAME}/{file_name}"
    if file_name.startswith('configPC/'): 
        TABLE_ID =  "configPC" 
        table_ref = bigquery_client.dataset(DATASET_ID).table(TABLE_ID)
        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.CSV,
            skip_leading_rows=1,  # Si le CSV a une ligne d'en-tête
            autodetect=True,      # BigQuery va essayer de détecter le schéma
            write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE, # Remplace la table existante
        )    
        try:
            load_job = bigquery_client.load_table_from_uri(
                uri,
                table_ref,
                job_config=job_config,
            )
            print(f"Lancement du job de chargement {load_job.job_id}")
            load_job.result()  # Attendre la fin du job
            print(f"Chargement réussi. Le fichier {file_name} a été chargé dans la table {table_ref.path}.")
            return 'OK', 200 
        except Exception as e:
            print(f"Erreur lors du chargement : {e}")
            return 'KO', 400 
    if file_name.startswith('stock-responses/'):  #stock-responses/
        try:
            idOT, user, dateRap = file_name.replace(".csv", "").split("_")
            idOT=idOT[-6:]
        except ValueError:
            print(f"Skipping invalid filename: {file_name}")
            return 'KO format du fichier de réponses incorrect', 400
        TABLE_ID =  "viz-reponses" 
        table_ref = bigquery_client.dataset(DATASET_ID).table(TABLE_ID)
        blob = bucket.blob(file_name)            
        content = blob.download_as_text().splitlines()
        reader = csv.DictReader(content, fieldnames=["codePC", "codeRC", "commentaire","horodate"])
        rows_to_insert = []
        reader_iter = iter(reader)
        next(reader_iter)
        for row in reader_iter:
            rows_to_insert.append({
                "idOT": idOT,
                "user": user,
                "dateRap": dateRap,
                "codePC": row["codePC"],
                "codeRC": row["codeRC"],
                "commentaire": row["commentaire"],
                "horodate": row["horodate"]
            })
        if not rows_to_insert:
                return "No rows to insert.",400
        # Envoi dans BigQuery
        errors = bigquery_client.insert_rows_json(table_ref , rows_to_insert)

  # 4. Traitement pour la table agrégée (grav_ferm_date_rps)
        reponses = pd.DataFrame(rows_to_insert)
        
        # Récupération de l'OT père via l'OT fils
        idOT_doc_data = db.collection('ot_fils').document(idOT).get().to_dict()  
        otPa = idOT_doc_data.get('otPereId')
        otPa_doc_data = db.collection('ot_pere').document(otPa).get().to_dict()
        
        otFils_query = db.collection('ot_fils').where('otPereId', '==', otPa)
        otFilsA = pd.DataFrame([doc.to_dict() for doc in otFils_query.stream()])
        
        cnf = pd.DataFrame([doc.to_dict() for doc in db.collection('point_controle_conf').stream()]).set_index('codeRC')
        
        # 5. Jointures et filtrage
        rpsC = reponses[['idOT', 'codeRC', 'commentaire', 'horodate']] \
            .join(cnf[['descPC', 'descRC', 'niveau', 'Gravité']], on='codeRC') 

        rpsC = rpsC[rpsC['Gravité'].isin(['Défaut mineur', 'Défaut majeur'])]
        rpsC['fermetureId'] = otPa_doc_data.get('fermetureId')
        rpsC['datePrevisionnelle'] = otPa_doc_data.get('datePrevisionnelle')
        rpsC['codeEx']=idOT_doc_data.get('codeEx')
        rpsC['otPereId'] =  otPa
        rpsC = rpsC[[
           'niveau', 'Gravité', 'codeEx', 'otPereId', 'fermetureId', 'commentaire', 
            'descPC', 'descRC', 'datePrevisionnelle', 'horodate'
        ]] #
        if len(rpsC)==0:
            print("No relevant responses to aggregate.")
            return "No relevant responses to aggregate.", 200
        # 6. Envoi des données agrégées à BigQuery
        try:
            to_gbq(
                dataframe=rpsC,
                destination_table=f'{PROJECT_ID}.{DATASET_ID}.grav_ferm_date_rps',
                project_id=PROJECT_ID,
                if_exists='append',
                chunksize=10000,
            )
            print(f"DataFrame agrégé ajouté avec succès à la table grav_ferm_date_rps.")
            return f"Inserted {len(rows_to_insert)} rows  and updated aggregated table.", 200
        except Exception as e:
            print(rpsC.dtypes)
            print(rpsC.head())
            print(f"Une erreur est survenue lors du téléversement de la table agrégée : {e}")
            return "KO", 400


    if file_name.startswith('charge_OT/'): 
        TABLE_ID = "chargeOT" 
        bigquery_client = bigquery.Client(project=PROJECT_ID)
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        
        dateCharge = 'DT' + datetime.now().strftime("%y-%m-%d-%H-%M-%S")
        
        blob = bucket.blob(file_name)
        content = blob.download_as_text().splitlines()
        
        headers = content[0].split(',')
        lstChamps = ["N° d'OT", "Équipement", "Intervention", "OT père", "Date de début prévue"]
        map_headers = {"N° d'OT":"nmOT", "Équipement":'equip', "OT père":"OTPere", "Date de début prévue":"dateDebutPrevue"}
        
        processed_headers = ['h'+str(i) if headers[i] not in lstChamps else map_headers.get(headers[i], headers[i]) for i in range(len(headers))]
        
        reader = csv.DictReader(content, fieldnames=processed_headers)
        reader_iter = iter(reader)
        next(reader_iter)
        for row in reader_iter:
            dd = row.get("dateDebutPrevue", "01/01/1970")
            dateDebutPrevue = dd[8:10] + '-' + dd[3:5] + '-' + dd[0:2]
            rows_to_insert.append({
                "nmOT": row.get("nmOT", "Abs"),
                "equip": row.get("equip", "Abs"),
                "Intervention": row.get("Intervention", "Abs"),
                "OTPere": row.get("OTPere", "Abs"),
                "dateDebutPrevue": dateDebutPrevue,
                "dateCharge": dateCharge 
            })

        # The rest of your insertion logic
        if not rows_to_insert:
            print("No rows to insert. The CSV file may be empty or improperly formatted.")
            return "No data to insert.", 400

        bq_client = bigquery.Client()
        table_id = f"{bq_client.project}.{DATASET_ID}.{TABLE_ID}"
        errors = bq_client.insert_rows_json(table_id, rows_to_insert)

        if errors:
            print(f"BigQuery insertion errors: {errors}")
            return f"Errors inserting rows: {errors}", 500

        return f"Inserted {len(rows_to_insert)} rows into {table_id}.", 200

    print(f"Le fichier {file_name} n'est pas dans configPC ou stock-responses, ignorer le traitement.")
    return "KO",400

if __name__ == '__main__':
    # Exemple d'exécution locale pour le test
    # Vous pouvez simuler un événement Cloud Storage
    fake_event = """
    {"name": "stock-responses/152438_jofernandez@terideal.fr_25-09-10-11-50-45.csv"
    }"""
    fake_event=fake_event.encode('utf-8')
    class FakeCloudEvent:
        def get_data(self):
            return fake_event
    os.environ['GOOGLE_CLOUD_PROJECT'] = 'batiment-dirif'
    
    Storage2BQ(FakeCloudEvent())
    # Dé-commentez les lignes ci-dessus pour un test local