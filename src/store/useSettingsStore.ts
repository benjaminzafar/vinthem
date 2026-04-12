"use client";
import { create } from 'zustand';

export interface MenuLink {
  label: LocalizedString;
  href: string;
}

export interface FooterSection {
  title: LocalizedString;
  links: MenuLink[];
}

export interface LocalizedString {
  [lang: string]: string;
}

export interface StorefrontSettings {
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  storeName: LocalizedString;
  heroTitle: LocalizedString;
  heroSubtitle: LocalizedString;
  heroButtonText: LocalizedString;
  heroButtonLink: string;
  heroImage: string;
  heroBackgroundColor: string;
  futureProduct1Image: string;
  futureProduct2Image: string;
  logoImage: string;
  featuredTopSubtitle: LocalizedString;
  featuredTitle: LocalizedString;
  featuredSubtitle: LocalizedString;
  futureTitle: LocalizedString;
  futureSubtitle: LocalizedString;
  futureImage1: string;
  futureImage2: string;
  futureProduct1Link: string;
  futureProduct2Link: string;
  collectionTopSubtitle: LocalizedString;
  collectionTitle: LocalizedString;
  collectionSubtitle: LocalizedString;
  previewTitle: LocalizedString;
  viewAllText: LocalizedString;
  shopNowText: LocalizedString;
  noCollectionsFoundText: LocalizedString;
  checkBackLaterText: LocalizedString;
  newsletterSectionTitle: LocalizedString;
  newsletterSectionSubtitle: LocalizedString;
  newsletterPlaceholder: LocalizedString;
  newsletterButtonText: LocalizedString;
  newsletterLabel: LocalizedString;
  addedToCartText: LocalizedString;
  futureProduct1Date: LocalizedString;
  futureProduct1Title: LocalizedString;
  futureProduct2Date: LocalizedString;
  futureProduct2Title: LocalizedString;
  cartTitle: LocalizedString;
  cartEmptyMessage: LocalizedString;
  paymentTitle: LocalizedString;
  calculatedAtCheckoutText: LocalizedString;
  footerDescription: LocalizedString;
  footerCopyright: LocalizedString;
  menuText: LocalizedString;
  myProfileText: LocalizedString;
  adminPanelText: LocalizedString;
  logoutText: LocalizedString;
  languageLabel: LocalizedString;
  accountLabel: LocalizedString;
  adminDashboardText: LocalizedString;
  loginText: LocalizedString;
  searchText: LocalizedString;
  searchPlaceholder: LocalizedString;
  viewAllResultsText: LocalizedString;
  categoriesLabel: LocalizedString;
  categoriesText: LocalizedString;
  allCategoriesText: LocalizedString;
  filterButtonText: LocalizedString;
  filterText: LocalizedString;
  filtersTitle: LocalizedString;
  filtersText: LocalizedString;
  resetAllText: LocalizedString;
  recommendedForYouText: LocalizedString;
  featuredLabel: LocalizedString;
  featuredBadgeText: LocalizedString;
  showingText: LocalizedString;
  ofText: LocalizedString;
  productsLabel: LocalizedString;
  productsText: LocalizedString;
  noProductsFoundText: LocalizedString;
  noProductsMatchingText: LocalizedString;
  noProductsDescription: LocalizedString;
  clearFiltersText: LocalizedString;
  clearAllFiltersText: LocalizedString;
  colorsText: LocalizedString;
  sizesText: LocalizedString;
  priceText: LocalizedString;
  sortByText: LocalizedString;
  sortNewestText: LocalizedString;
  sortPriceAscText: LocalizedString;
  sortPriceDescText: LocalizedString;
  viewDetailsText: LocalizedString;
  filterAndSortText: LocalizedString;
  applyFiltersText: LocalizedString;
  showResultsText: LocalizedString;
  subtotalText: LocalizedString;
  shippingText: LocalizedString;
  totalText: LocalizedString;
  checkoutButtonText: LocalizedString;
  proceedToPaymentText: LocalizedString;
  continueShoppingText: LocalizedString;
  removeText: LocalizedString;
  freeText: LocalizedString;
  orderSummaryText: LocalizedString;
  completePaymentText: LocalizedString;
  processingText: LocalizedString;
  paymentSuccessText: LocalizedString;
  paymentErrorText: LocalizedString;
  processingOrderText: LocalizedString;
  orderPlacedSuccessText: LocalizedString;
  paymentFailedText: LocalizedString;
  shippingInformationText: LocalizedString;
  fullNameLabel: LocalizedString;
  addressLabel: LocalizedString;
  cityLabel: LocalizedString;
  postalCodeLabel: LocalizedString;
  paymentDetailsText: LocalizedString;
  payText: LocalizedString;
  signInTitle: LocalizedString;
  signUpTitle: LocalizedString;
  emailLabel: LocalizedString;
  passwordLabel: LocalizedString;
  forgotPasswordText: LocalizedString;
  dontHaveAccountText: LocalizedString;
  alreadyHaveAccountText: LocalizedString;
  signInButtonText: LocalizedString;
  signUpButtonText: LocalizedString;
  continueWithGoogleText: LocalizedString;
  loginSuccessText: LocalizedString;
  accountCreatedSuccessText: LocalizedString;
  googleLoginSuccessText: LocalizedString;
  productNotFoundText: LocalizedString;
  backToStoreText: LocalizedString;
  accountTitleText: LocalizedString;
  accountDescriptionText: LocalizedString;
  ordersText: LocalizedString;
  profileText: LocalizedString;
  addressesText: LocalizedString;
  noOrdersYetText: LocalizedString;
  noOrdersDescriptionText: LocalizedString;
  startShoppingText: LocalizedString;
  totalLabelText: LocalizedString;
  deliveredStatusText: LocalizedString;
  shippedStatusText: LocalizedString;
  processingStatusText: LocalizedString;
  orderItemsText: LocalizedString;
  receiptText: LocalizedString;
  qtyText: LocalizedString;
  inTransitStatusText: LocalizedString;
  pendingStatusText: LocalizedString;
  trackingPendingDescriptionText: LocalizedString;
  returnsDescriptionText: LocalizedString;
  printInvoiceText: LocalizedString;
  openCaseText: LocalizedString;
  editProfileButtonText: LocalizedString;
  addNewAddressTitleText: LocalizedString;
  addAddressDescriptionText: LocalizedString;
  addressUpdatedText: LocalizedString;
  addressAddedText: LocalizedString;
  failedToSaveAddressText: LocalizedString;
  addressDeletedText: LocalizedString;
  failedToDeleteAddressText: LocalizedString;
  defaultAddressUpdatedText: LocalizedString;
  failedToUpdateDefaultAddressText: LocalizedString;
  returnProcessText: LocalizedString;
  instructionsSentText: LocalizedString;
  currencyText: LocalizedString;
  reviewsText: LocalizedString;
  skuLabelText: LocalizedString;
  onlyText: LocalizedString;
  leftText: LocalizedString;
  instagramText: LocalizedString;
  tiktokText: LocalizedString;
  googleText: LocalizedString;
  facebookText: LocalizedString;
  twitterText: LocalizedString;
  customerReviewsText: LocalizedString;
  leaveReviewText: LocalizedString;
  shareThoughtsPlaceholder: LocalizedString;
  submitReviewButtonText: LocalizedString;
  loadingReviewsText: LocalizedString;
  noReviewsText: LocalizedString;
  pleaseLoginToReviewText: LocalizedString;
  reviewSubmittedText: LocalizedString;
  failedToSubmitReviewText: LocalizedString;
  colorBlackText: LocalizedString;
  colorWhiteText: LocalizedString;
  colorBeigeText: LocalizedString;
  colorNavyText: LocalizedString;
  colorGreyText: LocalizedString;
  sizeXSText: LocalizedString;
  sizeSText: LocalizedString;
  sizeMText: LocalizedString;
  sizeLText: LocalizedString;
  sizeXLText: LocalizedString;
  loggedOutSuccessText: LocalizedString;
  subscribedSuccessText: LocalizedString;
  addedToCartConfirmationText: LocalizedString;
  inStockText: LocalizedString;
  onlyLeftText: LocalizedString;
  outOfStockText: LocalizedString;
  colorLabelText: LocalizedString;
  featuresTitleText: LocalizedString;
  specificationsTitleText: LocalizedString;
  addToCartButtonText: LocalizedString;
  shareProductText: LocalizedString;
  relatedProductsTitleText: LocalizedString;
  accessRestrictedText: LocalizedString;
  pleaseLoginText: LocalizedString;
  orderStatusProcessing: LocalizedString;
  orderStatusShipped: LocalizedString;
  orderStatusDelivered: LocalizedString;
  orderStatusInTransit: LocalizedString;
  orderStatusPending: LocalizedString;
  orderLabelText: LocalizedString;
  dateLabelText: LocalizedString;
  statusLabelText: LocalizedString;
  orderItemsTitleText: LocalizedString;
  receiptTitleText: LocalizedString;
  trackingTitleText: LocalizedString;
  trackingNumberText: LocalizedString;
  trackButtonText: LocalizedString;
  returnsRefundsTitleText: LocalizedString;
  returnsRefundsDescriptionText: LocalizedString;
  printInvoiceButtonText: LocalizedString;
  openCaseButtonText: LocalizedString;
  profileDetailsTitleText: LocalizedString;
  guestUserText: LocalizedString;
  verifiedAccountText: LocalizedString;
  fullNameLabelText: LocalizedString;
  emailAddressLabelText: LocalizedString;
  savedAddressesTitleText: LocalizedString;
  addNewButtonText: LocalizedString;
  editAddressTitleText: LocalizedString;
  firstNameLabelText: LocalizedString;
  lastNameLabelText: LocalizedString;
  streetAddressLabelText: LocalizedString;
  cityLabelText: LocalizedString;
  postalCodeLabelText: LocalizedString;
  countryLabelText: LocalizedString;
  setDefaultAddressLabelText: LocalizedString;
  cancelButtonText: LocalizedString;
  saveAddressButtonText: LocalizedString;
  noAddressesSavedText: LocalizedString;
  addAddressFasterCheckoutText: LocalizedString;
  defaultBadgeText: LocalizedString;
  setDefaultButtonText: LocalizedString;
  editButtonText: LocalizedString;
  deleteButtonText: LocalizedString;
  backToAccountText: LocalizedString;
  refundReturnTitleText: LocalizedString;
  refundReturnDescriptionText: LocalizedString;
  orderIdLabelText: LocalizedString;
  orderIdPlaceholderText: LocalizedString;
  reasonForReturnLabelText: LocalizedString;
  damagedItemOptionText: LocalizedString;
  incorrectItemOptionText: LocalizedString;
  changedMindOptionText: LocalizedString;
  otherOptionText: LocalizedString;
  additionalCommentsLabelText: LocalizedString;
  commentsPlaceholderText: LocalizedString;
  submitRequestButtonText: LocalizedString;
  journalTitleText: LocalizedString;
  journalSubtitleText: LocalizedString;
  noJournalEntriesText: LocalizedString;
  checkBackLaterJournalText: LocalizedString;
  readArticleText: LocalizedString;
  byAuthorText: LocalizedString;
  backToJournalText: LocalizedString;
  articleNotFoundText: LocalizedString;
  aboutHeroTitleText: LocalizedString;
  aboutHeroSubtitleText: LocalizedString;
  aboutPhilosophyTitleText: LocalizedString;
  aboutPhilosophyDescription1Text: LocalizedString;
  aboutPhilosophyDescription2Text: LocalizedString;
  aboutSustainableMaterialsTitleText: LocalizedString;
  aboutSustainableMaterialsDescriptionText: LocalizedString;
  aboutContactUsTitleText: LocalizedString;
  aboutContactUsDescriptionText: LocalizedString;
  aboutEmailLabelText: LocalizedString;
  aboutPhoneLabelText: LocalizedString;
  aboutAddressLabelText: LocalizedString;
  aboutEmailValueText: LocalizedString;
  aboutPhoneValueText: LocalizedString;
  aboutAddressValueText: LocalizedString;
  loadingPageText: LocalizedString;
  pageNotFoundTitleText: LocalizedString;
  pageNotFoundDescriptionText: LocalizedString;
  returnHomeButtonText: LocalizedString;
  homeBreadcrumbText: LocalizedString;
  lastUpdatedText: LocalizedString;
  socialInstagram: string;
  socialTikTok: string;
  socialFacebook: string;
  socialTwitter: string;
  navbarLinks: MenuLink[];
  footerSections: FooterSection[];
  trackingTags: string;
  languages: string[];
}

