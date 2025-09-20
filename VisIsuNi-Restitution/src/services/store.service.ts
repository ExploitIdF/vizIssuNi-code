import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection,getDoc, getDocs,setDoc, query, where, addDoc, serverTimestamp,limit, writeBatch, doc, orderBy } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of, shareReplay, tap, firstValueFrom } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PointControle } from '../app/types';
import { environment } from '../environments/environment';
import { Storage, getDownloadURL, ref } from '@angular/fire/storage';

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
  private chargementOtCollectionName      = environment.firestoreCollections.chargementOt;


  
  private async loadCsv(fileName: string): Promise<Map<string, string>> {
    try {
      const fileRef = ref(this.storage, fileName);
      const downloadUrl = await getDownloadURL(fileRef);
      console.log('Fetching CSV from:', downloadUrl);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      const csvData = await response.text();
      const newMap = new Map<string, string>();
      csvData.split('\n').forEach(line => {
        const [key, value] = line.split(',').map(x => x?.trim());
        if (key && value) {
          newMap.set(key, value);
        }
      });
      console.log('CSV loaded successfully');
      return newMap;
    } catch (error) {
      console.error('Error fetching CSV:', error);
      throw new Error('Failed to load CSV. Check Firebase Storage rules or network.');
    }
  }
  private fermetureMap: Map<string, string> | null = null;
  async gamme2Fermeture(input: string): Promise<string> {
    if (!this.fermetureMap) { 
      this.fermetureMap = await this.loadCsv('reference/gamme_fermeture.csv');
    }
    const result = this.fermetureMap?.get(input);
    return result || 'PasTrouvé';
  }
  private tatouageMap: Map<string, string> | null = null;
  async tatouage2codeEx(input: string): Promise<string> {
    if (!this.tatouageMap) {
      this.tatouageMap = await this.loadCsv('reference/tatouage2codeEx.csv');
    }
    const result = this.tatouageMap.get(input);
    return result || 'PasTrouvé';
  }

  private fermetureCodeMap: Map<string, string> | null = null;
  async fermetureCode2Libelle(input: string): Promise<string> {
    if (!this.fermetureCodeMap) {
      this.fermetureCodeMap = await this.loadCsv('reference/fermeture_code_libellé.csv');
    }
    const result = this.fermetureCodeMap.get(input);
    return result || 'PasTrouvé';
  }
  readonly pointsControle$: Observable<PointControle[]>;
  readonly fermetures$: Observable<any[]>;
  constructor() {    
    const pointsControleCollection = query(collection(this.firestore, this.pointsControleCollectionName), orderBy('codeRC'));
    this.pointsControle$ = from(getDocs(pointsControleCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => (doc.data()  as PointControle))),
      tap(points => console.log('Points de contrôle chargés:', points)),
      shareReplay({ bufferSize: 1, refCount: false }), 
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des points de contrôle:', error);
        return of([]);
      })
    );
    const fermetureCollection = query(collection(this.firestore, this.fermeturesCollectionName), orderBy('nom'));
    this.fermetures$ = from(getDocs(fermetureCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => (doc.data() ))),
      tap(points => console.log('Fermetures chargées:', points)),
      shareReplay({ bufferSize: 1, refCount: false }), 
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des points de contrôle:', error);
        return of([]);
      })
    );
   }
