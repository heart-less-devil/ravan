// Country Classification by Region
// This shows how countries are mapped to regions in the search functionality

const countryClassification = {
  // North America
  'United States': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  
  // Europe
  'United Kingdom': 'Europe',
  'Germany': 'Europe',
  'France': 'Europe',
  'Switzerland': 'Europe',
  'Netherlands': 'Europe',
  'Belgium': 'Europe',
  'Sweden': 'Europe',
  'Denmark': 'Europe',
  'Norway': 'Europe',
  'Finland': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'Austria': 'Europe',
  'Ireland': 'Europe',
  'Poland': 'Europe',
  'Czech Republic': 'Europe',
  'Hungary': 'Europe',
  'Romania': 'Europe',
  'Bulgaria': 'Europe',
  'Croatia': 'Europe',
  'Slovenia': 'Europe',
  'Slovakia': 'Europe',
  'Estonia': 'Europe',
  'Latvia': 'Europe',
  'Lithuania': 'Europe',
  'Luxembourg': 'Europe',
  'Malta': 'Europe',
  'Cyprus': 'Europe',
  'Greece': 'Europe',
  'Portugal': 'Europe',
  
  // Asia
  'Japan': 'Asia',
  'China': 'Asia',
  'South Korea': 'Asia',
  'India': 'Asia',
  'Singapore': 'Asia',
  'Taiwan': 'Asia',
  'Hong Kong': 'Asia',
  'Thailand': 'Asia',
  'Malaysia': 'Asia',
  'Philippines': 'Asia',
  'Indonesia': 'Asia',
  'Vietnam': 'Asia',
  'Pakistan': 'Asia',
  'Bangladesh': 'Asia',
  'Sri Lanka': 'Asia',
  'Myanmar': 'Asia',
  'Cambodia': 'Asia',
  'Laos': 'Asia',
  'Nepal': 'Asia',
  'Mongolia': 'Asia',
  'Kazakhstan': 'Asia',
  'Uzbekistan': 'Asia',
  'Kyrgyzstan': 'Asia',
  'Tajikistan': 'Asia',
  'Turkmenistan': 'Asia',
  'Azerbaijan': 'Asia',
  'Georgia': 'Asia',
  'Armenia': 'Asia',
  'Israel': 'Asia',
  'Lebanon': 'Asia',
  'Jordan': 'Asia',
  'Syria': 'Asia',
  'Iraq': 'Asia',
  'Iran': 'Asia',
  'Afghanistan': 'Asia',
  'Yemen': 'Asia',
  'Oman': 'Asia',
  'Qatar': 'Asia',
  'Kuwait': 'Asia',
  'Bahrain': 'Asia',
  'United Arab Emirates': 'Asia',
  'Saudi Arabia': 'Asia',
  
  // South America
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Peru': 'South America',
  'Venezuela': 'South America',
  'Ecuador': 'South America',
  'Bolivia': 'South America',
  'Paraguay': 'South America',
  'Uruguay': 'South America',
  'Guyana': 'South America',
  'Suriname': 'South America',
  'French Guiana': 'South America',
  
  // Africa
  'South Africa': 'Africa',
  'Egypt': 'Africa',
  'Nigeria': 'Africa',
  'Kenya': 'Africa',
  'Morocco': 'Africa',
  'Algeria': 'Africa',
  'Tunisia': 'Africa',
  'Libya': 'Africa',
  'Sudan': 'Africa',
  'Ethiopia': 'Africa',
  'Uganda': 'Africa',
  'Tanzania': 'Africa',
  'Ghana': 'Africa',
  'Ivory Coast': 'Africa',
  'Senegal': 'Africa',
  'Mali': 'Africa',
  'Burkina Faso': 'Africa',
  'Niger': 'Africa',
  'Chad': 'Africa',
  'Cameroon': 'Africa',
  'Central African Republic': 'Africa',
  'Democratic Republic of the Congo': 'Africa',
  'Republic of the Congo': 'Africa',
  'Gabon': 'Africa',
  'Equatorial Guinea': 'Africa',
  'São Tomé and Príncipe': 'Africa',
  'Angola': 'Africa',
  'Zambia': 'Africa',
  'Zimbabwe': 'Africa',
  'Botswana': 'Africa',
  'Namibia': 'Africa',
  'Lesotho': 'Africa',
  'Eswatini': 'Africa',
  'Mozambique': 'Africa',
  'Madagascar': 'Africa',
  'Mauritius': 'Africa',
  'Seychelles': 'Africa',
  'Comoros': 'Africa',
  'Mayotte': 'Africa',
  'Réunion': 'Africa',
  'Djibouti': 'Africa',
  'Somalia': 'Africa',
  'Eritrea': 'Africa',
  'Burundi': 'Africa',
  'Rwanda': 'Africa',
  'Malawi': 'Africa',
  'Zambia': 'Africa',
  'Zimbabwe': 'Africa',
  'Botswana': 'Africa',
  'Namibia': 'Africa',
  'Lesotho': 'Africa',
  'Eswatini': 'Africa',
  'Mozambique': 'Africa',
  'Madagascar': 'Africa',
  'Mauritius': 'Africa',
  'Seychelles': 'Africa',
  'Comoros': 'Africa',
  'Mayotte': 'Africa',
  'Réunion': 'Africa',
  'Djibouti': 'Africa',
  'Somalia': 'Africa',
  'Eritrea': 'Africa',
  'Burundi': 'Africa',
  'Rwanda': 'Africa',
  'Malawi': 'Africa'
};

// Function to get region for a country
function getRegionForCountry(country) {
  return countryClassification[country] || 'Unknown';
}

// Function to get all countries in a region
function getCountriesInRegion(region) {
  return Object.entries(countryClassification)
    .filter(([country, reg]) => reg === region)
    .map(([country]) => country);
}

// Export for use in other files
module.exports = {
  countryClassification,
  getRegionForCountry,
  getCountriesInRegion
};

// Show classification summary
console.log('=== COUNTRY CLASSIFICATION SUMMARY ===');
console.log('Total countries classified:', Object.keys(countryClassification).length);

const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa'];
regions.forEach(region => {
  const countries = getCountriesInRegion(region);
  console.log(`\n${region}: ${countries.length} countries`);
  console.log('Sample countries:', countries.slice(0, 5).join(', '));
});

console.log('\n=== USAGE ===');
console.log('To get region for a country: getRegionForCountry("United States")');
console.log('To get all countries in a region: getCountriesInRegion("Europe")'); 