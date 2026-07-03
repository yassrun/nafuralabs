import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Avatar size types.
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Avatar shape types.
 */
export type AvatarShape = 'circle' | 'square';

/**
 * Avatar Component
 *
 * User/entity avatar with fallback to initials.
 *
 * @stable
 *
 * @example
 * <nf-avatar [src]="user.avatar" [name]="user.name"></nf-avatar>
 * <nf-avatar name="John Doe" size="lg"></nf-avatar>
 */
@Component({
  selector: 'nf-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="avatarClasses()">
      @if (src() && !imageError) {
        <img
          [src]="src()"
          [alt]="name() || 'Avatar'"
          class="nf-avatar__image"
          (error)="onImageError()"
        />
      } @else {
        <span class="nf-avatar__initials">{{ initials() }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .nf-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--nf-color-primary, #1976d2);
      color: white;
      font-weight: 500;
      overflow: hidden;
    }

    // Shapes
    .nf-avatar--circle {
      border-radius: 50%;
    }

    .nf-avatar--square {
      border-radius: 8px;
    }

    // Sizes
    .nf-avatar--xs {
      width: 24px;
      height: 24px;
      font-size: 11px;
    }

    .nf-avatar--sm {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }

    .nf-avatar--md {
      width: 40px;
      height: 40px;
      font-size: 14px;
    }

    .nf-avatar--lg {
      width: 56px;
      height: 56px;
      font-size: 18px;
    }

    .nf-avatar--xl {
      width: 80px;
      height: 80px;
      font-size: 24px;
    }

    // Image
    .nf-avatar__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    // Initials
    .nf-avatar__initials {
      text-transform: uppercase;
      user-select: none;
    }
  `],
})
export class AvatarComponent {
  // Inputs
  src = input<string | undefined>(undefined);
  name = input<string | undefined>(undefined);
  size = input<AvatarSize>('md');
  shape = input<AvatarShape>('circle');

  // State
  imageError = false;

  // Computed classes
  avatarClasses = computed(() => {
    return [
      'nf-avatar',
      `nf-avatar--${this.size()}`,
      `nf-avatar--${this.shape()}`,
    ].join(' ');
  });

  // Computed initials
  initials = computed(() => {
    const nameValue = this.name();
    if (!nameValue) return '?';

    const parts = nameValue.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2);
    }
    return parts[0][0] + parts[parts.length - 1][0];
  });

  onImageError(): void {
    this.imageError = true;
  }
}
