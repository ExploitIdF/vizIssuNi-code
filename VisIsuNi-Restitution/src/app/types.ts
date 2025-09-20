/**
 * Définit la structure d'un point de contrôle.
 * Adaptez les propriétés en fonction de votre modèle de données dans Firestore.
 */
export interface PointControle {
codePC: string;
codeRC: string;
commentaireObligatoire: boolean;
descPC: string;
descRC: string;
niveau: string;
statutC: string;
typeObjet: string;
}
