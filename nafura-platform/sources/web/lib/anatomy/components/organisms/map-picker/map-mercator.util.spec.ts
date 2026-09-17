import { lngToTileX, latToTileY, tileXToLng, tileYToLat, wrapTileX } from './map-mercator.util';

describe('map-mercator', () => {
  it('round-trips Casablanca coordinates at zoom 12', () => {
    const lat = 33.5731;
    const lng = -7.5898;
    const z = 12;
    expect(tileXToLng(lngToTileX(lng, z), z)).toBeCloseTo(lng, 5);
    expect(tileYToLat(latToTileY(lat, z), z)).toBeCloseTo(lat, 5);
  });

  it('wraps tile X around the date line', () => {
    expect(wrapTileX(-1, 3)).toBe(7);
    expect(wrapTileX(8, 3)).toBe(0);
  });
});
