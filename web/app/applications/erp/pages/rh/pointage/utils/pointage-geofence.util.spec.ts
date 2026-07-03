import { distanceMetres, isWithinGeofence } from './pointage-geofence.util';

describe('pointage-geofence.util', () => {
  it('distanceMetres is ~0 for identical points', () => {
    const p = { lat: 33.5731, lng: -7.5898 };
    expect(distanceMetres(p, p)).toBeLessThan(1);
  });

  it('isWithinGeofence respects radius', () => {
    const site = { lat: 33.5731, lng: -7.5898 };
    const inside = { lat: 33.5732, lng: -7.5898 };
    const far = { lat: 34.02, lng: -6.84 };
    expect(isWithinGeofence(inside, site, 200)).toBe(true);
    expect(isWithinGeofence(far, site, 200)).toBe(false);
  });
});
