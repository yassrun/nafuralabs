# Address Components - Sandbox Demo

## 🚀 Quick Start

To view the interactive sandbox demo of the address components:

### Option 1: Add to Angular Routes

Add the sandbox component to your app routes:

```typescript
// In your routes file (e.g., app.routes.ts)
import { NfAddressSandboxComponent } from '@lib/anatomy/components/molecules/address';

export const routes: Routes = [
  // ... your other routes
  {
    path: 'sandbox/address',
    component: NfAddressSandboxComponent,
  },
];
```

Then navigate to `/sandbox/address` in your browser.

### Option 2: Standalone Usage

Create a temporary component or page that imports the sandbox:

```typescript
import { Component } from '@angular/core';
import { NfAddressSandboxComponent } from '@lib/anatomy/components/molecules/address';

@Component({
  selector: 'app-demo-page',
  standalone: true,
  imports: [NfAddressSandboxComponent],
  template: '<nf-address-sandbox></nf-address-sandbox>',
})
export class DemoPageComponent {}
```

## 📦 What's Included

The sandbox demonstrates:

- **Address Form - Full Mode**: Complete form with all fields
- **Address Form - Compact Mode**: Simplified form for quick data entry
- **Address View (Read-only)**: Display formatted addresses
- **Dynamic Controls**: Toggle modes, enable/disable, show/hide notes
- **Real-time Validation**: See validation states and error messages
- **Sample Data**: Prefill with realistic address data
- **JSON Output**: View the emitted data structure

## 🎯 Features Demonstrated

✓ Full and compact display modes  
✓ Configurable required fields  
✓ Real-time validation with error messages  
✓ Debounced value emission (200ms)  
✓ Design token-based styling  
✓ i18n-ready with translation keys  
✓ WCAG accessible (ARIA labels, keyboard navigation)  
✓ Reactive forms integration  
✓ Domain-agnostic and reusable  

## 📝 Usage Examples

All usage examples are available in the sandbox UI. The component shows how to:

1. Embed address forms in domain forms (Supplier, Customer, etc.)
2. Configure validation rules
3. Handle value changes and validity states
4. Display read-only address data
5. Switch between different display modes

## 🔧 Component Architecture

```
address/
├── address.model.ts              # Type definitions
├── address-form.component.*      # Editable form component
├── address-view.component.*      # Read-only view component
├── address-sandbox.component.*   # Interactive demo
└── index.ts                      # Barrel exports
```

## 🧪 Running Tests

```bash
npm test -- --include='**/*address*.spec.ts'
```

## 📚 Documentation

For complete API documentation, see the inline JSDoc comments in:
- `address-form.component.ts`
- `address-view.component.ts`
- `address.model.ts`
