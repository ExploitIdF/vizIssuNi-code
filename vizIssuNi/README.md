# VizIssuNi 
250814
Dans ce repo, on developpe l'application de saisie sur le terrain.   
On a trois "targets" (prod, dev & old,  voir dans .firebaserc)   

## old (à mettre à jour !)
Le titulaire a reçu le domaine correspondant à old : rapport   
La liste des points de contrôle est celle d'origine collection points_controle_conf
OT Père : ot_pere
OT Fils : ot_fils

## dev
La liste des points de contrôle est dans la collection : points_controle_conf-dev  
Cette collection est modification par VizIssuNi-restitution-dev  
Fanny dispose de l'adresse pour faire des tests.  
OT Père : ot_pere-dev  
OT Fils : ot_fils-dev  
  
npm run deploy:dev

mis dans package.json  
 ng serve --configuration=development


## prod
npm run deploy:prod


gsutil cors set cors.json gs://your-bucket-name


# Modification 2/9
Les noms longs des fermetures sont présentés pour faire le choix. 

L'erreur sur la prise en compte du caractère optionnel des commentaires a été traitée.   
Les commentaires optionnels apparaissent bien, selon la configuration chargée.  

Le numéro d'OT père, qui figure sur le bon de commande, à été ajouté au niveau du choix de la prestation, pour assurer que l'on ne se trompe pas de référence de prestation.

Le code exploitant de la niche qui est affiché est celui de l'OT, il est donc le dernier utilisé dans CosWin.

## A faire 
Ne pas écraser les OT déjà chargées.  
Utiliser les bons codes exploitant qui ont  été mis à jour pour les niches. 

## Cloud shell 
diridf24@cloudshell:~/vizIssuNi$ npm run serve:dev --disable-host-check



### Historique des prompts
Pour mon application angular / fire, mon-app, j'utilise deux hosting différents:my-app & my-app-dev.  
Dans my-app, j'utilise les collections points_controle_conf et ot_pere.  
Dans my-app-dev, j'utilise la collection points_controle_conf-div et ot_pere-dev. 

j'utilise 2 targets dans .firebaserc
Pour déployer :
firebase deploy --only my-app-dev
Pour tester :
firebase deploy --only hosting:prod   
firebase deploy --only hosting:dev

Je voudrais que la target choisie (prod ou dev) soit une variable que je puisse utiliser dans le service qui charge les données.
Comment faut il faire ?
