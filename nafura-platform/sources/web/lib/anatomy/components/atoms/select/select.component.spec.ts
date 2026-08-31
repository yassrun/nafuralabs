import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOOKUP_LIST_ROUTES } from '../../../tokens/lookup-list-routes.token';
import { LookupReferenceNavigationService } from '../../../services/lookup-reference-navigation.service';

import { NfSelectComponent } from './select.component';

describe('NfSelectComponent (lookup combobox)', () => {
  let fixture: ComponentFixture<NfSelectComponent>;
  let component: NfSelectComponent;
  let openSpy: jasmine.Spy;

  beforeEach(async () => {
    openSpy = jasmine.createSpy('openListingInNewTab');
    await TestBed.configureTestingModule({
      imports: [NfSelectComponent],
      providers: [
        {
          provide: LOOKUP_LIST_ROUTES,
          useValue: { fournisseurs: '/achats/fournisseurs' },
        },
        {
          provide: LookupReferenceNavigationService,
          useValue: {
            canOpen: (route?: string) => !!route?.trim(),
            openListingInNewTab: openSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NfSelectComponent);
    component = fixture.componentInstance;
  });

  it('AC-1 uses combobox mode when lookupKey is set', () => {
    component.lookupKey = 'fournisseurs';
    fixture.detectChanges();
    expect(component.isCombobox()).toBeTrue();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role="combobox"]')).not.toBeNull();
    expect(root.querySelector('select')).toBeNull();
  });

  it('AC-1 stays native select without lookupKey', () => {
    component.options = [{ value: 'a', label: 'Alpha' }];
    fixture.detectChanges();
    expect(component.isCombobox()).toBeFalse();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('select')).not.toBeNull();
    expect(root.querySelector('[role="combobox"]')).toBeNull();
  });

  it('AC-2 does not search before 2 characters', async () => {
    const search = jasmine.createSpy('lookupSearch').and.resolveTo([]);
    component.lookupKey = 'fournisseurs';
    component.lookupSearch = search;
    fixture.detectChanges();

    component.comboQuery.set('a');
    await component['refreshComboHits'](true);

    expect(search).not.toHaveBeenCalled();
    expect(component.comboHits()).toEqual([]);
  });

  it('AC-3 debounces server search', () => {
    jasmine.clock().install();
    const search = jasmine.createSpy('lookupSearch').and.resolveTo([]);
    component.lookupKey = 'fournisseurs';
    component.lookupSearch = search;
    fixture.detectChanges();

    component.onComboInput({ target: { value: 'at' } } as unknown as Event);
    expect(search).not.toHaveBeenCalled();

    jasmine.clock().tick(300);
    expect(search).toHaveBeenCalledWith('at');
    jasmine.clock().uninstall();
  });

  it('AC-5 Escape closes without changing value', () => {
    component.lookupKey = 'fournisseurs';
    component.writeValue('keep-me');
    component.comboOpen.set(true);
    component.comboEditing.set(true);
    component.comboQuery.set('at');
    fixture.detectChanges();

    component.onComboKeydown({ key: 'Escape', preventDefault: () => {} } as KeyboardEvent);

    expect(component.value()).toBe('keep-me');
    expect(component.comboOpen()).toBeFalse();
    expect(component.comboEditing()).toBeFalse();
  });

  it('AC-6 eye opens fiche when value is set', () => {
    component.lookupKey = 'fournisseurs';
    component.writeValue('partner-42');
    fixture.detectChanges();

    const btn = (fixture.nativeElement as HTMLElement).querySelector('.nf-select-list');
    expect(btn).not.toBeNull();
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(openSpy).toHaveBeenCalledWith('/achats/fournisseurs/partner-42');
  });

  it('AC-7 eye opens listing when empty', () => {
    component.lookupKey = 'fournisseurs';
    fixture.detectChanges();

    const btn = (fixture.nativeElement as HTMLElement).querySelector('.nf-select-list');
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(openSpy).toHaveBeenCalledWith('/achats/fournisseurs');
  });

  it('AC-8 hides eye when lookupKey has no list route', () => {
    component.lookupKey = 'unknownKey';
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.nf-select-list')).toBeNull();
  });

  it('keeps the hit label after pick for non-UUID ids', () => {
    component.lookupKey = 'employes';
    fixture.detectChanges();

    component.pickCombo({ value: 'qa-emp-chef', label: 'QA Chef · QA-CHEF' });

    expect(component.value()).toBe('qa-emp-chef');
    expect(component.comboInputValue()).toBe('QA Chef · QA-CHEF');
  });

  it('commits the exact typed id on blur', () => {
    component.lookupKey = 'employes';
    component.comboEditing.set(true);
    component.comboQuery.set('qa-emp-chef');
    component.comboHits.set([{ value: 'qa-emp-chef', label: 'QA Chef · QA-CHEF' }]);
    fixture.detectChanges();

    component.onComboBlur();

    expect(component.value()).toBe('qa-emp-chef');
    expect(component.comboInputValue()).toBe('QA Chef · QA-CHEF');
  });

  it('AC-10 sets error on search failure without clearing value', async () => {
    component.lookupKey = 'fournisseurs';
    component.lookupSearch = () => Promise.reject(new Error('network'));
    component.writeValue('still-here');
    fixture.detectChanges();

    component.comboQuery.set('atlas');
    await component['refreshComboHits'](true);

    expect(component.comboError()).toContain('Impossible');
    expect(component.value()).toBe('still-here');
  });
});
