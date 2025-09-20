import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZzComponent } from './zz.component';

describe('ZzComponent', () => {
  let component: ZzComponent;
  let fixture: ComponentFixture<ZzComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZzComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
