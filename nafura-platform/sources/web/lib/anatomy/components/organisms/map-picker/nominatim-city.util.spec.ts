import { cityFromNominatim, locationFromNominatim } from './nominatim-city.util';

describe('nominatim-city', () => {
  it('canonicalizes a Moroccan city from Nominatim', () => {
    expect(cityFromNominatim({ city: 'rabat' })).toBe('Rabat');
    expect(cityFromNominatim({ town: 'casablanca' })).toBe('Casablanca');
  });

  it('falls back to the first populated locality', () => {
    expect(cityFromNominatim({ village: 'Aïn Atiq' })).toBe('Aïn Atiq');
  });

  it('maps a search hit to lat/lng/address/city', () => {
    const loc = locationFromNominatim({
      lat: '34.0209',
      lon: '-6.8416',
      display_name: 'Avenue Mohammed V, Rabat, Maroc',
      address: { road: 'Avenue Mohammed V', city: 'Rabat', house_number: '12' },
    });
    expect(loc).toEqual({
      lat: 34.0209,
      lng: -6.8416,
      address: '12 Avenue Mohammed V',
      city: 'Rabat',
    });
  });
});
