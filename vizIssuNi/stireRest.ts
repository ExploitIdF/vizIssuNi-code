import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, user, User, signOut, signInAnonymously, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, updateDoc, doc, collection, getDocs, query, where, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, uploadString  } from '@angular/fire/storage';
import { Observable, from, map, catchError, of, shareReplay, tap } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PointControle,Fermeture,OTFils,RapportIntervention,PointReponse } from '../models/intervention.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private auth: Auth = inject(Auth); // Injectez Auth en utilisant inject
  private firestore: Firestore = inject(Firestore);
  private http: HttpClient = inject(HttpClient);
  private storage: Storage = inject(Storage);

  private _pointsControle$?: Observable<PointControle[]>;
  get pointsControle$(): Observable<PointControle[]> {
    if (!this._pointsControle$) {
      const pointsControleCollection = collection(this.firestore, 'point_controle_conf_dev');
      this._pointsControle$ = from(getDocs(pointsControleCollection)).pipe(
        map(snapshot => snapshot.docs.map(doc => (doc.data()  as PointControle))),
        tap(points => console.log('Points de contrôle chargés:', points)),
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((error: any) => {
          console.error('Erreur lors de la récupération des points de contrôle:', error);
          return of([]);
        })
      );
    }
    return this._pointsControle$;
  }

  private _fermetures$?: Observable<Fermeture[]>;
  get fermetures$(): Observable<Fermeture[]> {
    if (!this._fermetures$) {
      const fermeturesCollection = collection(this.firestore, 'fermetures');
      this._fermetures$ = from(getDocs(fermeturesCollection)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fermeture))),
        tap(fermetures => console.log('Fermetures chargées:', fermetures)),
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((error: any) => {
          console.error('Erreur lors de la récupération des fermetures:', error);
          return of([]);
        })
      );
    }
    return this._fermetures$;
  }

  constructor() {}

  getOtPeresByFermetureId(fermetureId: string): Observable<any[]> {
    const otPereCollection = collection(this.firestore, 'ot_pere');
    // Crée une requête qui filtre les documents où 'fermetureId' correspond à la valeur passée
    const q = query(otPereCollection, where('fermetureId', '==', fermetureId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des OT pères:', error);
        return of([]);
      })
    );
  }
  getOtFilsByOtPereId(otPereId: string): Observable<any[]> {
    const otFilsCollection = collection(this.firestore, 'ot_commande');
    const q = query(otFilsCollection, where('otPereId', '==', otPereId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des OT fils:', error);
        return of([]);
      })
    );
  }
  getReponseByOt(otId: string): Observable<any[]> {
    const reponseCollection = collection(this.firestore, 'rapports_interventions');
    const q = query(reponseCollection, where('codeOT', '==', otId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des réponses :', error);
        return of([]);
      })
    );
  }

async getDatesPrevisionnelles(fermetureId: string): Promise<string[]> {
  const q = query(
    collection(this.firestore, 'ot_pere'),
    where('fermetureId', '==', fermetureId)
  );
  try {
    const querySnapshot = await getDocs(q);
    const result = querySnapshot.docs.map(
      doc => doc.data()['datePrevisionnelle'] as string);
    return result;
  } catch (error) {
    console.error('FirebaseService: Fatal error getting dates previsionnelles:', error);
    return [];
  }
}
  // OT Commande - Issues/Niches selon les critères
  async getOTDisponibles(
    fermetureId: string,
    datePrevisionnelle: string
  ): Promise<OTFils[]>  {
    let q = query(
      collection(this.firestore, 'ot_commande'),
      where('fermetureId', '==', fermetureId),
      where('datePrevisionnelle','==',datePrevisionnelle) // Assuming datePrevisionnelle is a string in the format 'YYYY-MM-DD')
    );
    try {
    const querySnapshot = await getDocs(q);
    console.log('FirebaseService: getObjetsDisponibles - Number of docs:', querySnapshot.docs.length);
    const res=[...new Set(querySnapshot.docs.map(doc => doc.data() as OTFils))];
    if (res.length > 1) {
      console.log('FirebaseService: getObjetsDisponibles - Premiers résultats:', res.slice(0, 2));
    } else {
      console.log('FirebaseService: getObjetsDisponibles - Un seul résultat:', res[0]);
    }
    return res;

      } catch (error) {
        console.error('FirebaseService: Error getting objets disponibles:', error);
        const querySnapshot = [];
        return [];
    }
  }

  // OT Fils pour un objet donné
  async getOTFils(
    datePrevisionnelle: string,
    codeObjet: string
  ): Promise<OTFils[]> {
    const q = query(
      collection(this.firestore, 'ot_commande'),
      where('codeObjet', '==', codeObjet),
      where('datePrevisionnelle', '==', datePrevisionnelle) // Directly use the string
    );
    const querySnapshot = await getDocs(q);
    const otFils: any[] = [];
    querySnapshot.docs.forEach(doc => {
      const data = doc.data() ;
      otFils.push(data);
    });
    return otFils;
  }

  async saveString(cha:string): Promise<string> {
    console.log(this.storage.app.options.storageBucket);
    const chaString = cha.replace(/"/g, '""'); // Échappe les guillemets doubles
    const storageRef = ref(this.storage, 'stock-responses/'+new Date().toISOString()+'.csv');
    uploadString(storageRef, chaString)
     .then((snapshot) => {
      console.log('Fichier CSV envoyé avec succès !');
    })
    .catch((error) => {
      console.error("Erreur lors de l'envoi du fichier : ", error);
    });
    return storageRef.fullPath; // Retourne le chemin du fichier stocké
  }


  // Rapports
  async saveRapport(rapport: RapportIntervention): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'rapports_interventions'), rapport);
    const responses = rapport.reponses;
    const headers = Object.keys(responses[0]);
    const csvHeaders = headers.join(',');
    const csvRows = responses.map(row => {
      const typedRow = row as { [key: string]: any };
      return headers.map(header => {
        const value = typedRow[header] !== undefined ? String(typedRow[header]).replace(/"/g, '""') : '';
        return `"${value}"`;
      }).join(',');
    });
    const csvString = [csvHeaders, ...csvRows].join('\n');
    const storageRef = ref(this.storage, 'stock-responses/'+new Date().toISOString()+'.csv');
    uploadString(storageRef, csvString)
     .then((snapshot) => {
      console.log('Fichier CSV envoyé avec succès !');
    })
    .catch((error) => {
      console.error("Erreur lors de l'envoi du fichier : ", error);
    });
    return docRef.id;
  }
  async updateOTStatut(otId: string, statut: string) {
    const otRef = doc(this.firestore, 'ot_commande', otId);
    const updateData: any = { statut };
    await updateDoc(otRef, updateData);
  }
}
