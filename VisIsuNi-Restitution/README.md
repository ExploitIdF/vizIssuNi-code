# VisIsuNi-Restitution : Visualisation des rapports saisis dans VisIsuNi
mise à jour : 250909   
projectId: "batiment-dirif"  diridf24
sites: 
dev:"vizissuni-restitution-dev.firebaseapp.com"  
prod:"visisuni-restitution.firebaseapp.com"  


## Commandes memento

```
angular.json : "outputPath": "dist/batiment-dirif"  
firebase.json : "public": "dist/batiment-dirif/browser",
"target" dans .firebaserc

ng add @angular/fire (pour réaliser les instalations )  
npm install -g firebase-tools  
firebase init  


``` 
## A faire
Production du fichier pour intégrer les résultats des observations dans CosWin (cf modèle BOP  joint à l'invitation du 9/9)   
Production des rapports (niveau OT Père) que le titulaire mettra sur CosWin pour rendre compte de son travail.   


## prompts AI
Dans un projet firebase , il est possible de créer plusieurs applications.
Pour une application, on peut créer plusieurs sites.
Chaque site peut héberger une version différente de l'application.
Dans quels cas est-il préférable de concevoir les versions différentes comme des applications différentes ?

Quand est-il utile de créer 2 applications (web-app) différentes ?
Si avec une même web-app, on depoie des codes différents sur des sites différents, quels difficultés sont à craindre ?

J'utilise angular fire (firebase ) dans un seul projet firebase.
L'option d'avoir plusieurs projet est totalement exclue.
Je veux une application angular et un site firebase pour la saisie des rapports et
une autre application angular avec un autre site pour la visuation des rapports.
Deux options sont possibles :
Les sites sont déployés à partir de la même application firebase.
Les sites sont déployés à partir de 2 applications firebase différentes.

en quoi est-il utile de créer plusieurs applications web-app dans le même projet firebase ?  

créer une variable pointsControle de type PointControle[], charger la collection "point_controle_conf" dans cete variable et faire en sorte qu'elle soit accessible dans tous les components.

gcloud storage buckets describe gs://batiment-dirif.firebasestorage.app --format="default(cors_config)"

gsutil cors set cors.json gs://batiment-dirif.appspot.com

gsutil cors set cors.json gs://batiment-dirif.firebasestorage.app




Add comp-detail-f.component 
select a fermeture -> selectFerm,
 select a day in the next 12 month -> selectPrevision 
 select a niveau (annuel | nuit | jour) -> selctNiv 
 add a doc in collection "ajout_presta" : 
 id: selectFerm.id,data= {nom:selectFerm.nom,datePrev:selectPrevision,niveau: selctNiv,etat:"commande"} 
 for all niche in selectFerm.niches: 
 add a doc in collection "ajout_com" : 
 data= { codeId: niche.codeId, fermeture:selectFerm.nom, datePrev:selectPrevision,niveau: selctNiv,etat:"commande"}

I have  an angular fire app that takes care of authentication.
Write a additional compotent with angular/fire and material to import a csv fire and change the headers
 with renamed headers. the csv fire hase header ['OT Père','n° OT','date prévisionnelle'], new header = ['otPere','noOt','datePrev']. The result is stored in an array of dict.

I have  an angular fire app that takes care of authentication.
in service.storage, add a function gamme2Fermeture. This function get the csv file https://storage.cloud.google.com/batiment-dirif.firebasestorage.app/reference/gamme_fermeture.csv?authuser=7 and for each line , if input is first value, return second value. Make only one call to the csv and store the result for other calls.