// Est-ce que cette méthode est encore utilisée quelque part ?
  getFermetures(): Observable<any[]> {
      const fermeturesCollection = collection(this.firestore, this.fermeturesCollectionName);
      return from(getDocs(fermeturesCollection)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur lors de la récupération des fermetures:', error);
          return of([]);
        })
      );
  }
  private async actionLog(    email: string,    action: string  ): Promise<void> {
    try {
      const anyLog: any = {
        email,
        timestamp: serverTimestamp(),
        action     
      };
      const logCollectionRef = collection(this.firestore, 'actionLog'); // Nom de la collection
      await addDoc(logCollectionRef, anyLog);
      console.log(`${action} logged.`);
    } catch (e) {
      console.error(`Error logging ${action} attempt:`, e);
      throw e;
    }
  }
  getOTPeres(): Observable<any[]> {
    const otPereCollection = collection(this.firestore, this.otPereCollectionName);
    return from(getDocs(otPereCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => (doc.data() ))),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des OT pères:', error);
        return of([]);
      })
    );
  }

  getOtPeresByFermetureId(fermetureId: string): Observable<any[]> {
    const otPereCollection = collection(this.firestore, this.otPereCollectionName);
    const q = query(otPereCollection, where('fermetureId', '==', fermetureId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => (doc.data() ))),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des OT pères:', error);
        return of([]);
      })
    );
  }
  getOtFilsByOtPereId(otPereId: string): Observable<any[]> {
    try {
      const action =this.otFilsCollectionName+'$'+otPereId+'$_restitution';
      this.actionLog(this.auth.currentUser?.email||'',  action);
    } catch (e) {
      console.error(`Error logging attempt:`, e);
    }
    const otFilsCollection = collection(this.firestore, this.otFilsCollectionName);
    const q = query(otFilsCollection, where('otPereId', '==', otPereId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => (doc.data()))),
     tap(points => console.log('otFils chargés:', points)),
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
      map(snapshot => snapshot.docs.map(doc => {
        const data = doc.data();
        for (const key of Object.keys(data)) {
          if (data[key] && typeof data[key].toDate === 'function') {
            data[key] = data[key].toDate().toISOString();
          }
        }
        return { id: doc.id, ...data };
      })),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors de la récupération des réponses :', error);
        return of([]);
      })
    );
  }
  async addPrestation(selectedFermeture: string, selectedPrevision: string, selectedNiv: string): Promise<void> {
    const presta = {
      fermetureId: selectedFermeture,
      datePrev: selectedPrevision,
      niveau: selectedNiv,
      createdAt: new Date(),
      etat: 'programmé',
      user: this.auth.currentUser?.email
    };
    const docRef = await addDoc(collection(this.firestore, 'add_presta'), presta);
    console.log("Nouvelle prestation ajoutée avec ID :", presta);
  }

  async updatePointsControleConfig(newData: any[]): Promise<void> {
    console.log('Updating Points Controle, data  :', newData);
    const collectionRef = collection(this.firestore, this.pointsControleCollectionName);
    const batch = writeBatch(this.firestore);
    const querySnapshot = await getDocs(collectionRef);
    querySnapshot.forEach(document => {      batch.delete(document.ref);    });
    newData.forEach(item => {
    const processedItem = { ...item };
    if (typeof processedItem.commentaireObligatoire === 'string') {
      processedItem.commentaireObligatoire = processedItem.commentaireObligatoire.toLowerCase() === 'true';
    }
      const docRef = doc(collectionRef,item.codeRC) ; 
      batch.set(docRef, processedItem);
    });
    await batch.commit();
  }    
  async chargeOtPere(newData: any[]): Promise<void> {
    const collectionRef = collection(this.firestore, this.otPereCollectionName );
    const batch = writeBatch(this.firestore as Firestore);
    const promises = newData.map(async (item) => {
    if (item.id) {
      const docRef = doc(collectionRef, item.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
      } else {
        batch.set(docRef, item, { merge: false });
      }
    }
    });
    await Promise.all(promises);
    await batch.commit();
  }
  async chargeOtFils(newData: any[]): Promise<void> {
    const collectionRef = collection(this.firestore, this.otFilsCollectionName );
    const batch = writeBatch(this.firestore as Firestore);
    const promises = newData.map(async (item) => {
    if (item.id) {
      const docRef = doc(collectionRef, item.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
      } else {
        batch.set(docRef, item, { merge: false });
      }
    }
    });
    await Promise.all(promises);
    await batch.commit();
  }

  getDefMajeur(numInput: string): Observable<any[]> {
    const body = { Num: numInput };
    const cloudFunctionUrl = "https://us-central1-batiment-dirif.cloudfunctions.net/getMajeur";
    
    // Directly return the observable from the HTTP call
    return this.http.post<any[]>(cloudFunctionUrl, body).pipe(
      // Use the catchError operator to handle errors
      catchError(err => {
        console.error("Erreur lors de la récupération des données", err);
        // Return an empty array wrapped in an observable to prevent the app from breaking
        return of([]);
      })
    );
  }



}
