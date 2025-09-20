
// src/models/intervention.model.ts

export interface ChoixEffectues {
  fermeture?: string;
  datePrevisionnelle?: string;
  etat?: 'Tous' | 'Commandé' |  'Terminé';
  typeObjet?: string;
  objetSelectionne?: ObjetIN;
  selectedNiveau ?: string;
}

export interface PointControle {
  codePC: string;
  descPC: string;
  codeRC: string;
  descRC: string;
  commentaireObligatoire: boolean;
  typeObjet: string;
  niveau: string;
  statutC:string; // 'videC' | 'pleinC'
}


export interface ObjetIN {
  codeObjet: string;
  codeEx: string;
  statutO: 'A faire' |  'Terminé';
}

export interface Fermeture {
  id: string;
  nom: string;
  issues: string[];
  niches: string[];
}

export interface OTPere {
  id: string;
  fermetureId: string;
  datePrevisionnelle: string;
  statutP: 'Commandé' |  'Terminé';
}
export interface OTFils {
  id: string;
  otPereId: string;
  fermetureId:string;
  codeObjet: string;
  codeEx:string;
  typeObjet: 'issue'| 'niche';
  datePrevisionnelle: string;
  niveau:string;
  typeVisite: 'jour' | 'nuit';
  statutF: 'A faire' |  'Terminé';
}


export interface Intervenant {
  id: string;
  nom: string;
  email: string;
  actif: boolean;
}
export interface PointReponse {
  codePC: string;
  codeRC: string;
  commentaire: string;
  horodate: string;
}
export interface RapportIntervention {
  id?: string;
  codeOT: string;
  intervenantNom: string;
  codeObjet: string;
  niveau: string;
  reponses: PointReponse[];
  dateCreation: string;
  statutR: 'brouillon' | 'valide';
}
