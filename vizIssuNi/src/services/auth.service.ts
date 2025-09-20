import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, user, User, signOut, signInAnonymously, sendPasswordResetEmail } from '@angular/fire/auth';
import { Firestore, collection, getDocs, query, where, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of, firstValueFrom } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import { LoginAttemptLog } from './types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth); // Injectez Auth en utilisant inject
  private firestore: Firestore = inject(Firestore);
  private http: HttpClient = inject(HttpClient);
  constructor() { }
  private getUserIP(): Observable<string | null> {
    return this.http.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
      map(response => response.ip),
      catchError(error => {
        console.warn('Impossible de récupérer l\'adresse IP:', error);
        return of('Pas IP disponible');
      })
    );
  }
  private async logAttempt(
    email: string,
    success: boolean,
    ipAddress: string | null,
    attemptType: 'login' | 'registration',
    error?: any
  ): Promise<void> {
    try {
      const attemptLog: any = {
        email,
        timestamp: serverTimestamp(), // Utilise l'heure du serveur Firestore
        ipAddress,
        success,
        userAgent: navigator.userAgent, // Récupère l'agent utilisateur du navigateur
      };
      if (!success && error) {
        attemptLog.error = {
          code: error.code,
          message: error.message,
        };
      }
      const logCollectionRef = collection(this.firestore, 'loginAttempts'); // Nom de la collection
      await addDoc(logCollectionRef, attemptLog);
      console.log(`${attemptType} attempt for ${email} logged.`);
    } catch (e) {
      console.error(`Error logging ${attemptType} attempt:`, e);
    }
  }

  async register(email: string, password: string, displayName?: string): Promise<User> {
    let ipAddress: string | null = null;
    try {
      ipAddress = await firstValueFrom(this.getUserIP());
    } catch (ipError) { /* L'erreur est déjà loguée dans getUserIP, on continue */ }

    // Vérifier si l'email est autorisé AVANT de tenter de créer l'utilisateur
    const authorized = await this.isAuthorized(email);
    if (!authorized) {
      const authorizationError = {
        code: 'auth/email-not-authorized',
        message: 'Vous n\'êtes pas identifié comme potentiel utilisateur de ce service.',
      };
      console.warn(`Tentative d'inscription non autorisée pour : ${email}`);
      this.logAttempt(email, false, ipAddress, 'registration', authorizationError);
      throw authorizationError; // Lève une erreur pour arrêter le processus
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      this.logAttempt(email, true, ipAddress, 'registration');
      return userCredential.user;
    } catch (error) {
      console.error('Erreur lors de l\'inscription :', error);
      this.logAttempt(email, false, ipAddress, 'registration', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<User> {
    let ipAddress: string | null = null;
    try {
      ipAddress = await firstValueFrom(this.getUserIP());
    } catch (ipError) { /* L'erreur est déjà loguée dans getUserIP, on continue */ }

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      // Log de la connexion réussie
      this.logAttempt(email, true, ipAddress, 'login');
      return userCredential.user;
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      // Log de l'échec de la connexion
      this.logAttempt(email, false, ipAddress, 'login', error);
      throw error;
    }
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    // Pour éviter la divulgation d'e-mails (énumération de comptes), Firebase ne renvoie pas d'erreur
    // si l'utilisateur n'existe pas. Cependant, comme notre application nécessite une autorisation
    // préalable, nous pouvons vérifier si l'e-mail est autorisé pour donner un retour plus clair.
    //console.log(`Tentative de réinitialisation du mot de passe pour l'e-mail : ${email}`);
    // const authorized = await this.isAuthorized(email);
    if (false) {
      console.warn(`Tentative de réinitialisation du mot de passe pour un e-mail non autorisé : ${email}.`);
      // Nous levons une erreur que le composant peut intercepter, pour une expérience utilisateur cohérente.
      throw { code: 'auth/user-not-found', message: 'Aucun utilisateur trouvé avec cette adresse e-mail.' };
    }

    try {
      console.log(`Envoi de l'e-mail de réinitialisation pour l'utilisateur autorisé :`, email);
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error(`Erreur lors de l'envoi de l'e-mail de réinitialisation pour ${email} :`, error);
      throw error; // Propage les autres erreurs (ex: e-mail mal formaté)
    }
  }

  async isAuthorized(email: string): Promise<boolean> {
    const authorizedUsersRef = collection(this.firestore, 'authorizedUsers');
    const q = query(authorizedUsersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }
  async isAdmin(email: string): Promise<boolean> {
    const authorizedUsersRef = collection(this.firestore, 'authorizedUsers');
    const q = query(authorizedUsersRef, where('email', '==', email), where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }
  async addAuthorizedUser(emailToAdd: string, role: 'user' | 'admin'): Promise<void> {
    const currentUser = this.auth.currentUser;
    const isAdmin = await this.isAdmin(currentUser?.email|| '');
    if (!currentUser || !currentUser.email||!isAdmin) {
      throw new Error('Opération non autorisée : administrateur non connecté.');
    }
    const authorizedUsersRef = collection(this.firestore, 'authorizedUsers');
    const newAuthorizedUser = {
      email: emailToAdd,
      role: role,
      createdAt: serverTimestamp(),
      createdBy: currentUser.email // Email de l'admin qui ajoute l'utilisateur
    };

    await addDoc(authorizedUsersRef, newAuthorizedUser);
    console.log(`Utilisateur ${emailToAdd} ajouté à la liste des autorisés avec le rôle ${role} par ${currentUser.email}`);
  }
  getCurrentUser(): Observable<User | null> {
    return user(this.auth);
  }
  isLoggedIn(): Observable<boolean> {
    return new Observable(observer => {
      this.auth.onAuthStateChanged(user => {
        observer.next(!!user);
        observer.complete();
      }, error => {
        observer.error(error);
      });
    });
  }
    // Add anonymous sign in
    signInAnonymously(): Observable<User> {
      return from(signInAnonymously(this.auth)).pipe(
        map(userCredential => userCredential.user)
      );
    }
}
