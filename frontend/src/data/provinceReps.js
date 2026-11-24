// Province Representatives pages — Northern & Eastern.
// District keys match leadership.district / LEAD_DISTRICTS in the backend;
// `map` is the district's name attribute inside public/images/lk-districts.svg
// (Sinhala romanisations used by the Simplemaps base map).
// hero: authentic local photography already in the project.

export const PROVINCE_REPS = {
  northern: {
    hero: '/images/roadmap/library-jaffna.jpg',
    districts: [
      { key: 'jaffna',      map: 'Yapanaya' },
      { key: 'kilinochchi', map: 'Kilinochchi' },
      { key: 'mannar',      map: 'Mannarama' },
      { key: 'mullaitivu',  map: 'Mulativ' },
      { key: 'vavuniya',    map: 'Vavniyawa' },
    ],
  },
  eastern: {
    hero: '/images/roadmap/harbour-trincomalee.jpg',
    districts: [
      { key: 'trincomalee', map: 'Tricunamalaya' },
      { key: 'batticaloa',  map: 'Madakalapuwa' },
      { key: 'ampara',      map: 'Ampara' },
    ],
  },
}

export const provinceDistrictKeys = (province) =>
  (PROVINCE_REPS[province]?.districts || []).map((d) => d.key)
