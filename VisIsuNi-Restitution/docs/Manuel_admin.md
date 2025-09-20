# Manuel d'administration VisIssuNi
## Chargement des OTs dans VisIssuNi 
Les PCTT créent les OT pères dans CosWin en utilisant les gammes mises en place par UPMM/BOP, selon les 30 fermetures et les 3 niveaux d'intervention.  CosWin crée automatiquement les OT fils selon les gammes.   
Pour que ces OTs soient visibles dans VisIssuNi, UPMM/BOP doit les charger dans VisIssuNi.
Cette opération doit être réalisée une fois par semaine, même si en principe la programmation par les PCTT intervient beaucoup plus d'une semaine avant l'intervention.   

Pour charger les OTs dans VisIssuNi, il faut exporter le fichier depuis CosWin et le convertir au format CSV (le séparateur est la virgule).  
On peut ensuite le charger dans VisIssuNi en se rendant à cette adresse : 
https://vizissuni-restitution-dev.web.app/menu
On sélectionne "Chargement OT".   
Il suffit ensuite de suivre les instructions.


## Mise à jour des points de contrôle
La liste des éléments à contrôler et, pour chaque point de contrôle, la liste des options de saisie dans l'application ne sont pas finalisées au 25/8. Il faut en particulier intégrer les observation de José Miranda et ajouter une colonne "gravité". Les points de contrôle auront encore besoin d'être mises à jour en phase d'initialisation sur la base de l'expérience.  
Cette mise à jour relève de UPMM/BOP. 
A l'adresse : https://vizissuni-restitution-dev.web.app/menu, seuls les utilisateurs qui possèdent le rôle "admin" ont l'option de mettre à jour les points de contrôle.   
Il suffit ensuite de suivre les instructions et de respecter la forme du fichier CSV.

On peut supprimer des points de contrôle en supprimant les lignes correspondantes du fichier CSV.   
Les codes des points de contrôle supprimé ne doivent pas être réutiliser pour des points de contrôle qui seront ajoutés. Il faut utiliser des codes différents pour éviter que l'on fasse des traitements sur la base des codes et que l'on assimile des points de contrôles de natures différentes.  

## Correspondance entre gammes et fermetures                                                                          
L'application utilise un fichier de correspondance entre les codes des gammes et les codes des fermetures. Si l'on devait modifier un code de gamme ou ajouter une fermeture, il faudrait mettre à jour le fichier de correspondance.  
Ce fichier est placé dans un bucket à l'adresse : https://storage.googleapis.com/batiment-dirif.firebasestorage.app/reference/gamme_fermeture.csv

## Correspondance entre tatouage  et code exploitant                                                                          
L'application utilise un fichier de correspondance entre les tatouage et les codes exploitants. Si l'on devait modifier un code exploitant ou ajouter une issue, il faudrait mettre à jour le fichier de correspondance.
Ce fichier est placé dans un bucket à l'adresse : https://storage.googleapis.com/batiment-dirif.firebasestorage.app/reference/tatouage2codeEx.csv


## Environement de développement
Pour faire des tests sur un environnement de développement, on a créé les applications :  
https://vizissuni-dev.web.app &  
https://vizissuni-restitution-dev.web.app   
Avant de modifier un fichier de configuration, en cas de doute sur la codification, il est conseillé de charger le fichier de configuration dans l'application de développement et de tester le résultat sur les deux applications avant de mettre à jour l'application de production.  









