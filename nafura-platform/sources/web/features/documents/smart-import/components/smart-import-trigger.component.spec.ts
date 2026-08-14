import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ToastService } from '@lib/anatomy';
import { SmartImportOrchestratorService } from '../services/smart-import-orchestrator.service';
import { SmartImportTriggerComponent } from './smart-import-trigger.component';

describe('SmartImportTriggerComponent', () => {
  let fixture: ComponentFixture<SmartImportTriggerComponent>;
  let component: SmartImportTriggerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartImportTriggerComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: SmartImportOrchestratorService,
          useValue: { describe: jasmine.createSpy('describe'), prepare: jasmine.createSpy('prepare') },
        },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
        {
          provide: ToastService,
          useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartImportTriggerComponent);
    component = fixture.componentInstance;
    component.definition = {
      key: 'fournisseur',
      name: 'Fournisseurs',
      dataSchema: { type: 'object', properties: {} },
      presentationSchema: { sections: [] },
      arrayPath: 'fournisseurs',
    };
    fixture.detectChanges();
  });

  it('exposes definition.key as entitykey for wired-screen e2e', () => {
    expect(fixture.nativeElement.getAttribute('entitykey')).toBe('fournisseur');
  });

  it('shows the sparkles trigger while idle', () => {
    expect(component.phaseLabel()).toBe('platform.smartImport.button');
    expect(component.isBusy()).toBeFalse();
    expect(fixture.nativeElement.querySelector('nf-button')).not.toBeNull();
  });

  it('uses the native loading state during extraction', () => {
    component.phase.set('EXTRACTING');
    fixture.detectChanges();
    expect(component.isBusy()).toBeTrue();
    expect(component.phaseLabel()).toBe('platform.smartImport.phase.extracting');
    component.phase.set('REVIEWING');
    expect(component.isBusy()).toBeFalse();
  });
});

