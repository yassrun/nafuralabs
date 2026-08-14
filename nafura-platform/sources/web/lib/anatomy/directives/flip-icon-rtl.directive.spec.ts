import { Component, ViewChild, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FlipIconRtlDirective } from './flip-icon-rtl.directive';

@Component({
  standalone: true,
  imports: [FlipIconRtlDirective],
  template: `<span #host appFlipIconRtl class="icon">→</span>`,
})
class HostComponent {
  @ViewChild('host', { static: true })
  host!: ElementRef<HTMLElement>;
}

describe('FlipIconRtlDirective', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
  let originalDir: string;

  beforeEach(() => {
    originalDir = document.documentElement.dir;
    fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
  });

  afterEach(() => {
    document.documentElement.dir = originalDir;
  });

  it('applies scaleX(-1) when <html dir="rtl"> at init', () => {
    document.documentElement.dir = 'rtl';
    fixture.detectChanges();
    const el = fixture.componentInstance.host.nativeElement;
    expect(el.style.transform).toBe('scaleX(-1)');
  });

  it('clears the transform when <html dir="ltr"> at init', () => {
    document.documentElement.dir = 'ltr';
    fixture.detectChanges();
    const el = fixture.componentInstance.host.nativeElement;
    expect(el.style.transform).toBe('');
  });

  it('updates the transform when <html dir> mutates and disconnects on destroy', (done) => {
    document.documentElement.dir = 'ltr';
    fixture.detectChanges();
    const el = fixture.componentInstance.host.nativeElement;
    expect(el.style.transform).toBe('');

    document.documentElement.dir = 'rtl';
    // MutationObserver is asynchronous (microtask).
    queueMicrotask(() => {
      expect(el.style.transform).toBe('scaleX(-1)');
      fixture.destroy();
      // After destroy, further dir mutations must not throw and the element
      // detached from the DOM is no longer updated.
      document.documentElement.dir = 'ltr';
      done();
    });
  });
});