interface SettingsStore {
  settings: StorefrontSettings;
  settingsLoaded: boolean;
  setSettings: (settings: Partial<StorefrontSettings>) => void;
  setSettingsLoaded: (loaded: boolean) => void;
}

export const defaultSettings: StorefrontSettings = {
  seoTitle: { en: 'Nordic Webshop - Premium Goods', sv: 'Nordic Webshop - Premiumvaror', fi: 'Nordic Webshop - Premium-tuotteet', da: 'Nordic Webshop - Premium Varer' },
  seoDescription: { en: 'Discover premium quality goods inspired by Scandinavian minimalism.', sv: 'Upptäck premiumvaror inspirerade av skandinavisk minimalism.', fi: 'Löydä skandinaavisen minimalismin inspiroimia premium-tuotteita.', da: 'Opdag premium varer inspireret af skandinavisk minimalisme.' },
  storeName: { en: 'Nordic', sv: 'Nordisk', fi: 'Pohjoismainen', da: 'Nordisk' },
  heroTitle: { en: 'Elevate Your Space', sv: 'Lyft ditt utrymme', fi: 'Nosta tilaasi', da: 'Løft dit rum' },
  heroSubtitle: { en: 'Discover our new collection of minimalist furniture and decor.', sv: 'Upptäck vår nya kollektion av minimalistiska möbler och inredning.', fi: 'Tutustu uuteen minimalististen huonekalujen ja sisustuksen kokoelmaamme.', da: 'Opdag vores nye kollektion af minimalistiske møbler og indretning.' },
  heroButtonText: { en: 'Shop Collection', sv: 'Handla Kollektionen', fi: 'Osta Kokoelma', da: 'Køb Kollektion' },
  heroButtonLink: '/products',
  heroBackgroundColor: '#f3f4f6',
  heroImage: 'https://images.unsplash.com/photo-1618220179428-22790b46a015?q=80&w=2727&auto=format&fit=crop',
  futureProduct1Image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2940&auto=format&fit=crop',
  futureProduct2Image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2939&auto=format&fit=crop',
  logoImage: '',
  featuredTopSubtitle: { en: 'Featured', sv: 'Utvald', fi: 'Suositeltu', da: 'Udvalgt' },
  featuredTitle: { en: 'Hero Products', sv: 'Hjälteprodukter', fi: 'Sankartuotteet', da: 'Helteprodukter' },
  featuredSubtitle: { en: 'Our most iconic designs, crafted to perfection and loved by thousands.', sv: 'Våra mest ikoniska designer, skapade till perfektion och älskade av tusentals.', fi: 'Ikonisimmat mallimme, jotka on valmistettu täydellisyyteen ja tuhansien rakastamia.', da: 'Vores mest ikoniske designs, skabt til perfektion og elsket af tusindvis.' },
  futureTitle: { en: 'Future\nClassics.', sv: 'Framtida\nKlassiker.', fi: 'Tulevaisuuden\nKlassikot.', da: 'Fremtidens\nKlassikere.' },
  futureSubtitle: { en: 'A sneak peek at our upcoming collection. Sign up to be notified when they drop.', sv: 'En förhandstitt på vår kommande kollektion. Registrera dig för att bli meddelad när de släpps.', fi: 'Kurkistus tulevaan mallistoomme. Rekisteröidy saadaksesi ilmoituksen, kun ne julkaistaan.', da: 'Et smugkig på vores kommende kollektion. Tilmeld dig for at få besked, når de udkommer.' },
  futureImage1: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2940&auto=format&fit=crop',
  futureImage2: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2939&auto=format&fit=crop',
  futureProduct1Link: '/products',
  futureProduct2Link: '/products',
  collectionTopSubtitle: { en: 'Shop Now', sv: 'Handla Nu', fi: 'Osta Nyt', da: 'Køb Nu' },
  collectionTitle: { en: 'The Complete Collection', sv: 'Hela Kollektionen', fi: 'Koko Mallisto', da: 'Hele Kollektionen' },
  collectionSubtitle: { en: 'Carefully selected pieces designed to bring harmony and function to your everyday life.', sv: 'Noggrant utvalda föremål designade för att ge harmoni och funktion till din vardag.', fi: 'Huolellisesti valitut kappaleet, jotka on suunniteltu tuomaan harmoniaa ja toimivuutta jokapäiväiseen elämääsi.', da: 'Nøje udvalgte stykker designet til at bringe harmoni og funktion til din hverdag.' },
  previewTitle: { en: 'Preview', sv: 'Förhandsvisning', fi: 'Esikatselu', da: 'Forhåndsvisning' },
  viewAllText: { en: 'View All', sv: 'Visa Alla', fi: 'Näytä Kaikki', da: 'Vis Alle' },
  shopNowText: { en: 'Shop Now', sv: 'Handla Nu', fi: 'Osta Nyt', da: 'Køb Nu' },
  noCollectionsFoundText: { en: 'No collections found', sv: 'Inga kollektioner hittades', fi: 'Kokoelmia ei löytynyt', da: 'Ingen kollektioner fundet' },
  checkBackLaterText: { en: 'Check back later for new arrivals.', sv: 'Kom tillbaka senare för nya ankomster.', fi: 'Palaa myöhemmin katsomaan uutuuksia.', da: 'Vend tilbage senere for nye ankomster.' },
  newsletterSectionTitle: { en: 'Join the Nordic Club', sv: 'Gå med i Nordic Club', fi: 'Liity Nordic Clubiin', da: 'Bliv medlem af Nordic Club' },
  newsletterSectionSubtitle: { en: 'Subscribe to receive updates, access to exclusive deals, and more.', sv: 'Prenumerera för att få uppdateringar, tillgång till exklusiva erbjudanden och mer.', fi: 'Tilaa saadaksesi päivityksiä, pääsyn eksklusiivisiin tarjouksiin ja muuta.', da: 'Tilmeld dig for at modtage opdateringer, adgang til eksklusive tilbud og mere.' },
  newsletterPlaceholder: { en: 'Enter your email address', sv: 'Ange din e-postadress', fi: 'Anna sähköpostiosoitteesi', da: 'Indtast din e-mailadresse' },
  newsletterButtonText: { en: 'Subscribe', sv: 'Prenumerera', fi: 'Tilaa', da: 'Tilmeld' },
  newsletterLabel: { en: 'Newsletter', sv: 'Nyhetsbrev', fi: 'Uutiskirje', da: 'Nyhedsbrev' },
  addedToCartText: { en: 'added to cart', sv: 'lagd i varukorgen', fi: 'lisätty ostoskoriin', da: 'lagt i kurven' },
  futureProduct1Date: { en: 'Dropping May 2026', sv: 'Släpps maj 2026', fi: 'Julkaistaan toukokuussa 2026', da: 'Udgives maj 2026' },
  futureProduct1Title: { en: 'The Lounge Chair', sv: 'Loungestolen', fi: 'Lounge-tuoli', da: 'Lænestolen' },
  futureProduct2Date: { en: 'Dropping June 2026', sv: 'Släpps juni 2026', fi: 'Julkaistaan kesäkuussa 2026', da: 'Udgives juni 2026' },
  futureProduct2Title: { en: 'Minimalist Dining', sv: 'Minimalistisk matsal', fi: 'Minimalistinen ruokailu', da: 'Minimalistisk spisning' },
  cartTitle: { en: 'Your Cart', sv: 'Din Kundvagn', fi: 'Ostoskori', da: 'Din Indkøbskurv' },
  cartEmptyMessage: { en: 'Looks like you haven\'t added anything to your cart yet. Discover our latest arrivals.', sv: 'Det ser ut som att du inte har lagt till något i din kundvagn än. Upptäck våra senaste nyheter.', fi: 'Näyttää siltä, ettet ole vielä lisännyt mitään ostoskoriisi. Tutustu uusimpiin tulokkaisiimme.', da: 'Det ser ud til, at du ikke har tilføjet noget til din indkøbskurv endnu. Oplev vores nyeste ankomster.' },
  paymentTitle: { en: 'Payment', sv: 'Betalning', fi: 'Maksu', da: 'Betaling' },
  calculatedAtCheckoutText: { en: 'Calculated at checkout', sv: 'Beräknas i kassan', fi: 'Lasketaan kassalla', da: 'Beregnes ved kassen' },
  footerDescription: { en: 'Premium quality goods inspired by Scandinavian minimalism. Designed for everyday life, built to last a lifetime.', sv: 'Varor av högsta kvalitet inspirerade av skandinavisk minimalism. Designade för vardagen, byggda för att hålla en livstid.', fi: 'Skandinaavisen minimalismin inspiroimia korkealaatuisia tuotteita. Suunniteltu jokapäiväiseen elämään, rakennettu kestämään eliniän.', da: 'Varer af højeste kvalitet inspireret af skandinavisk minimalisme. Designet til hverdagen, bygget til at holde hele livet.' },
  footerCopyright: { en: '© 2026 Nordic Webshop. All rights reserved.', sv: '© 2026 Nordic Webshop. Alla rättigheter reserverade.', fi: '© 2026 Nordic Webshop. Kaikki oikeudet pidätetään.', da: '© 2026 Nordic Webshop. Alle rettigheder forbeholdes.' },
  menuText: { en: 'Menu', sv: 'Meny', fi: 'Valikko', da: 'Menu' },
  myProfileText: { en: 'My Profile', sv: 'Min Profil', fi: 'Oma Profiili', da: 'Min Profil' },
  adminPanelText: { en: 'Admin Panel', sv: 'Adminpanel', fi: 'Ylläpito', da: 'Admin Panel' },
  logoutText: { en: 'Log Out', sv: 'Logga Ut', fi: 'Kirjaudu Ulos', da: 'Log Ud' },
  languageLabel: { en: 'Language', sv: 'Språk', fi: 'Kieli', da: 'Sprog' },
  accountLabel: { en: 'Account', sv: 'Konto', fi: 'Tili', da: 'Konto' },
  adminDashboardText: { en: 'Admin Dashboard', sv: 'Admin-översikt', fi: 'Ylläpito-näkymä', da: 'Admin Dashboard' },
  loginText: { en: 'Login', sv: 'Logga in', fi: 'Kirjaudu', da: 'Log ind' },
  searchText: { en: 'Search', sv: 'Sök', fi: 'Haku', da: 'Søg' },
  searchPlaceholder: { en: 'Search products...', sv: 'Sök produkter...', fi: 'Hae tuotteita...', da: 'Søg produkter...' },
  viewAllResultsText: { en: 'View all results', sv: 'Visa alla resultat', fi: 'Näytä kaikki tulokset', da: 'Vis alle resultater' },
  categoriesLabel: { en: 'Categories', sv: 'Kategorier', fi: 'Kategoriat', da: 'Kategorier' },
  categoriesText: { en: 'Categories', sv: 'Kategorier', fi: 'Kategoriat', da: 'Kategorier' },
  allCategoriesText: { en: 'All Categories', sv: 'Alla kategorier', fi: 'Kaikki kategoriat', da: 'Alle kategorier' },
  filterButtonText: { en: 'Filter', sv: 'Filtrera', fi: 'Suodata', da: 'Filtrer' },
  filterText: { en: 'Filter', sv: 'Filtrera', fi: 'Suodata', da: 'Filtrer' },
  filtersTitle: { en: 'Filters', sv: 'Filter', fi: 'Suodattimet', da: 'Filtre' },
  filtersText: { en: 'Filters', sv: 'Filter', fi: 'Suodattimet', da: 'Filtre' },
  resetAllText: { en: 'Reset All', sv: 'Återställ alla', fi: 'Nollaa kaikki', da: 'Nulstil alle' },
  recommendedForYouText: { en: 'Recommended for you', sv: 'Rekommenderas för dig', fi: 'Suositeltu sinulle', da: 'Anbefalet til dig' },
  featuredLabel: { en: 'Featured', sv: 'Utvald', fi: 'Suositeltu', da: 'Udvalgt' },
  featuredBadgeText: { en: 'Featured', sv: 'Utvald', fi: 'Suositeltu', da: 'Udvalgt' },
  showingText: { en: 'Showing', sv: 'Visar', fi: 'Näytetään', da: 'Viser' },
  ofText: { en: 'of', sv: 'av', fi: '/', da: 'af' },
  productsLabel: { en: 'products', sv: 'produkter', fi: 'tuotetta', da: 'produkter' },
  productsText: { en: 'products', sv: 'produkter', fi: 'tuotetta', da: 'produkter' },
  noProductsFoundText: { en: 'No products found', sv: 'Inga produkter hittades', fi: 'Tuotteita ei löytynyt', da: 'Ingen produkter fundet' },
  noProductsMatchingText: { en: "We couldn't find anything matching your search criteria.", sv: 'Vi kunde inte hitta något som matchar dina sökkriterier.', fi: 'Emme löytäneet mitään hakuehtojasi vastaavaa.', da: 'Vi kunne ikke finde noget, der matcher dine søgekriterier.' },
  noProductsDescription: { en: "We couldn't find anything matching your search criteria.", sv: 'Vi kunde inte hitta något som matchar dina sökkriterier.', fi: 'Emme löytäneet mitään hakuehtojasi vastaavaa.', da: 'Vi kunne ikke finde noget, der matcher dine søgekriterier.' },
  clearFiltersText: { en: 'Clear Filters', sv: 'Rensa filter', fi: 'Tyhjennä suodattimet', da: 'Ryd filtre' },
  clearAllFiltersText: { en: 'Clear All Filters', sv: 'Rensa alla filter', fi: 'Tyhjennä kaikki suodattimet', da: 'Ryd alle filtre' },
  colorsText: { en: 'Colors', sv: 'Färger', fi: 'Värit', da: 'Farver' },
  sizesText: { en: 'Sizes', sv: 'Storlekar', fi: 'Koot', da: 'Størrelser' },
  priceText: { en: 'Price', sv: 'Pris', fi: 'Hinta', da: 'Pris' },
  sortByText: { en: 'Sort By', sv: 'Sortera efter', fi: 'Lajittele', da: 'Sorter efter' },
  sortNewestText: { en: 'Newest Arrivals', sv: 'Nyaste ankomster', fi: 'Uusimmat tulokkaat', da: 'Nyeste ankomster' },
  sortPriceAscText: { en: 'Price: Low to High', sv: 'Pris: Lågt till högt', fi: 'Hinta: Pienimmästä suurimpaan', da: 'Pris: Lav til høj' },
  sortPriceDescText: { en: 'Price: High to Low', sv: 'Pris: Högt till lågt', fi: 'Hinta: Suurimmasta pienimpään', da: 'Pris: Høj til lav' },
  viewDetailsText: { en: 'View Details', sv: 'Visa detaljer', fi: 'Näytä tiedot', da: 'Vis detaljer' },
  filterAndSortText: { en: 'Filter & Sort', sv: 'Filtrera & Sortera', fi: 'Suodata & Lajittele', da: 'Filtrer & Sorter' },
  applyFiltersText: { en: 'Apply Filters', sv: 'Tillämpa filter', fi: 'Käytä suodattimia', da: 'Anvend filtre' },
  showResultsText: { en: 'Show {count} results', sv: 'Visa {count} resultat', fi: 'Näytä {count} tulosta', da: 'Vis {count} resultater' },
  subtotalText: { en: 'Subtotal', sv: 'Subtotal', fi: 'Välisumma', da: 'Subtotal' },
  shippingText: { en: 'Shipping', sv: 'Frakt', fi: 'Toimitus', da: 'Fragt' },
  totalText: { en: 'Total', sv: 'Totalt', fi: 'Yhteensä', da: 'Total' },
  checkoutButtonText: { en: 'Checkout', sv: 'Till kassan', fi: 'Kassalle', da: 'Til kassen' },
  proceedToPaymentText: { en: 'Proceed to Payment', sv: 'Fortsätt till betalning', fi: 'Jatka maksuun', da: 'Fortsæt til betaling' },
  continueShoppingText: { en: 'Continue Shopping', sv: 'Fortsätt handla', fi: 'Jatka ostoksia', da: 'Fortsæt med at handle' },
  removeText: { en: 'Remove', sv: 'Ta bort', fi: 'Poista', da: 'Fjern' },
  freeText: { en: 'Free', sv: 'Gratis', fi: 'Ilmainen', da: 'Gratis' },
  orderSummaryText: { en: 'Order Summary', sv: 'Orderöversikt', fi: 'Tilauksen yhteenveto', da: 'Ordreoversigt' },
  completePaymentText: { en: 'Complete Payment', sv: 'Slutför betalning', fi: 'Viimeistele maksu', da: 'Gennemfør betaling' },
  processingText: { en: 'Processing...', sv: 'Bearbetar...', fi: 'Käsitellään...', da: 'Behandler...' },
  paymentSuccessText: { en: 'Payment Successful!', sv: 'Betalningen lyckades!', fi: 'Maksu onnistui!', da: 'Betaling lykkedes!' },
  paymentErrorText: { en: 'Payment Failed', sv: 'Betalningen misslyckades', fi: 'Maksu epäonnistui', da: 'Betaling mislykkedes' },
  processingOrderText: { en: 'Processing your order...', sv: 'Behandlar din beställning...', fi: 'Käsitellään tilaustasi...', da: 'Behandler din ordre...' },
  orderPlacedSuccessText: { en: 'Order placed successfully!', sv: 'Beställningen har lagts!', fi: 'Tilaus tehty onnistuneesti!', da: 'Ordre afgivet med succes!' },
  paymentFailedText: { en: 'Payment failed. Please try again.', sv: 'Betalningen misslyckades. Vänligen försök igen.', fi: 'Maksu epäonnistui. Yritä uudelleen.', da: 'Betaling mislykkedes. Prøv venligst igen.' },
  shippingInformationText: { en: 'Shipping Information', sv: 'Fraktinformation', fi: 'Toimitustiedot', da: 'Forsendelsesinformation' },
  fullNameLabel: { en: 'Full Name', sv: 'Fullständigt namn', fi: 'Koko nimi', da: 'Fulde navn' },
  addressLabel: { en: 'Address', sv: 'Adress', fi: 'Osoite', da: 'Adresse' },
  cityLabel: { en: 'City', sv: 'Stad', fi: 'Kaupunki', da: 'By' },
  postalCodeLabel: { en: 'Postal Code', sv: 'Postnummer', fi: 'Postinumero', da: 'Postnummer' },
  paymentDetailsText: { en: 'Payment Details', sv: 'Betalningsuppgifter', fi: 'Maksutiedot', da: 'Betalingsoplysninger' },
  payText: { en: 'Pay', sv: 'Betala', fi: 'Maksa', da: 'Betal' },
  signInTitle: { en: 'Sign In', sv: 'Logga in', fi: 'Kirjaudu sisään', da: 'Log ind' },
  signUpTitle: { en: 'Sign Up', sv: 'Registrera dig', fi: 'Rekisteröidy', da: 'Tilmeld dig' },
  emailLabel: { en: 'Email', sv: 'E-post', fi: 'Sähköposti', da: 'E-mail' },
  passwordLabel: { en: 'Password', sv: 'Lösenord', fi: 'Salasana', da: 'Adgangskode' },
  forgotPasswordText: { en: 'Forgot Password?', sv: 'Glömt lösenord?', fi: 'Unohditko salasanan?', da: 'Glemt adgangskode?' },
  dontHaveAccountText: { en: "Don't have an account?", sv: 'Har du inget konto?', fi: 'Eikö sinulla ole tiliä?', da: 'Har du ikke en konto?' },
  alreadyHaveAccountText: { en: 'Already have an account?', sv: 'Har du redan ett konto?', fi: 'Onko sinulla jo tili?', da: 'Har du allerede en konto?' },
  signInButtonText: { en: 'Sign In', sv: 'Logga in', fi: 'Kirjaudu sisään', da: 'Log ind' },
  signUpButtonText: { en: 'Sign Up', sv: 'Registrera dig', fi: 'Rekisteröidy', da: 'Tilmeld dig' },
  continueWithGoogleText: { en: 'Continue with Google', sv: 'Fortsätt med Google', fi: 'Jatka Googlella', da: 'Fortsæt med Google' },
  loginSuccessText: { en: 'Welcome back!', sv: 'Välkommen tillbaka!', fi: 'Tervetuloa takaisin!', da: 'Velkommen tilbage!' },
  accountCreatedSuccessText: { en: 'Account created successfully!', sv: 'Kontot skapades framgångsrikt!', fi: 'Tili luotu onnistuneesti!', da: 'Konto oprettet med succes!' },
  googleLoginSuccessText: { en: 'Logged in with Google!', sv: 'Inloggad med Google!', fi: 'Kirjauduttu Googlella!', da: 'Logget ind med Google!' },
  productNotFoundText: { en: 'Product not found', sv: 'Produkten hittades inte', fi: 'Tuotetta ei löytynyt', da: 'Produktet blev ikke fundet' },
  backToStoreText: { en: 'Back to Store', sv: 'Tillbaka till butiken', fi: 'Takaisin kauppaan', da: 'Tilbage til butikken' },
  accountTitleText: { en: 'Your Account', sv: 'Ditt konto', fi: 'Tilisi', da: 'Din konto' },
  accountDescriptionText: { en: 'Manage your orders, profile details, and shipping addresses in one place.', sv: 'Hantera dina beställningar, profiluppgifter och leveransadresser på ett ställe.', fi: 'Hallitse tilauksiasi, profiilitietojasi ja toimitusosoitteitasi yhdessä paikassa.', da: 'Administrer dine ordrer, profiloplysninger og forsendelsesadresser på ét sted.' },
  ordersText: { en: 'Orders', sv: 'Beställningar', fi: 'Tilaukset', da: 'Ordrer' },
  profileText: { en: 'Profile', sv: 'Profil', fi: 'Profiili', da: 'Profil' },
  addressesText: { en: 'Addresses', sv: 'Adresser', fi: 'Osoitteet', da: 'Adresser' },
  noOrdersYetText: { en: 'No orders yet', sv: 'Inga beställningar än', fi: 'Ei vielä tilauksia', da: 'Ingen ordrer endnu' },
  noOrdersDescriptionText: { en: "You haven't placed any orders yet. Start exploring our collection.", sv: 'Du har inte lagt några beställningar än. Börja utforska vår kollektion.', fi: 'Et ole vielä tehnyt tilauksia. Aloita mallistoomme tutustuminen.', da: 'Du har ikke afgivet nogen ordrer endnu. Begynd at udforske vores kollektion.' },
  startShoppingText: { en: 'Start Shopping', sv: 'Börja handla', fi: 'Aloita ostokset', da: 'Begynd at shoppe' },
  totalLabelText: { en: 'Total', sv: 'Totalt', fi: 'Yhteensä', da: 'Total' },
  deliveredStatusText: { en: 'Delivered', sv: 'Levererad', fi: 'Toimitettu', da: 'Leveret' },
  shippedStatusText: { en: 'Shipped', sv: 'Skickad', fi: 'Lähetetty', da: 'Afsendt' },
  processingStatusText: { en: 'Processing', sv: 'Bearbetar', fi: 'Käsitellään', da: 'Behandler' },
  orderItemsText: { en: 'Order Items', sv: 'Orderartiklar', fi: 'Tilauksen tuotteet', da: 'Ordrevarer' },
  receiptText: { en: 'Receipt', sv: 'Kvitto', fi: 'Kuitti', da: 'Kvittering' },
  qtyText: { en: 'Qty', sv: 'Antal', fi: 'Kpl', da: 'Antal' },
  inTransitStatusText: { en: 'In Transit', sv: 'Under transport', fi: 'Matkalla', da: 'Under transport' },
  pendingStatusText: { en: 'Pending', sv: 'Väntande', fi: 'Odottaa', da: 'Afventer' },
  trackingPendingDescriptionText: { en: 'Tracking information will be available once your order has shipped.', sv: 'Spårningsinformation kommer att vara tillgänglig när din order har skickats.', fi: 'Seurantatiedot ovat saatavilla, kun tilauksesi on lähetetty.', da: 'Sporingsinformation vil være tilgængelig, når din ordre er afsendt.' },
  returnsDescriptionText: { en: 'Need to return an item? Start a request here.', sv: 'Behöver du returnera en vara? Starta en förfrågan här.', fi: 'Tarvitseeko tuote palauttaa? Aloita pyyntö tästä.', da: 'Har du brug for at returnere en vare? Start en anmodning her.' },
  printInvoiceText: { en: 'Print Invoice', sv: 'Skriv ut faktura', fi: 'Tulosta lasku', da: 'Udskriv faktura' },
  openCaseText: { en: 'Open a Case', sv: 'Öppna ett ärende', fi: 'Avaa tapaus', da: 'Åbn en sag' },
  editProfileButtonText: { en: 'Edit Profile', sv: 'Redigera profil', fi: 'Muokkaa profiilia', da: 'Rediger profil' },
  addNewAddressTitleText: { en: 'Add New Address', sv: 'Lägg till ny adress', fi: 'Lisää uusi osoite', da: 'Tilføj ny adresse' },
  addAddressDescriptionText: { en: 'Add an address for faster checkout.', sv: 'Lägg till en adress för snabbare utcheckning.', fi: 'Lisää osoite nopeuttaaksesi kassalle siirtymistä.', da: 'Tilføj en adresse for hurtigere udtjekning.' },
  addressUpdatedText: { en: 'Address updated successfully!', sv: 'Adressen har uppdaterats!', fi: 'Osoite päivitetty onnistuneesti!', da: 'Adresse opdateret med succes!' },
  addressAddedText: { en: 'Address added successfully!', sv: 'Adressen har lagts till!', fi: 'Osoite lisätty onnistuneesti!', da: 'Adresse tilføjet med succes!' },
  failedToSaveAddressText: { en: 'Failed to save address. Please try again.', sv: 'Misslyckades med att spara adressen. Vänligen försök igen.', fi: 'Osoitteen tallentaminen epäonnistui. Yritä uudelleen.', da: 'Kunne ikke gemme adresse. Prøv venligst igen.' },
  addressDeletedText: { en: 'Address deleted successfully!', sv: 'Adressen har raderats!', fi: 'Osoite poistettu onnistuneesti!', da: 'Adresse slettet med succes!' },
  failedToDeleteAddressText: { en: 'Failed to delete address. Please try again.', sv: 'Misslyckades med att radera adressen. Vänligen försök igen.', fi: 'Osoitteen poistaminen epäonnistui. Yritä uudelleen.', da: 'Kunne ikke slette adresse. Prøv venligst igen.' },
  defaultAddressUpdatedText: { en: 'Default address updated successfully!', sv: 'Standardadressen har uppdaterats!', fi: 'Oletusosoite päivitetty onnistuneesti!', da: 'Standardadresse opdateret med succes!' },
  failedToUpdateDefaultAddressText: { en: 'Failed to update default address. Please try again.', sv: 'Misslyckades med att uppdatera standardadressen. Vänligen försök igen.', fi: 'Oletusosoitteen päivittäminen epäonnistui. Yritä uudelleen.', da: 'Kunne ikke opdatere standardadresse. Prøv venligst igen.' },
  returnProcessText: { en: 'Processing return for order', sv: 'Behandlar retur för order', fi: 'Käsitellään palautusta tilaukselle', da: 'Behandler returnering for ordre' },
  instructionsSentText: { en: 'Instructions have been sent to your email.', sv: 'Instruktioner har skickats till din e-post.', fi: 'Ohjeet on lähetetty sähköpostiisi.', da: 'Instruktioner er blevet sendt til din e-mail.' },
  currencyText: { en: 'EUR', sv: 'SEK', fi: 'EUR', da: 'DKK' },
  reviewsText: { en: 'reviews', sv: 'recensioner', fi: 'arvostelua', da: 'anmeldelser' },
  skuLabelText: { en: 'SKU', sv: 'SKU', fi: 'SKU', da: 'SKU' },
  onlyText: { en: 'Only', sv: 'Endast', fi: 'Vain', da: 'Kun' },
  leftText: { en: 'left', sv: 'kvar', fi: 'jäljellä', da: 'tilbage' },
  instagramText: { en: 'Instagram', sv: 'Instagram', fi: 'Instagram', da: 'Instagram' },
  tiktokText: { en: 'TikTok', sv: 'TikTok', fi: 'TikTok', da: 'TikTok' },
  googleText: { en: 'Google', sv: 'Google', fi: 'Google', da: 'Google' },
  facebookText: { en: 'Facebook', sv: 'Facebook', fi: 'Facebook', da: 'Facebook' },
  twitterText: { en: 'Twitter', sv: 'Twitter', fi: 'Twitter', da: 'Twitter' },
  customerReviewsText: { en: 'Customer Reviews', sv: 'Kundrecensioner', fi: 'Asiakasarvostelut', da: 'Kundeanmeldelser' },
  leaveReviewText: { en: 'Leave a Review', sv: 'Lämna en recension', fi: 'Jätä arvostelu', da: 'Skriv en anmeldelse' },
  shareThoughtsPlaceholder: { en: 'Share your thoughts...', sv: 'Dela dina tankar...', fi: 'Jaa ajatuksesi...', da: 'Del dine tanker...' },
  submitReviewButtonText: { en: 'Submit Review', sv: 'Skicka recension', fi: 'Lähetä arvostelu', da: 'Indsend anmeldelse' },
  loadingReviewsText: { en: 'Loading reviews...', sv: 'Laddar recensioner...', fi: 'Ladataan arvosteluja...', da: 'Indlæser anmeldelser...' },
  noReviewsText: { en: 'No reviews yet. Be the first to review!', sv: 'Inga recensioner ännu. Bli den första att recensera!', fi: 'Ei arvosteluja vielä. Ole ensimmäinen!', da: 'Ingen anmeldelser endnu. Vær den første til at anmelde!' },
  pleaseLoginToReviewText: { en: 'Please log in to leave a review.', sv: 'Vänligen logga in för att lämna en recension.', fi: 'Kirjaudu sisään jättääksesi arvostelun.', da: 'Log ind for at skrive en anmeldelse.' },
  reviewSubmittedText: { en: 'Review submitted successfully!', sv: 'Recensionen har skickats!', fi: 'Arvostelu lähetetty onnistuneesti!', da: 'Anmeldelse indsendt med succes!' },
  failedToSubmitReviewText: { en: 'Failed to submit review.', sv: 'Det gick inte att skicka recensionen.', fi: 'Arvostelun lähettäminen epäonnistui.', da: 'Kunne ikke indsende anmeldelse.' },
  colorBlackText: { en: 'Black', sv: 'Svart', fi: 'Musta', da: 'Sort' },
  colorWhiteText: { en: 'White', sv: 'Vit', fi: 'Valkoinen', da: 'Hvid' },
  colorBeigeText: { en: 'Beige', sv: 'Beige', fi: 'Beige', da: 'Beige' },
  colorNavyText: { en: 'Navy', sv: 'Marinblå', fi: 'Tummansininen', da: 'Marineblå' },
  colorGreyText: { en: 'Grey', sv: 'Grå', fi: 'Harmaa', da: 'Grå' },
  sizeXSText: { en: 'XS', sv: 'XS', fi: 'XS', da: 'XS' },
  sizeSText: { en: 'S', sv: 'S', fi: 'S', da: 'S' },
  sizeMText: { en: 'M', sv: 'M', fi: 'M', da: 'M' },
  sizeLText: { en: 'L', sv: 'L', fi: 'L', da: 'L' },
  sizeXLText: { en: 'XL', sv: 'XL', fi: 'XL', da: 'XL' },
  loggedOutSuccessText: { en: 'Logged out successfully', sv: 'Utloggad framgångsrikt', fi: 'Kirjauduttu ulos onnistuneesti', da: 'Logget ud med succes' },
  subscribedSuccessText: { en: 'Subscribed successfully!', sv: 'Prenumeration lyckades!', fi: 'Tilaus onnistui!', da: 'Abonneret med succes!' },
  addedToCartConfirmationText: { en: 'added to cart', sv: 'lagd i varukorgen', fi: 'lisätty ostoskoriin', da: 'lagt i kurven' },
  inStockText: { en: 'In Stock', sv: 'I lager', fi: 'Varastossa', da: 'På lager' },
  onlyLeftText: { en: 'Only {count} left', sv: 'Endast {count} kvar', fi: 'Vain {count} jäljellä', da: 'Kun {count} tilbage' },
  outOfStockText: { en: 'Out of Stock', sv: 'Slutsåld', fi: 'Loppu varastosta', da: 'Ikke på lager' },
  colorLabelText: { en: 'Color', sv: 'Färg', fi: 'Väri', da: 'Farve' },
  featuresTitleText: { en: 'Features', sv: 'Egenskaper', fi: 'Ominaisuudet', da: 'Funktioner' },
  specificationsTitleText: { en: 'Specifications', sv: 'Specifikationer', fi: 'Tekniset tiedot', da: 'Specifikationer' },
  addToCartButtonText: { en: 'Add to Cart', sv: 'Lägg i varukorg', fi: 'Lisää ostoskoriin', da: 'Tilføj til kurv' },
  shareProductText: { en: 'Share Product', sv: 'Dela produkt', fi: 'Jaa tuote', da: 'Del produkt' },
  relatedProductsTitleText: { en: 'Related Products', sv: 'Relaterade produkter', fi: 'Liittyvät tuotteet', da: 'Relaterede produkter' },
  accessRestrictedText: { en: 'Access Restricted', sv: 'Åtkomst begränsad', fi: 'Pääsy rajoitettu', da: 'Adgang begrænset' },
  pleaseLoginText: { en: 'Please login to view your account details.', sv: 'Vänligen logga in för att se dina kontouppgifter.', fi: 'Kirjaudu sisään nähdäksesi tilitietosi.', da: 'Log venligst ind for at se dine kontooplysninger.' },
  orderStatusProcessing: { en: 'Processing', sv: 'Bearbetar', fi: 'Käsitellään', da: 'Behandler' },
  orderStatusShipped: { en: 'Shipped', sv: 'Skickad', fi: 'Lähetetty', da: 'Afsendt' },
  orderStatusDelivered: { en: 'Delivered', sv: 'Levererad', fi: 'Toimitettu', da: 'Leveret' },
  orderStatusInTransit: { en: 'In Transit', sv: 'Under transport', fi: 'Matkalla', da: 'Under transport' },
  orderStatusPending: { en: 'Pending', sv: 'Väntande', fi: 'Odottaa', da: 'Afventer' },
  orderLabelText: { en: 'Order', sv: 'Order', fi: 'Tilaus', da: 'Ordre' },
  dateLabelText: { en: 'Date', sv: 'Datum', fi: 'Päivämäärä', da: 'Dato' },
  statusLabelText: { en: 'Status', sv: 'Status', fi: 'Tila', da: 'Status' },
  orderItemsTitleText: { en: 'Order Items', sv: 'Orderartiklar', fi: 'Tilauksen tuotteet', da: 'Ordrevarer' },
  receiptTitleText: { en: 'Receipt', sv: 'Kvitto', fi: 'Kuitti', da: 'Kvittering' },
  trackingTitleText: { en: 'Tracking', sv: 'Spårning', fi: 'Seuranta', da: 'Sporing' },
  trackingNumberText: { en: 'Tracking Number', sv: 'Spårningsnummer', fi: 'Seurantanumero', da: 'Sporingsnummer' },
  trackButtonText: { en: 'Track', sv: 'Spåra', fi: 'Seuraa', da: 'Spor' },
  returnsRefundsTitleText: { en: 'Returns & Refunds', sv: 'Returer & Återbetalningar', fi: 'Palautukset & Hyvitykset', da: 'Returnering & Refundering' },
  returnsRefundsDescriptionText: { en: 'Need to return an item? Start a request here.', sv: 'Behöver du returnera en vara? Starta en förfrågan här.', fi: 'Tarvitseeko tuote palauttaa? Aloita pyyntö tästä.', da: 'Har du brug for at returnere en vare? Start en anmodning her.' },
  printInvoiceButtonText: { en: 'Print Invoice', sv: 'Skriv ut faktura', fi: 'Tulosta lasku', da: 'Udskriv faktura' },
  openCaseButtonText: { en: 'Open a Case / Request Refund', sv: 'Öppna ett ärende / Begär återbetalning', fi: 'Avaa tapaus / Pyydä hyvitystä', da: 'Åbn en sag / Anmod om refundering' },
  profileDetailsTitleText: { en: 'Profile Details', sv: 'Profiluppgifter', fi: 'Profiilin tiedot', da: 'Profiloplysninger' },
  guestUserText: { en: 'Guest User', sv: 'Gästanvändare', fi: 'Vierailija', da: 'Gæstebruger' },
  verifiedAccountText: { en: 'Verified Account', sv: 'Verifierat konto', fi: 'Vahvistettu tili', da: 'Verificeret konto' },
  fullNameLabelText: { en: 'Full Name', sv: 'Fullständigt namn', fi: 'Koko nimi', da: 'Fulde navn' },
  emailAddressLabelText: { en: 'Email Address', sv: 'E-postadress', fi: 'Sähköpostiosoite', da: 'E-mailadresse' },
  savedAddressesTitleText: { en: 'Saved Addresses', sv: 'Sparade adresser', fi: 'Tallennetut osoitteet', da: 'Gemte adresser' },
  addNewButtonText: { en: 'Add New', sv: 'Lägg till ny', fi: 'Lisää uusi', da: 'Tilføj ny' },
  editAddressTitleText: { en: 'Edit Address', sv: 'Redigera adress', fi: 'Muokkaa osoitetta', da: 'Rediger adresse' },
  firstNameLabelText: { en: 'First Name', sv: 'Förnamn', fi: 'Etunimi', da: 'Fornavn' },
  lastNameLabelText: { en: 'Last Name', sv: 'Efternamn', fi: 'Sukunimi', da: 'Efternavn' },
  streetAddressLabelText: { en: 'Street Address', sv: 'Gatuadress', fi: 'Katuosoite', da: 'Vejnavn og nummer' },
  cityLabelText: { en: 'City', sv: 'Stad', fi: 'Kaupunki', da: 'By' },
  postalCodeLabelText: { en: 'Postal Code', sv: 'Postnummer', fi: 'Postinumero', da: 'Postnummer' },
  countryLabelText: { en: 'Country', sv: 'Land', fi: 'Maa', da: 'Land' },
  setDefaultAddressLabelText: { en: 'Set as default shipping address', sv: 'Ange som standardleveransadress', fi: 'Aseta oletustoimitusosoitteeksi', da: 'Indstil som standardleveringsadresse' },
  cancelButtonText: { en: 'Cancel', sv: 'Avbryt', fi: 'Peruuta', da: 'Annuller' },
  saveAddressButtonText: { en: 'Save Address', sv: 'Spara adress', fi: 'Tallenna osoite', da: 'Gem adresse' },
  noAddressesSavedText: { en: 'No addresses saved', sv: 'Inga adresser sparade', fi: 'Ei tallennettuja osoitteita', da: 'Ingen gemte adresser' },
  addAddressFasterCheckoutText: { en: 'Add an address for faster checkout.', sv: 'Lägg till en adress för snabbare utcheckning.', fi: 'Lisää osoite nopeuttaaksesi kassalle siirtymistä.', da: 'Tilføj en adresse for hurtigere udtjekning.' },
  defaultBadgeText: { en: 'Default', sv: 'Standard', fi: 'Oletus', da: 'Standard' },
  setDefaultButtonText: { en: 'Set Default', sv: 'Ange som standard', fi: 'Aseta oletukseksi', da: 'Indstil som standard' },
  editButtonText: { en: 'Edit', sv: 'Redigera', fi: 'Muokkaa', da: 'Rediger' },
  deleteButtonText: { en: 'Delete', sv: 'Radera', fi: 'Poista', da: 'Slet' },
  backToAccountText: { en: 'Back to Account', sv: 'Tillbaka till kontot', fi: 'Takaisin tilille', da: 'Tilbage til konto' },
  refundReturnTitleText: { en: 'Refund & Return Request', sv: 'Begäran om återbetalning och retur', fi: 'Hyvitys- ja palautuspyyntö', da: 'Anmodning om refundering og returnering' },
  refundReturnDescriptionText: { en: "We're sorry to hear you're not satisfied with your purchase. Please fill out the form below to initiate a return or refund request. Our team will review your request and get back to you within 2-3 business days.", sv: 'Vi är ledsna att höra att du inte är nöjd med ditt köp. Vänligen fyll i formuläret nedan för att initiera en retur- eller återbetalningsbegäran. Vårt team kommer att granska din begäran och återkomma till dig inom 2-3 arbetsdagar.', fi: 'Olemme pahoillamme, ettet ole tyytyväinen ostokseesi. Täytä alla oleva lomake aloittaaksesi palautus- tai hyvityspyynnön. Tiimimme tarkistaa pyyntösi ja ottaa sinuun yhteyttä 2-3 arkipäivän kuluessa.', da: 'Vi er kede af at høre, at du ikke er tilfreds med dit køb. Udfyld venligst formularen nedenfor for at starte en returnerings- eller refunderingsanmodning. Vores team vil gennemgå din anmodning og vende tilbage til dig inden for 2-3 hverdage.' },
  orderIdLabelText: { en: 'Order ID', sv: 'Order-ID', fi: 'Tilaustunnus', da: 'Ordre-ID' },
  orderIdPlaceholderText: { en: 'Enter your Order ID', sv: 'Ange ditt order-ID', fi: 'Anna tilaustunnuksesi', da: 'Indtast dit ordre-ID' },
  reasonForReturnLabelText: { en: 'Reason for Return', sv: 'Orsak till retur', fi: 'Palautuksen syy', da: 'Årsag til returnering' },
  damagedItemOptionText: { en: 'Damaged item', sv: 'Skadad vara', fi: 'Vaurioitunut tuote', da: 'Beskadiget vare' },
  incorrectItemOptionText: { en: 'Incorrect item received', sv: 'Felaktig vara mottagen', fi: 'Väärä tuote vastaanotettu', da: 'Forkert vare modtaget' },
  changedMindOptionText: { en: 'Changed my mind', sv: 'Ångrat mig', fi: 'Muutin mieleni', da: 'Fortrudt køb' },
  otherOptionText: { en: 'Other', sv: 'Annat', fi: 'Muu', da: 'Andet' },
  additionalCommentsLabelText: { en: 'Additional Comments', sv: 'Ytterligare kommentarer', fi: 'Lisäkommentit', da: 'Yderligere kommentarer' },
  commentsPlaceholderText: { en: 'Please provide more details...', sv: 'Vänligen ange mer information...', fi: 'Anna lisätietoja...', da: 'Angiv venligst flere detaljer...' },
  submitRequestButtonText: { en: 'Submit Request', sv: 'Skicka begäran', fi: 'Lähetä pyyntö', da: 'Indsend anmodning' },
  journalTitleText: { en: 'Journal', sv: 'Journal', fi: 'Journali', da: 'Journal' },
  journalSubtitleText: { en: 'Stories, inspiration, and insights on Nordic design and lifestyle.', sv: 'Berättelser, inspiration och insikter om nordisk design och livsstil.', fi: 'Tarinoita, inspiraatiota ja oivalluksia pohjoismaisesta muotoilusta ja elämäntavasta.', da: 'Historier, inspiration og indsigt i nordisk design og livsstil.' },
  noJournalEntriesText: { en: 'No journal entries found. Check back later.', sv: 'Inga journalanteckningar hittades. Kom tillbaka senare.', fi: 'Journal-merkintöjä ei löytynyt. Palaa myöhemmin.', da: 'Ingen journalposter fundet. Vend tilbage senere.' },
  checkBackLaterJournalText: { en: 'Check back later for new stories.', sv: 'Kom tillbaka senare för nya berättelser.', fi: 'Palaa myöhemmin katsomaan uusia tarinoita.', da: 'Vend tilbage senere for nye historier.' },
  readArticleText: { en: 'Read Article', sv: 'Läs artikeln', fi: 'Lue artikkeli', da: 'Læs artiklen' },
  byAuthorText: { en: 'By', sv: 'Av', fi: 'Kirjoittaja', da: 'Af' },
  backToJournalText: { en: 'Back to Journal', sv: 'Tillbaka till journalen', fi: 'Takaisin journaliin', da: 'Tilbage til journalen' },
  articleNotFoundText: { en: 'Article not found', sv: 'Artikeln hittades inte', fi: 'Artikkelia ei löytynyt', da: 'Artiklen blev ikke fundet' },
  aboutHeroTitleText: { en: 'Our Story', sv: 'Vår Historia', fi: 'Tarina', da: 'Vores Historie' },
  aboutHeroSubtitleText: { en: 'Crafting timeless pieces for the modern home, inspired by the serene landscapes of the North.', sv: 'Skapar tidlösa föremål för det moderna hemmet, inspirerade av Nordens lugna landskap.', fi: 'Luomme ajattomia esineitä moderniin kotiin, inspiraationa pohjoisen seesteiset maisemat.', da: 'Vi skaber tidløse genstande til det moderne hjem, inspireret af Nordens rolige landskaber.' },
  aboutPhilosophyTitleText: { en: 'The Nordic Philosophy', sv: 'Den nordiska filosofin', fi: 'Pohjoismainen filosofia', da: 'Den nordiske filosofi' },
  aboutPhilosophyDescription1Text: { en: 'Founded in Stockholm in 2026, Nordic Webshop was born out of a desire to bring the principles of Scandinavian design to a global audience. We believe that good design should be accessible, functional, and beautiful.', sv: 'Nordic Webshop grundades i Stockholm 2026 och föddes ur en önskan att föra ut principerna för skandinavisk design till en global publik. Vi tror att bra design ska vara tillgänglig, funktionell och vacker.', fi: 'Tukholmassa vuonna 2026 perustettu Nordic Webshop syntyi halusta tuoda skandinaavisen muotoilun periaatteet maailmanlaajuiselle yleisölle. Uskomme, että hyvän muotoilun tulee olla saavutettavaa, toimivaa ja kaunista.', da: 'Nordic Webshop blev grundlagt i Stockholm i 2026 og udspringer af et ønske om at bringe principperne for skandinavisk design ud til et globalt publikum. Vi mener, at godt design skal være tilgængeligt, funktionelt og smukt.' },
  aboutPhilosophyDescription2Text: { en: 'Our philosophy is rooted in minimalism and sustainability. We strip away the unnecessary, focusing on clean lines, natural materials, and exceptional craftsmanship. Every piece in our collection is carefully curated to ensure it meets our rigorous standards for quality and aesthetics.', sv: 'Vår filosofi är rotad i minimalism och hållbarhet. Vi skalar bort det onödiga och fokuserar på rena linjer, naturmaterial och exceptionellt hantverk. Varje föremål i vår kollektion är noggrant utvalt för att säkerställa att det uppfyller våra rigorösa standarder för kvalitet och estetik.', fi: 'Filosofiamme juuret ovat minimalismissa ja kestävässä kehityksessä. Karsimme pois tarpeettoman ja keskitymme puhtaisiin linjoihin, luonnonmateriaaleihin ja poikkeukselliseen käsityötaitoon. Jokainen mallistomme kappale on huolellisesti kuratoitu varmistaaksemme, että se täyttää tiukat laatu- ja estetiikkavaatimuksemme.', da: 'Vores filosofi er rodfæstet i minimalisme og bæredygtighed. Vi fjerner det unødvendige og fokuserer på rene linjer, naturmaterialer og exceptionelt håndværk. Hvert stykke i vores kollektion er nøje udvalgt for at sikre, at det lever op til vores strenge standarder for kvalitet og æstetik.' },
  aboutSustainableMaterialsTitleText: { en: 'Sustainable Materials', sv: 'Hållbara material', fi: 'Kestävät materiaalit', da: 'Bæredygtige materialer' },
  aboutSustainableMaterialsDescriptionText: { en: 'We are committed to minimizing our environmental impact. We source our materials responsibly, prioritizing FSC-certified woods, organic cottons, and recycled metals. Our packaging is 100% recyclable, and we continuously strive to reduce waste throughout our supply chain.', sv: 'Vi är fast beslutna att minimera vår miljöpåverkan. Vi köper våra material på ett ansvarsfullt sätt och prioriterar FSC-certifierat trä, ekologisk bomull och återvunnen metall. Våra förpackningar är 100 % återvinningsbara och vi strävar kontinuerligt efter att minska avfallet i hela vår leveranskedja.', fi: 'Olemme sitoutuneet minimoimaan ympäristövaikutuksemme. Hankimme materiaalimme vastuullisesti ja painotamme FSC-sertifioitua puuta, luomupuuvillaa ja kierrätettyjä metalleja. Pakkauksemme ovat 100 % kierrätettäviä, ja pyrimme jatkuvasti vähentämään jätettä koko toimitusketjussamme.', da: 'Vi er forpligtet til at minimere vores miljøpåvirkning. Vi indkøber vores materialer ansvarligt og prioriterer FSC-certificeret træ, økologisk bomuld og genbrugsmetaller. Vores emballage er 100 % genanvendelig, og vi stræber løbende efter at reducere spild i hele vores forsyningskæde.' },
  aboutContactUsTitleText: { en: 'Contact Us', sv: 'Kontakta oss', fi: 'Ota yhteyttä', da: 'Kontakt os' },
  aboutContactUsDescriptionText: { en: "Have a question or just want to say hello? We'd love to hear from you.", sv: 'Har du en fråga eller vill du bara säga hej? Vi vill gärna höra från dig.', fi: 'Onko sinulla kysyttävää tai haluatko vain sanoa hei? Kuulisimme mielellämme sinusta.', da: 'Har du et spørgsmål eller vil du bare sige hej? Vi vil meget gerne høre fra dig.' },
  aboutEmailLabelText: { en: 'Email', sv: 'E-post', fi: 'Sähköposti', da: 'E-mail' },
  aboutPhoneLabelText: { en: 'Phone', sv: 'Telefon', fi: 'Puhelin', da: 'Telefon' },
  aboutAddressLabelText: { en: 'Address', sv: 'Adress', fi: 'Osoite', da: 'Adresse' },
  aboutEmailValueText: { en: 'hello@nordicwebshop.com', sv: 'hej@nordicwebshop.com', fi: 'hei@nordicwebshop.com', da: 'hej@nordicwebshop.com' },
  aboutPhoneValueText: { en: '+46 8 123 45 67', sv: '+46 8 123 45 67', fi: '+46 8 123 45 67', da: '+46 8 123 45 67' },
  aboutAddressValueText: { en: 'Sveavägen 44, 111 34 Stockholm, Sweden', sv: 'Sveavägen 44, 111 34 Stockholm, Sverige', fi: 'Sveavägen 44, 111 34 Tukholma, Ruotsi', da: 'Sveavägen 44, 111 34 Stockholm, Sverige' },
  loadingPageText: { en: 'Loading page...', sv: 'Laddar sida...', fi: 'Ladataan sivua...', da: 'Indlæser side...' },
  pageNotFoundTitleText: { en: 'Page Not Found', sv: 'Sidan hittades inte', fi: 'Sivua ei löytynyt', da: 'Siden blev ikke fundet' },
  pageNotFoundDescriptionText: { en: "The page you are looking for doesn't exist or has been moved.", sv: 'Sidan du letar efter finns inte eller har flyttats.', fi: 'Etsimääsi sivua ei ole olemassa tai se on siirretty.', da: 'Siden, du leder efter, eksisterer ikke eller er blevet flyttet.' },
  returnHomeButtonText: { en: 'Return Home', sv: 'Tillbaka till hem', fi: 'Palaa kotiin', da: 'Vend hjem' },
  homeBreadcrumbText: { en: 'Home', sv: 'Hem', fi: 'Koti', da: 'Hjem' },
  lastUpdatedText: { en: 'Last updated', sv: 'Senast uppdaterad', fi: 'Viimeksi päivitetty', da: 'Sidst opdateret' },
  socialInstagram: '#',
  socialTikTok: '#',
  socialFacebook: '',
  socialTwitter: '',
  navbarLinks: [
    { label: { en: 'Shop', sv: 'Handla', fi: 'Kauppa', da: 'Shop' }, href: '/products' },
    { label: { en: 'Journal', sv: 'Journal', fi: 'Journali', da: 'Journal' }, href: '/blog' },
    { label: { en: 'Our Story', sv: 'Vår Historia', fi: 'Tarina', da: 'Vores Historie' }, href: '/about' }
  ],
  footerSections: [
    {
      title: { en: 'Shop', sv: 'Handla', fi: 'Kauppa', da: 'Shop' },
      links: [
        { label: { en: 'New Arrivals', sv: 'Nyheter', fi: 'Uutuudet', da: 'Nyheder' }, href: '/products' },
        { label: { en: 'Journal', sv: 'Journal', fi: 'Journali', da: 'Journal' }, href: '/blog' },
        { label: { en: 'Our Story', sv: 'Vår Historia', fi: 'Tarina', da: 'Vores Historie' }, href: '/about' }
      ]
    },
    {
      title: { en: 'Support', sv: 'Support', fi: 'Tuki', da: 'Support' },
      links: [
        { label: { en: 'FAQ', sv: 'FAQ', fi: 'UKK', da: 'FAQ' }, href: '/p/faq' },
        { label: { en: 'Shipping & Returns', sv: 'Frakt & Retur', fi: 'Toimitus & Palautus', da: 'Fragt & Retur' }, href: '/p/shipping-returns' },
        { label: { en: 'Contact Us', sv: 'Kontakta Oss', fi: 'Ota Yhteyttä', da: 'Kontakt Os' }, href: '/p/contact' },
        { label: { en: 'Privacy Policy', sv: 'Integritetspolicy', fi: 'Tietosuojakäytäntö', da: 'Privatlivspolitik' }, href: '/p/privacy-policy' }
      ]
    }
  ],
  trackingTags: '',
  languages: ['en', 'sv', 'fi', 'da'],
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  settingsLoaded: false,
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
  setSettingsLoaded: (loaded) => set({ settingsLoaded: loaded }),
}));
