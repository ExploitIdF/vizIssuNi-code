# BigQuery

On a dabord fait une fonction, csv2BQ, qui sert à la fois pour viz-reponses et configPC.
Ensuite on a fait une fonction spécifique pour charge_OT.

Deploiement function
```
gcloud auth application-default set-quota-project batiment-dirif
gcloud config set project batiment-dirif

gcloud services enable artifactregistry.googleapis.com  cloudbuild.googleapis.com   run.googleapis.com    logging.googleapis.com  eventarc.googleapis.com

gcloud run deploy storage2bq  --source . --function Storage2BQ --base-image python313 --region europe-west9

sugg gemini :
gcloud functions deploy getMajeur   --runtime python311  --trigger-http  --allow-unauthenticated   --entry-point getMajeur



```
folders;
stock-responses/
stock-rp-dev/


## BigQuery charge OT
Ici, la difficulté vient du fait que les noms des champs de la table fournie contiennent des caractères non admisibles par BiG Query. Les deux premières colonnes n'ont pas de titre...
On remplace les noms des champs utile.
On a utilisé le modèle de chargement des rapports de réponse (viz-reponse)

Deploiement function et création de la table selon le schéma fourni :
```
gcloud run deploy ot2bq  --source . --function charge_OT2BQ --base-image python313 --region europe-west9
bq mk --table --schema ./table_schema.json vizissuni.chargeOT

```
Pour créer le trigger, on va dans la console RUN.
C'est aussi l'accès le plus simple aux Loggings pour le debuggage.




