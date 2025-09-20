import { Component, OnInit, inject, model, signal } from '@angular/core';
import { CommonModule ,registerLocaleData } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import localeFr from '@angular/common/locales/fr';
import {  MatDialogModule,  MAT_DIALOG_DATA,  MatDialog,  MatDialogActions,  MatDialogClose,
  MatDialogContent,  MatDialogRef,  MatDialogTitle,} from '@angular/material/dialog';
import { CompDetailAComponent } from '../comp-detail-a/comp-detail-a.component';
registerLocaleData(localeFr);
import { StoreService } from '../../../services/store.service';
import { AuthService } from '../../../services/auth.service';

export interface DialogData {
  otPereId: string;
  name: string;
}

interface OTPereV {
  otPereId: string;
  secteur: string;
  fermeture: string;
  datePrevisionnelle: Date;
  niveau: string;
}
@Component({
  selector: 'app-calendrier',
  templateUrl: './calendrier.component.html',
  styleUrl: './calendrier.component.scss',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule],
})
export class CalendrierComponent implements OnInit {
  readonly otPereId = signal('');
  readonly name =  signal('');
  readonly dialog = inject(MatDialog);
  otperes:any[]=[];  
  otperevs:OTPereV[]=[];
  fermetures: string[] = [];
  months: { key: string, label: string, start: Date, end: Date }[] = [];
  displayedColumns: string[] = [];

  constructor(private storeService: StoreService, private authService: AuthService) {  }

  ngOnInit() {
    this.storeService.getOTPeres().pipe(take(1)).subscribe({
      next: data => {
        this.otperes = data;
        console.log('OT Pères:', this.otperes);    
        const otvs:OTPereV[]=[];
        this.otperes.forEach(ot => {
          const otPereId=ot["id"];
          const dateP=new Date( ot["datePrevisionnelle"]);
          let niv="M";
          if (ot["niveau"]=="Bimestrielle de jour") {niv="J"}
          if (ot["niveau"]=="Bimestrielle de nuit") {niv="N"}

          const otv={ "otPereId":otPereId, "secteur":"", "fermeture":ot["fermetureId"],"datePrevisionnelle":dateP,"niveau":niv};
          otvs.push(otv)
        })
        this.otperevs=otvs as OTPereV[];
        console.log('OT PèreVs:', this.otperevs); 
        this.fermetures = Array.from(new Set(this.otperevs.map(r => r.fermeture as string))).sort();
        const today = new Date();
        for (let i = -1; i <= 6; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          this.months.push({
            key: 'm' + i,
            label: format(d, 'MMM yyyy', { locale: fr }),
            start, end
          });
        }
        this.displayedColumns = ['fermeture', ...this.months.map(m => m.key)]; 
        console.log('months',this.months)       
      }
    });   
  }
  getOT(fermeture: string, start: Date, end: Date): OTPereV[] {
    return this.otperevs.filter(r =>
      r.fermeture === fermeture &&
      r.datePrevisionnelle >= start &&
      r.datePrevisionnelle <= end
    );
  }
  niveauColor(niveau: string): string {    return 'niveau-' + niveau;  };

  openOtPereDialog(ot: OTPereV): void {
    this.dialog.open(CalendrierDialog, {
      width: '80%',
      data: { otPereId: ot.otPereId,datePrevisionnelle: ot.datePrevisionnelle ,
        fermeture: ot.fermeture, secteur: ot.secteur, niveau: ot.niveau }, 
    });
  }

  openDialog(ot: OTPereV): void {
    const dialogRef = this.dialog.open(CalendrierDialog, { 
      width: '80%',
      data: { otPereId: ot.otPereId,datePrevisionnelle: ot.datePrevisionnelle ,
        fermeture: ot.fermeture, secteur: ot.secteur, niveau: ot.niveau }, 
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result !== undefined) {
        this.otPereId.set(result.ot);
      }
    });
  }

}

@Component({
  selector: 'calendrier-dialog',
  templateUrl: 'calendrier-dialog.html',
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatDialogTitle,
    MatDialogContent, 
    MatDialogActions, 
    MatDialogClose 
  ],
})
export class CalendrierDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<CalendrierDialog>);
  readonly data = inject<OTPereV>(MAT_DIALOG_DATA);
  defMajeur!: any[];
  storeService = inject(StoreService);

  ngOnInit(): void {
    this.storeService.getDefMajeur(this.data.otPereId).pipe(take(1)).subscribe({
      next: data => { 
        const selData:any[]=[];
        data.forEach((d:any) => {
          selData.push({"codeEx":d["codeEx"],"descPC":d["descPC"],
            "descRC":d[ "descRC"],"commentaire":d["commentaire"]}); 
          });
        this.defMajeur = selData.sort((a, b) => a.codeEx.localeCompare(b.codeEx));
        console.log('Def Majeur:', this.defMajeur);
      },
      error: err => { console.error('Error fetching Def Majeur:', err); }
    }); // <-- The missing parenthesis was added here
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
