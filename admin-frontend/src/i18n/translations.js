export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'si', label: 'සිංහල' },
];

const en = {
  portalTagline: 'The Central Administration & Management Platform',
  identity: 'எழுச்சி | RISE',
  values: 'Democracy • Equality • Social Justice',
  footer: 'OFFICIAL PARTY ADMINISTRATION SYSTEM',
  welcome: 'Welcome Back',
  description: 'Sign in to access the administration system',
  username: 'Username',
  usernamePlaceholder: 'Enter your username or email',
  password: 'Password',
  passwordPlaceholder: 'Enter your password',
  rememberMe: 'Remember Me',
  showPassword: 'Show Password',
  hidePassword: 'Hide Password',
  signIn: 'Sign In',
  signingIn: 'Signing in…',
  forgotPassword: 'Forgot Password?',
  requiredFields: 'Please complete all required fields',
  invalidLogin: 'Invalid username or password',
  loginError: 'Unable to sign in. Please try again.',
  dashboardTitle: 'RISE Governance Hub',
  dashboardWelcome: 'Welcome back',
  logout: 'Sign Out',
};

const ta = {
  portalTagline: 'மைய நிர்வாக & மேலாண்மை தளம்',
  identity: 'எழுச்சி | RISE',
  values: 'ஜனநாயகம் • சமத்துவம் • சமூக நீதி',
  footer: 'அதிகாரப்பூர்வ கட்சி நிர்வாக அமைப்பு',
  welcome: 'மீண்டும் வரவேற்கிறோம்',
  description: 'நிர்வாக அமைப்பை அணுக உள்நுழையவும்',
  username: 'பயனர் பெயர்',
  usernamePlaceholder: 'பயனர் பெயர் அல்லது மின்னஞ்சலை உள்ளிடவும்',
  password: 'கடவுச்சொல்',
  passwordPlaceholder: 'கடவுச்சொல்லை உள்ளிடவும்',
  rememberMe: 'என்னை நினைவில் கொள்',
  showPassword: 'கடவுச்சொல்லைக் காண்பி',
  hidePassword: 'கடவுச்சொல்லை மறை',
  signIn: 'உள்நுழைக',
  signingIn: 'உள்நுழைகிறது…',
  forgotPassword: 'கடவுச்சொல்லை மறந்துவிட்டீர்களா?',
  requiredFields: 'தேவையான அனைத்து புலங்களையும் நிரப்பவும்',
  invalidLogin: 'தவறான பயனர் பெயர் அல்லது கடவுச்சொல்',
  loginError: 'உள்நுழைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
  dashboardTitle: 'RISE Governance Hub',
  dashboardWelcome: 'மீண்டும் வரவேற்கிறோம்',
  logout: 'வெளியேறு',
};

const si = {
  portalTagline: 'මධ්‍ය පරිපාලන & කළමනාකරණ වේදිකාව',
  identity: 'RISE',
  values: 'Democracy • Equality • Social Justice',
  footer: 'නිල පක්ෂ පරිපාලන පද්ධතිය',
  welcome: 'නැවත සාදරයෙන් පිළිගනිමු',
  description: 'පරිපාලන පද්ධතියට පිවිසීමට ලොග් වන්න',
  username: 'පරිශීලක නාමය',
  usernamePlaceholder: 'පරිශීලක නාමය හෝ විද්‍යුත් තැපෑල ඇතුළත් කරන්න',
  password: 'මුරපදය',
  passwordPlaceholder: 'මුරපදය ඇතුළත් කරන්න',
  rememberMe: 'මාව මතක තබා ගන්න',
  showPassword: 'මුරපදය පෙන්වන්න',
  hidePassword: 'මුරපදය සඟවන්න',
  signIn: 'පිවිසෙන්න',
  signingIn: 'පිවිසෙමින්…',
  forgotPassword: 'මුරපදය අමතකද?',
  requiredFields: 'කරුණාකර අවශ්‍ය සියලුම ක්ෂේත්‍ර පුරවන්න',
  invalidLogin: 'වැරදි පරිශීලක නාමයක් හෝ මුරපදයක්',
  loginError: 'පිවිසීමට නොහැක. නැවත උත්සාහ කරන්න.',
  dashboardTitle: 'RISE Governance Hub',
  dashboardWelcome: 'නැවත සාදරයෙන් පිළිගනිමු',
  logout: 'ඉවත් වන්න',
};

export const translations = { en, ta, si };
export const LANG_KEY = 'rise_lang';

export function getInitialLang() {
  const saved = localStorage.getItem(LANG_KEY);
  return translations[saved] ? saved : 'en';
}

export function saveLang(code) {
  if (translations[code]) localStorage.setItem(LANG_KEY, code);
}