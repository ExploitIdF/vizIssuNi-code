import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, updateDoc, doc, collection, getDocs, query, where, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { ref, uploadString, Storage ,getDownloadURL} from '@angular/fire/storage';
import { Observable, from, map, catchError, of, shareReplay, tap, ReplaySubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PointControle,Fermeture,OTFils,RapportIntervention,PointReponse } from '../models/intervention.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private auth: Auth = inject(Auth); // Injectez Auth en utilisant inject
  private firestore: Firestore = inject(Firestore);
  private http: HttpClient = inject(HttpClient);
  private storage: Storage = inject(Storage);
  private pointsControleCollectionName = environment.firestoreCollections.pointsControle;
  private otPereCollectionName = environment.firestoreCollections.otPere;
  private otFilsCollectionName = environment.firestoreCollections.otFils;
  private fermeturesCollectionName = environment.firestoreCollections.fermetures;
  private rapportsIntCollectionName= environment.firestoreCollections.rapportsInterventions;

  private _pointsControle$?: Observable<PointControle[]>;
  get pointsControle$(): Observable<PointControle[]> {
    if (!this._pointsControle$) {
      const pointsControleCollection = collection(this.firestore, this.pointsControleCollectionName);
      this._pointsControle$ = from(getDocs(pointsControleCollection)).pipe(
        map(snapshot => snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            commentaireObligatoire: data['commentaireObligatoire'] === 'True' || data['commentaireObligatoire'] === true
          } as PointControle;
        })),
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
      console.log('Env:',environment.firestoreCollections)
      const fermeturesCollection = collection(this.firestore, this.fermeturesCollectionName);
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


  private async loadCsv(fileName: string): Promise<Map<string, string>> {
    try {
      const fileRef = ref(this.storage, fileName);
      const downloadUrl = await getDownloadURL(fileRef);
      console.log('loadCsv - Fetching CSV from:', downloadUrl);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      const csvData = await response.text();
      const newMap = new Map<string, string>();
      const lines = csvData.trim().split('\n');
      // Omit the header row by starting from the second line (index 1)
      lines.slice(1).forEach(line => {
        const [key, value] = line.split(',').map(x => x?.trim());
        if (key && value) {
          newMap.set(key, value);
        }
      });
      return newMap;
    } catch (error) {
      console.error('Error fetching CSV:', error);
      throw new Error('Failed to load CSV. Check Firebase Storage rules or network.');
    }
  }
  private _fermetureCodeLibelleSubject = new ReplaySubject<any[]>(1);
  public fermetureCodeLibelle$ = this._fermetureCodeLibelleSubject.asObservable();
  private fermetureCodeMap: Map<string, string> | null = null;
  async fermetureCode2Libelle(input: string): Promise<string> {
    if (!this.fermetureCodeMap) {
      this.fermetureCodeMap = await this.loadCsv('reference/fermeture_code_libellé.csv');
    }
    const result = this.fermetureCodeMap?.get(input);
    return result || 'PasTrouvé';
  }

  constructor() {
    this.loadCsv('reference/fermeture_code_libellé.csv').then(map => {
      const data = Array.from(map, ([code, libelle]) => ({ code, libelle }));
      this._fermetureCodeLibelleSubject.next(data);
      console.log('Fermeture codes and labels loaded:', data);
    }).catch(error => {
      console.error('Error loading fermeture codes and labels:', error);
      this._fermetureCodeLibelleSubject.next([]); // emit empty array on error
    })
  }

  async actionLog(    action: string  ): Promise<void> {
    try {
      const anyLog: any = {
        email:this.auth.currentUser?.email||'',
        timestamp: serverTimestamp(),
        action     ,
        colection:this.otFilsCollectionName
      };
      const logCollectionRef = collection(this.firestore, 'actionLog'); // Nom de la collection
      await addDoc(logCollectionRef, anyLog);
      console.log(`${action} logged.`);
    } catch (e) {
      console.error(`Error logging ${action} attempt:`, e);
      throw e;
    }
  }
  getOtPeresByFermetureId(fermetureId: string): Observable<any[]> {
    const otPereCollection = collection(this.firestore, this.otPereCollectionName);
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
    const otFilsCollection = collection(this.firestore, this.otFilsCollectionName);
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
    const reponseCollection = collection(this.firestore, this.rapportsIntCollectionName);
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
    collection(this.firestore, this.otPereCollectionName),
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
      collection(this.firestore, this.otFilsCollectionName),
      where('fermetureId', '==', fermetureId),
      where('datePrevisionnelle','==',datePrevisionnelle) // Assuming datePrevisionnelle is a string in the format 'YYYY-MM-DD')
    );
    try {
    const querySnapshot = await getDocs(q);
    console.log('FirebaseService: - Number of docs:', querySnapshot.docs.length);
    const res=[...new Set(querySnapshot.docs.map(doc => doc.data() as OTFils))];
    if (res.length > 1) {
      console.log('getOTDisponibles - 2 premiers résultats:', res.slice(0, 2));
    } else {
      console.log('getOTDisponibles- Un seul résultat:', res[0]);
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
      collection(this.firestore,this.otFilsCollectionName),
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

  async saveString(cha: string): Promise<string> {
    console.log(this.storage.app.options.storageBucket);
    const chaString = cha.replace(/"/g, '""'); // Échappe les guillemets doubles
    const storageRef = ref(this.storage, 'stock-responses/' + new Date().toISOString() + '.csv');
    try {
      await uploadString(storageRef, chaString);
      console.log('Fichier CSV envoyé avec succès !');
    } catch (error) {
      console.error("Erreur lors de l'envoi du fichier : ", error);
      throw error; // Re-throw the error to be handled by the caller
    }
    return storageRef.fullPath; // Retourne le chemin du fichier stocké
  }

  genererDate() {
    const date=new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const H = date.getHours().toString().padStart(2, '0');
    const M = date.getMinutes().toString().padStart(2, '0');
    const S = date.getSeconds().toString().padStart(2, '0');
    return `${y}-${m}-${d}-${H}-${M}-${S}`;
}

  // Rapports
  async saveRapport(rapport: RapportIntervention): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, this.rapportsIntCollectionName), rapport);
    const responses = rapport.reponses;
    const nmOt=rapport.codeOT;
    const intervenantNom=rapport.intervenantNom;
    const nomFichier = 'stock-responses/'+ nmOt+'_'+intervenantNom+'_'+this.genererDate()+'.csv';
    console.log(nomFichier) ;

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
    const storageRef = ref(this.storage,nomFichier);
    try {
      await uploadString(storageRef, csvString);
      console.log('Fichier CSV envoyé avec succès !');
    } catch (error) {
      console.error("Erreur lors de l'envoi du fichier : ", error);
      // Consider how to handle this error, as the Firestore doc is already created.
    }
    return docRef.id;
  }
  async updateOTStatut(otId: string, statutF: string) {
    const otRef = doc(this.firestore,this.otFilsCollectionName, otId);
    const updateData: any = {'statutF': statutF };
    console.log(`Avant : Statut de l'OT ${otId} mis à jour à ${statutF}`);
    await updateDoc(otRef, updateData);
    console.log(`Apres ,Statut de l'OT ${otId} mis à jour à ${statutF}`);

  }
}
