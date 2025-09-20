import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule ,ReactiveFormsModule} from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { StoreService } from '../../../services/store.service';
import { AuthService } from '../../../services/auth.service';
import { Observable, take } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-comp-detail-f',
  imports: [CommonModule, FormsModule, MatTableModule, MatProgressSpinnerModule, MatFormFieldModule, 
    MatCardModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule ,
    MatButtonModule, MatInputModule     ],
  standalone: true,
  templateUrl: './comp-detail-f.component.html',
  styleUrls: ['./comp-detail-f.component.scss']
})
export class CompDetailFComponent implements OnInit {
    fermetures$: Observable<any[]>;
    selectedFermeture!:any;
    datesCouleurs: { date: string, color: string,id: string, niveau: string }[] = [];
    prestationForm!: FormGroup;
    niveaux: string[] = ['Maintenance annuelle', 'Bimestrielle de nuit', 'Bimestrielle de  jour'];
    minDate: Date;
    maxDate: Date;
    isSubmitting = false;   

    constructor(
        private storeService: StoreService, 
        private authService: AuthService,
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private router: Router  
    ) {
        this.fermetures$ = this.storeService.getFermetures();
        console.log('Fermetures$:', this.fermetures$);
        this.minDate = new Date();
        this.maxDate = new Date();
        this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
    }
    ngOnInit(): void {
        this.prestationForm = this.fb.group({
        selectedFermeture: ['', Validators.required],
        selectedPrevision: ['', Validators.required],
        selectedNiv: ['', Validators.required]
        });
        this.fermetures$ = this.storeService.getFermetures();
    }
    onFermetureChange(fermeture: any): void { 
        console.log('Fermeture sélectionnée:', fermeture);
    }

    async onSubmit(): Promise<void> {
        if (this.prestationForm.invalid) {
        return;
        }
        this.isSubmitting = true;
        const { selectedFermeture, selectedPrevision, selectedNiv } = this.prestationForm.value;  
        const selectedPrevisionStr =selectedPrevision.toISOString().split('T')[0];    
        try {
            await this.storeService.addPrestation(selectedFermeture, selectedPrevisionStr , selectedNiv);
        }
        catch (error: any) {
        console.error('Erreur lors de l\'ajout de la prestation:', error);
        }   
        this.isSubmitting = false;
        this.selectedFermeture = null;
        this.prestationForm.reset();
            this.snackBar.open('Prestation ajoutée avec succès', 'Fermer', 
                {  duration: 15000 ,verticalPosition : 'top' } )


    }
}

