# Chercher les défauts majeurs d'un OT Père

## Prompt :
Dans un composant angular fire, créer une table avec getMajeur(Num ) le résultat d'une function python google Run 
la function python interroge une table BigQuery et renvoie le résultat au format json
La requete BigQuery est la suivante :
SELECT * FROM `batiment-dirif.vizissuni.grav_ferm_date_rps` 
where (`Gravité` = "Défaut majeur") and (otPereId = Num)

## Test de la fonction

curl -X POST "https://getmajeur-222260276716.us-central1.run.app" -H "Authorization: bearer $(gcloud auth print-identity-token)" -H "Content-Type: application/json" -d '{  "Num": "152436"}'


Invoke-WebRequest -Method POST -Uri "https://getmajeur-dxppcwjuuq-uc.a.run.app" -Headers @{
  "Authorization" = "Bearer $(gcloud auth print-identity-token)"
  "Content-Type" = "application/json"
} -Body '{ "Num": "152436"}'
