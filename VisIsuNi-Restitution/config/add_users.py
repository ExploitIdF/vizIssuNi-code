# pip install firebase-admin
import firebase_admin
from firebase_admin import credentials, auth

# Initialize the app with your service account
cred = credentials.Certificate(r"c:\Users\spera\Videos\on\GitHub\batiment-dirif\VisIsuNi-Restitution\config\batiment-dirif-5f2d45106dd7.json")
firebase_admin.initialize_app(cred)

lstMail=['Hassen.Ait-alla@developpement-durable.gouv.fr',
 'Sebastien.Finateu@developpement-durable.gouv.fr',
 'Adrien.Simonpietri@developpement-durable.gouv.fr',
 'thomas.henry@developpement-durable.gouv.fr',
 'David.Sznajder@developpement-durable.gouv.fr',
 'marie.peon@developpement-durable.gouv.fr',
 'stephane.cesar@developpement-durable.gouv.fr',
 'jean-luc.dubuis@developpement-durable.gouv.fr',
 'Yves.Mafranc@developpement-durable.gouv.fr',
 'Nordine.Farhat@developpement-durable.gouv.fr',
 'Philippe.Bougeard@developpement-durable.gouv.fr',
 'Richard.Pengloan@developpement-durable.gouv.fr',
 'Xavier.Clement@developpement-durable.gouv.fr',
 'quentin.chery@developpement-durable.gouv.fr',
 'thomas.antonelli@developpement-durable.gouv.fr',
 'mohamed.yaye@developpement-durable.gouv.fr',
 'Philippe.Augeraud@developpement-durable.gouv.fr',
 'Luc.Absalon@developpement-durable.gouv.fr',
 'Catherine.Traventhal@developpement-durable.gouv.fr',
 'stevens.rabahi@developpement-durable.gouv.fr',
 'benjamin.masson@developpement-durable.gouv.fr',
 'samy.lemhechheche@developpement-durable.gouv.fr',
 'david.lamiral@developpement-durable.gouv.fr',
 'yohann.lacurial@developpement-durable.gouv.fr',
 'nelly.argien@developpement-durable.gouv.fr',
 'sandrine.robinet@developpement-durable.gouv.fr',
 'Hugues.Desbonnes@developpement-durable.gouv.fr',
 'Christophe.Fiette@developpement-durable.gouv.fr',
 'Paulo.Rodrigues@developpement-durable.gouv.fr',
 'Didier.Vignane@developpement-durable.gouv.fr',
 'aurelien.collard@developpement-durable.gouv.fr',
 'samantha.miotti@developpement-durable.gouv.fr',
 'Frederic.Milicevic@developpement-durable.gouv.fr']

for email in lstMail:
    try:
        user = auth.create_user(       email=email  )
        print(f"Created user: {user.email}")
    except Exception as e:
        print(f"Failed to create user {email}: {e}")