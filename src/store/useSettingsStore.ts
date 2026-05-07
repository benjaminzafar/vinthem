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
  seoKeywords: LocalizedString;
  seoImage: string;
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
  featuredCategoryId: string;
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
  futureViewAllText: LocalizedString;
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
  searchDiscoverCollectionsText: LocalizedString;
  searchCollectionsResultsText: LocalizedString;
  searchProductsResultsText: LocalizedString;
  searchNoProductsResultsText: LocalizedString;
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
  savedAddressesText: LocalizedString;
  fullNameLabel: LocalizedString;
  phoneLabel: LocalizedString;
  addressLabel: LocalizedString;
  cityLabel: LocalizedString;
  postalCodeLabel: LocalizedString;
  paymentDetailsText: LocalizedString;
  getHelpText: LocalizedString;
  payText: LocalizedString;
  signInTitle: LocalizedString;
  signUpTitle: LocalizedString;
  emailLabel: LocalizedString;
  passwordLabel: LocalizedString;
  forgotPasswordText: LocalizedString;
  forgotPasswordTitle: LocalizedString;
  forgotPasswordSubtitle: LocalizedString;
  sendResetLinkButtonText: LocalizedString;
  backToLoginText: LocalizedString;
  resetPasswordSentSuccessText: LocalizedString;
  resetPasswordTitle: LocalizedString;
  newPasswordLabel: LocalizedString;
  confirmNewPasswordLabel: LocalizedString;
  resetPasswordButtonText: LocalizedString;
  passwordResetSuccessText: LocalizedString;
  dontHaveAccountText: LocalizedString;
  alreadyHaveAccountText: LocalizedString;
  signInButtonText: LocalizedString;
  signUpButtonText: LocalizedString;
  continueWithGoogleText: LocalizedString;
  googleLoginUnavailableText: LocalizedString;
  loginSuccessText: LocalizedString;
  accountCreatedSuccessText: LocalizedString;
  googleLoginSuccessText: LocalizedString;
  signUpTermsConsentText: LocalizedString;
  signUpPrivacyConsentText: LocalizedString;
  signUpMarketingConsentText: LocalizedString;
  cookiePreferencesButtonText: LocalizedString;
  unsubscribeLinkText: LocalizedString;
  consentBannerEyebrowText: LocalizedString;
  consentBannerTitleText: LocalizedString;
  consentBannerDescriptionText: LocalizedString;
  consentPrivacyLinkText: LocalizedString;
  consentCookieLinkText: LocalizedString;
  consentChooseSettingsText: LocalizedString;
  consentAcceptAllText: LocalizedString;
  consentEssentialOnlyText: LocalizedString;
  consentModalEyebrowText: LocalizedString;
  consentModalTitleText: LocalizedString;
  consentCloseText: LocalizedString;
  consentEssentialTitleText: LocalizedString;
  consentEssentialDescriptionText: LocalizedString;
  consentAlwaysOnText: LocalizedString;
  consentAnalyticsTitleText: LocalizedString;
  consentAnalyticsDescriptionText: LocalizedString;
  consentMarketingTitleText: LocalizedString;
  consentMarketingDescriptionText: LocalizedString;
  consentSavePreferencesText: LocalizedString;
  consentRejectOptionalText: LocalizedString;
  privacyPolicyPageTitle: LocalizedString;
  privacyPolicyPageContent: LocalizedString;
  cookiePolicyPageTitle: LocalizedString;
  cookiePolicyPageContent: LocalizedString;
  termsOfServicePageTitle: LocalizedString;
  termsOfServicePageContent: LocalizedString;
  linkCopiedText: LocalizedString;
  googleAuthEnabled: boolean;
  authBackgroundImage: string;
  productNotFoundText: LocalizedString;
  backToStoreText: LocalizedString;
  accountTitleText: LocalizedString;
  accountDescriptionText: LocalizedString;
  ordersText: LocalizedString;
  supportText: LocalizedString;
  profileText: LocalizedString;
  addressesText: LocalizedString;
  totalSuffixText: LocalizedString;
  noOrdersYetText: LocalizedString;
  noOrdersDescriptionText: LocalizedString;
  noSupportActivityYetText: LocalizedString;
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
  threadsText: LocalizedString;
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
  userAlreadyExistsErrorText: LocalizedString;
  rateLimitWaitErrorText: LocalizedString;
  invalidOtpErrorText: LocalizedString;
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
  loadingPageText: LocalizedString;
  pageNotFoundTitleText: LocalizedString;
  pageNotFoundDescriptionText: LocalizedString;
  returnHomeButtonText: LocalizedString;
  homeBreadcrumbText: LocalizedString;
  lastUpdatedText: LocalizedString;
  socialInstagram: string;
  socialTikTok: string;
  socialFacebook: string;
  socialThreads: string;
  navbarLinks: MenuLink[];
  footerSections: FooterSection[];
  trackingTags: string;
  languages: string[];
  quickAddText: LocalizedString;
  noPagesYetText: LocalizedString;
  noPagesDescriptionText: LocalizedString;
  inventoryTitleText: LocalizedString;
  regularPriceText: LocalizedString;
  salePriceText: LocalizedString;
  skuCodeText: LocalizedString;
  initialStockText: LocalizedString;
  weightKgText: LocalizedString;
  shippingClassText: LocalizedString;
  invalidLoginErrorText: LocalizedString;
  otpTitle: LocalizedString;
  otpSubtitle: LocalizedString;
  otpCheckSpam: LocalizedString;
  otpVerifyButton: LocalizedString;
  otpClearButton: LocalizedString;
  shippingCountries: Array<{ code: string; name: LocalizedString }>;
  finalizeAccountTitle: LocalizedString;
  finalizeAccountSubtitle: LocalizedString;
  continueToStripeText: LocalizedString;
  sitemapText: LocalizedString;
}

interface SettingsStore {
  settings: StorefrontSettings;
  settingsLoaded: boolean;
  setSettings: (settings: Partial<StorefrontSettings>) => void;
  setSettingsLoaded: (loaded: boolean) => void;
}

export const defaultSettings: StorefrontSettings = {
  seoTitle: { en: 'Vinthem - Quality Everyday Essentials', sv: 'Vinthem - Kvalitetsprodukter för vardagen', fi: 'Vinthem - Laadukkaita arkitarvikkeita', da: 'Vinthem - Kvalitetsprodukter til hverdagen' },
  seoDescription: { en: 'Vinthem - A Stockholm-based store with 20+ years of retail experience. We provide real stock, reliable delivery, and everyday useful products.', sv: 'Vinthem - En Stockholmsbaserad butik med över 20 års erfarenhet. Vi erbjuder riktigt lager, pålitlig leverans och användbara vardagsprodukter.', fi: 'Vinthem - Tukholmalainen kauppa, jolla on yli 20 vuoden kokemus vähittäiskaupasta. Tarjoamme todellisen varaston, luotettavan toimituksen ja hyödyllisiä arkituotteita.', da: 'Vinthem - En Stockholms-baseret butik med over 20 års erfaring. Vi tilbyder reelt lager, pålidelig levering og nyttige hverdagsprodukter.' },
  seoKeywords: { en: 'vinthem, stockholm retail, everyday essentials, reliable shipping, swedish store', sv: 'vinthem, stockholm detaljhandel, vardagsartiklar, pålitlig frakt, svensk butik', fi: 'vinthem, tukholman vähittäiskauppa, arkitarvikkeet, luotettava toimitus, ruotsalainen kauppa', da: 'vinthem, stockholm detailhandel, hverdagsessentials, pålidelig levering, svensk butik' },
  seoImage: '',
  storeName: { en: 'Vinthem', sv: 'Vinthem', fi: 'Vinthem', da: 'Vinthem' },
  heroTitle: { en: 'Elevate Your Space', sv: 'Lyft ditt utrymme', fi: 'Nosta tilaasi', da: 'Løft dit rum' },
  heroSubtitle: { en: 'Discover our new collection of minimalist furniture and decor.', sv: 'Upptäck vår nya kollektion av minimalistiska möbler och inredning.', fi: 'Tutustu uuteen minimalististen huonekalujen ja sisustuksen kokoelmaamme.', da: 'Opdag vores nye kollektion af minimalistiske möbler och indretning.' },
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
  featuredCategoryId: '',
  collectionTopSubtitle: { en: 'Shop Now', sv: 'Handla Nu', fi: 'Osta Nyt', da: 'Køb Nu' },
  collectionTitle: { en: 'The Complete Collection', sv: 'Hela Kollektionen', fi: 'Koko Mallisto', da: 'Hele Kollektionen' },
  collectionSubtitle: { en: 'Carefully selected pieces designed to bring harmony and function to your everyday life.', sv: 'Noggrant utvalda föremål designade för att ge harmoni och funktion till din vardag.', fi: 'Huolellisesti valitut kappaleet, jotka on suunniteltu tuomaan harmoniaa ja toimivuutta jokapäiväiseen elämääsi.', da: 'Nøje udvalgte stykker designet til at bringe harmoni og funktion til din hverdag.' },
  previewTitle: { en: 'Preview', sv: 'Förhandsvisning', fi: 'Esikatselu', da: 'Forhåndsvisning' },
  viewAllText: { en: 'View All', sv: 'Visa Alla', fi: 'Näytä Kaikki', da: 'Vis Alle' },
  shopNowText: { en: 'Shop Now', sv: 'Handla Nu', fi: 'Osta Nyt', da: 'Køb Nu' },
  noCollectionsFoundText: { en: 'No collections found', sv: 'Inga kollektioner hittades', fi: 'Kokoelmia ei löytynyt', da: 'Ingen kollektioner fundet' },
  checkBackLaterText: { en: 'Check back later for new arrivals.', sv: 'Kom tillbaka senare för nya ankomster.', fi: 'Palaa myöhemmin katsomaan uutuuksia.', da: 'Vend tilbage senere for nye ankomster.' },
  newsletterSectionTitle: { en: 'Join the Vinthem Club', sv: 'Gå med i Vinthem Club', fi: 'Liity Vinthem Clubiin', da: 'Bliv medlem af Vinthem Club' },
  newsletterSectionSubtitle: { en: 'Subscribe to receive updates, access to exclusive deals, and more.', sv: 'Prenumerera för att få uppdateringar, tillgång till exklusiva erbjudanden och mer.', fi: 'Tilaa saadaksesi päivityksiä, pääsyn eksklusiivisiin tarjouksiin ja muuta.', da: 'Tilmeld dig for at modtage opdateringer, adgang till eksklusive tilbud og mere.' },
  newsletterPlaceholder: { en: 'Enter your email address', sv: 'Ange din e-postadress', fi: 'Anna sähköpostiosoitteesi', da: 'Indtast din e-mailadresse' },
  newsletterButtonText: { en: 'Subscribe', sv: 'Prenumerera', fi: 'Tilaa', da: 'Tilmeld' },
  newsletterLabel: { en: 'Newsletter', sv: 'Nyhetsbrev', fi: 'Uutiskirje', da: 'Nyhedsbrev' },
  addedToCartText: { en: 'added to cart', sv: 'lagd i varukorgen', fi: 'lisätty ostoskoriin', da: 'lagt i kurven' },
  futureProduct1Date: { en: 'Dropping May 2026', sv: 'Släpps maj 2026', fi: 'Julkaistaan toukokuussa 2026', da: 'Udgives maj 2026' },
  futureProduct1Title: { en: 'The Lounge Chair', sv: 'Loungestolen', fi: 'Lounge-tuoli', da: 'Lænestolen' },
  futureProduct2Date: { en: 'Dropping June 2026', sv: 'Släpps juni 2026', fi: 'Julkaistaan kesäkuussa 2026', da: 'Udgives juni 2026' },
  futureProduct2Title: { en: 'Minimalist Dining', sv: 'Minimalistisk matsal', fi: 'Minimalistinen ruokailu', da: 'Minimalistisk spisning' },
  futureViewAllText: { en: 'View All', sv: 'Visa Alla', fi: 'Näytä Kaikki', da: 'Vis Alle' },
  cartTitle: { en: 'Your Cart', sv: 'Din Kundvagn', fi: 'Ostoskori', da: 'Din Indkøbskurv' },
  cartEmptyMessage: { en: 'Looks like you haven\'t added anything to your cart yet. Discover our latest arrivals.', sv: 'Det ser ut som att du inte har lagt till något i din kundvagn än. Upptäck våra senaste nyheter.', fi: 'Näyttää siltä, ettet ole vielä lisännyt mitään ostoskoriisi. Tutustu uusimpiin tulokkaisiimme.', da: 'Det ser ud til, at du ikke har tilføjet noget til din indkøbskurv endnu. Oplev vores nyeste ankomster.' },
  paymentTitle: { en: 'Payment', sv: 'Betalning', fi: 'Maksu', da: 'Betaling' },
  calculatedAtCheckoutText: { en: 'Calculated at checkout', sv: 'Beräknas i kassan', fi: 'Lasketaan kassalla', da: 'Beregnes ved kassen' },
  footerDescription: { en: 'A Stockholm-based store with over 20 years of retail experience, focusing on small useful products people actually need.', sv: 'En Stockholmsbaserad butik med över 20 års erfarenhet, med fokus på små användbara produkter som folk faktiskt behöver.', fi: 'Tukholmalainen kauppa, jolla on yli 20 vuoden kokemus, keskittyen pieniin hyödyllisiin tuotteisiin, joita ihmiset todella tarvitsevat.', da: 'En Stockholms-baseret butik med over 20 års erfaring med fokus på små nyttige produkter, som folk rent faktisk har brug for.' },
  footerCopyright: { en: '© 2026 Vinthem. All rights reserved.', sv: '© 2026 Vinthem. Alla rättigheter reserverade.', fi: '© 2026 Vinthem. Kaikki oikeudet pidätetään.', da: '© 2026 Vinthem. Alle rettigheder forbeholdes.' },
  sitemapText: { en: 'Sitemap', sv: 'Sajtkarta', fi: 'Sivukartta', da: 'Sitemap', de: 'Sitemap' },
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
  searchDiscoverCollectionsText: { en: 'Discover Collections', sv: 'Upptäck kollektioner', fi: 'Tutustu kokoelmiin', da: 'Opdag kollektioner' },
  searchCollectionsResultsText: { en: 'Collections', sv: 'Kollektioner', fi: 'Kokoelmat', da: 'Kollektioner' },
  searchProductsResultsText: { en: 'Products', sv: 'Produkter', fi: 'Tuotteet', da: 'Produkter' },
  searchNoProductsResultsText: { en: 'No products found matching your search.', sv: 'Inga produkter matchade din sökning.', fi: 'Hakua vastaavia tuotteita ei löytynyt.', da: 'Ingen produkter matchede din søgning.' },
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
  savedAddressesText: { en: 'Saved Addresses', sv: 'Sparade adresser', fi: 'Tallennetut osoitteet', da: 'Gemte adresser' },
  fullNameLabel: { en: 'Full Name', sv: 'Fullständigt namn', fi: 'Koko nimi', da: 'Fulde navn' },
  phoneLabel: { en: 'Phone Number', sv: 'Telefonnummer', fi: 'Puhelinnumero', da: 'Telefonnummer' },
  addressLabel: { en: 'Address', sv: 'Adress', fi: 'Osoite', da: 'Adresse' },
  cityLabel: { en: 'City', sv: 'Stad', fi: 'Kaupunki', da: 'By' },
  postalCodeLabel: { en: 'Postal Code', sv: 'Postnummer', fi: 'Postinumero', da: 'Postnummer' },
  paymentDetailsText: { en: 'Payment Details', sv: 'Betalningsuppgifter', fi: 'Maksutiedot', da: 'Betalingsoplysninger' },
  getHelpText: { en: 'Get Help', sv: 'Få hjälp', fi: 'Pyydä apua', da: 'Få hjælp' },
  payText: { en: 'Pay', sv: 'Betala', fi: 'Maksa', da: 'Betal' },
  signInTitle: { en: 'Sign In', sv: 'Logga in', fi: 'Kirjaudu sisään', da: 'Log ind' },
  signUpTitle: { en: 'Sign Up', sv: 'Registrera dig', fi: 'Rekisteröidy', da: 'Tilmeld dig' },
  emailLabel: { en: 'Email', sv: 'E-post', fi: 'Sähköposti', da: 'E-mail' },
  passwordLabel: { en: 'Password', sv: 'Lösenord', fi: 'Salasana', da: 'Adgangskode' },
  forgotPasswordText: { en: 'Forgot Password?', sv: 'Glömt lösenord?', fi: 'Unohditko salasanan?', da: 'Glemt adgangskode?' },
  forgotPasswordTitle: { en: 'Reset Password', sv: 'Återställ lösenord', fi: 'Nollaa salasana', da: 'Nulstil adgangskode' },
  forgotPasswordSubtitle: { en: 'Enter your email address and we will send you a link to reset your password.', sv: 'Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.', fi: 'Anna sähköpostiosoitteesi، niin lähetämme linkin salasanan nollaamiseksi.', da: 'Indtast din e-mailadresse، og vi sender dig et link til at nulstille din adgangskode.' },
  sendResetLinkButtonText: { en: 'Send Reset Link', sv: 'Skicka återställningslänk', fi: 'Lähetä nollauslinkki', da: 'Send nulstillingslink' },
  backToLoginText: { en: 'Back to Login', sv: 'Tillbaka till inloggning', fi: 'Takaisin kirjautumiseen', da: 'Tilbage til login' },
  resetPasswordSentSuccessText: { en: 'Password reset link sent! Please check your email.', sv: 'Återställningslänk skickad! Kontrollera din e-post.', fi: 'Salasanan nollauslinkki lähetetty! Tarkista sähköpostisi.', da: 'Nulstillingslink sendt! Tjek venligst din e-mail.' },
  resetPasswordTitle: { en: 'Create New Password', sv: 'Skapa nytt lösenord', fi: 'Luo uusi salasana', da: 'Opret ny adgangskode' },
  newPasswordLabel: { en: 'New Password', sv: 'Nytt lösenord', fi: 'Uusi salasana', da: 'Ny adgangskode' },
  confirmNewPasswordLabel: { en: 'Confirm New Password', sv: 'Bekräfta nytt lösenord', fi: 'Vahvista uusi salasana', da: 'Bekræft ny adgangskode' },
  resetPasswordButtonText: { en: 'Update Password', sv: 'Uppdatera lösenord', fi: 'Päivitä salasana', da: 'Opdater adgangskode' },
  passwordResetSuccessText: { en: 'Password updated successfully! You can now sign in.', sv: 'Lösenordet har uppdaterats! Du kan nu logga in.', fi: 'Salasana päivitetty onnistuneesti! Voit nyt kirjautua sisään.', da: 'Adgangskode opdateret med succes! Du kan nu logge ind.' },
  dontHaveAccountText: { en: "Don't have an account?", sv: 'Har du inget konto?', fi: 'Eikö sinulla ole tiliä?', da: 'Har du ikke en konto?' },
  alreadyHaveAccountText: { en: 'Already have an account?', sv: 'Har du redan ett konto?', fi: 'Onko sinulla jo tili?', da: 'Har du allerede en konto?' },
  signInButtonText: { en: 'Sign In', sv: 'Logga in', fi: 'Kirjaudu sisään', da: 'Log ind' },
  signUpButtonText: { en: 'Sign Up', sv: 'Registrera dig', fi: 'Rekisteröidy', da: 'Tilmeld dig' },
  continueWithGoogleText: { en: 'Continue with Google', sv: 'Fortsätt med Google', fi: 'Jatka Googlella', da: 'Fortsæt med Google' },
  googleLoginUnavailableText: { en: 'Google sign-in is not available right now.', sv: 'Google-inloggning är inte tillgänglig just nu.', fi: 'Google-kirjautuminen ei ole juuri nyt käytettävissä.', da: 'Google-login er ikke tilgængelig lige nu.' },
  loginSuccessText: { en: 'Welcome back!', sv: 'Välkommen tillbaka!', fi: 'Tervetuloa takaisin!', da: 'Velkommen tilbage!' },
  accountCreatedSuccessText: { en: 'Account created successfully!', sv: 'Kontot skapades framgångsrikt!', fi: 'Tili luotu onnistuneesti!', da: 'Konto oprettet med succes!' },
  googleLoginSuccessText: { en: 'Logged in with Google!', sv: 'Inloggad med Google!', fi: 'Kirjauduttu Googlella!', da: 'Logget ind med Google!' },
  signUpTermsConsentText: { en: 'I agree to the', sv: 'Jag godkänner', fi: 'Hyväksyn', da: 'Jeg accepterer' },
  signUpPrivacyConsentText: { en: 'I have read the', sv: 'Jag har läst', fi: 'Olen lukenut', da: 'Jeg har läst' },
  signUpMarketingConsentText: { en: 'Email me about launches, editorial stories, and offers. You can unsubscribe at any time.', sv: 'Skicka mejl om lanseringar, redaktionella berättelser och erbjudanden. Du kan avsluta prenumerationen när som helst.', fi: 'Lähetä minulle sähköpostia julkaisuista, jutuista ja tarjouksista. Voit peruuttaa tilauksen milloin tahansa.', da: 'Send mig e-mails om lanceringer, historier og tilbud. Du kan afmelde dig når som helst.' },
  cookiePreferencesButtonText: { en: 'Cookie Preferences', sv: 'Cookie-inställningar', fi: 'Evästeasetukset', da: 'Cookieindstillinger' },
  unsubscribeLinkText: { en: 'Unsubscribe', sv: 'Avsluta prenumeration', fi: 'Peruuta tilaus', da: 'Afmeld' },
  consentBannerEyebrowText: { en: 'Privacy Controls', sv: 'Integritetsval', fi: 'Tietosuoja-asetukset', da: 'Privatlivsvalg' },
  consentBannerTitleText: { en: 'We only turn on analytics after you say yes.', sv: 'Vi aktiverar analys först efter ditt godkännande.', fi: 'Otamme analytiikan käyttöön vasta hyväksynnän jälkeen.', da: 'Vi aktiverer kun analyse efter dit samtykke.' },
  consentBannerDescriptionText: { en: 'Essential cookies keep checkout and login secure. Optional analytics helps us improve the store with PostHog and Microsoft Clarity. You can change this any time from the footer.', sv: 'Nödvändiga cookies håller kassan och inloggningen säker. Valfri analys hjälper oss att förbättra butiken med PostHog och Microsoft Clarity. Du kan ändra detta när som helst från sidfoten.', fi: 'Välttämättömät evästeet pitävät kassatoiminnot ja kirjautumisen turvallisina. Valinnainen analytiikka auttaa meitä kehittämään kauppaa PostHogin ja Microsoft Clarityn avulla. Voit muuttaa tätä milloin tahansa alatunnisteesta.', da: 'Nødvendige cookies holder checkout og login sikre. Valgfri analyse hjælper os med at forbedre butikken med PostHog og Microsoft Clarity. Du kan ændre dette når som helst fra footeren.' },
  consentPrivacyLinkText: { en: 'Privacy Policy', sv: 'Integritetspolicy', fi: 'Tietosuojakäytäntö', da: 'Privatlivspolitik' },
  consentCookieLinkText: { en: 'Cookie Policy', sv: 'Cookiepolicy', fi: 'Evästekäytäntö', da: 'Cookiepolitik' },
  consentChooseSettingsText: { en: 'Choose settings', sv: 'Välj inställningar', fi: 'Valitse asetukset', da: 'Vælg indstillinger' },
  consentAcceptAllText: { en: 'Accept all', sv: 'Acceptera alla', fi: 'Hyväksy kaikki', da: 'Accepter alle' },
  consentEssentialOnlyText: { en: 'Essential only', sv: 'Endast nödvändiga', fi: 'Vain välttämättömät', da: 'Kun nødvendige' },
  consentModalEyebrowText: { en: 'Cookie Preferences', sv: 'Cookie-inställningar', fi: 'Evästeasetukset', da: 'Cookieindstillinger' },
  consentModalTitleText: { en: 'Choose what we can use.', sv: 'Välj vad vi får använda.', fi: 'Valitse mitä saamme käyttää.', da: 'Vælg hvad vi må bruge.' },
  consentCloseText: { en: 'Close', sv: 'Stäng', fi: 'Sulje', da: 'Luk' },
  consentEssentialTitleText: { en: 'Essential cookies', sv: 'Nödvändiga cookies', fi: 'Välttämättömät evästeet', da: 'Nødvendige cookies' },
  consentEssentialDescriptionText: { en: 'Required for authentication, security, checkout, and basic storefront functionality.', sv: 'Krävs för autentisering, säkerhet, kassa och grundläggande butiksfunktioner.', fi: 'Vaaditaan tunnistautumiseen, turvallisuuteen, kassaan ja perustoimintoihin.', da: 'Kræves til autentificering, sikkerhed, checkout og grundlæggende butiksfunktioner.' },
  consentAlwaysOnText: { en: 'Always on', sv: 'Alltid på', fi: 'Aina käytössä', da: 'Altid aktiv' },
  consentAnalyticsTitleText: { en: 'Analytics', sv: 'Analys', fi: 'Analytiikka', da: 'Analyse' },
  consentAnalyticsDescriptionText: { en: 'Helps us understand navigation, drop-offs, and performance with PostHog and Clarity.', sv: 'Hjälper oss förstå navigation, avhopp och prestanda med PostHog och Clarity.', fi: 'Auttaa meitä ymmärtämään navigointia, poistumisia ja suorituskykyä PostHogin ja Clarityn avulla.', da: 'Hjælper os med at forstå navigation, frafald og performance med PostHog og Clarity.' },
  consentMarketingTitleText: { en: 'Marketing emails', sv: 'Marknadsföringsmejl', fi: 'Markkinointisähköpostit', da: 'Marketingmails' },
  consentMarketingDescriptionText: { en: 'Lets us remember that you want launch updates, product drops, and editorial emails.', sv: 'Låter oss komma ihåg att du vill ha lanseringar, produktsläpp och redaktionella mejl.', fi: 'Antaa meidän muistaa, että haluat julkaisuja, tuoteuutisia ja toimituksellisia sähköposteja.', da: 'Lader os huske, at du ønsker lanceringer, produktnyheder og redaktionelle mails.' },
  consentSavePreferencesText: { en: 'Save preferences', sv: 'Spara inställningar', fi: 'Tallenna asetukset', da: 'Gem indstillinger' },
  consentRejectOptionalText: { en: 'Reject optional', sv: 'Neka valfria', fi: 'Hylkää valinnaiset', da: 'Afvis valgfrie' },
  privacyPolicyPageTitle: { en: 'Privacy Policy', sv: 'Integritetspolicy', fi: 'Tietosuojakäytäntö', da: 'Privatlivspolitik' },
  privacyPolicyPageContent: { en: '# Privacy Policy\n\nWe collect only the information needed to process orders, support your account, and improve the store.\n\n## What we collect\n\n- Account details such as your name and email address\n- Order, shipping, and payment-related information\n- Support requests, returns, and review submissions\n- Optional analytics and marketing preferences when you consent\n\n## How we use your data\n\n- To process purchases and deliver orders\n- To provide customer support and manage refunds or returns\n- To prevent fraud, abuse, and security incidents\n- To improve the storefront experience and communications\n\n## Analytics and consent\n\nWe only enable optional analytics tools such as PostHog and Microsoft Clarity after you give consent. You can change your preferences at any time from the footer cookie settings.\n\n## Marketing emails\n\nIf you opt in, we may send product news, launches, and editorial updates. Every email includes an unsubscribe option.\n\n## Your rights\n\nDepending on your location, you may request access, correction, deletion, or restriction of your personal data.\n\n## Contact\n\nIf you have questions about privacy, please contact support through the store.', sv: '# Integritetspolicy\n\nVi samlar endast in den information som behövs för att behandla beställningar, hantera ditt konto och förbättra butiken.\n\n## Vad vi samlar in\n\n- Kontouppgifter som namn och e-postadress\n- Order-, leverans- och betalningsrelaterad information\n- Supportärenden, returer och recensioner\n- Valfria analys- och marknadsföringsinställningar när du samtycker\n\n## Hur vi använder dina uppgifter\n\n- För att behandla köp och leverera beställningar\n- För att ge kundsupport och hantera returer eller återbetalningar\n- För att förebygga bedrägeri, missbruk och säkerhetsincidenter\n- För att förbättra butiksupplevelsen och kommunikationen\n\n## Analys och samtycke\n\nVi aktiverar endast valfria analysverktyg som PostHog och Microsoft Clarity efter att du har gett samtycke. Du kan ändra dina inställningar när som helst via cookieinställningarna i sidfoten.\n\n## Marknadsföringsmejl\n\nOm du samtycker kan vi skicka produktnyheter, lanseringar och redaktionella uppdateringar. Varje mejl innehåller en länk för att avsluta prenumerationen.\n\n## Dina rättigheter\n\nBeroende på var du befinner dig kan du begära tillgång, rättelse, radering eller begränsning av dina personuppgifter.\n\n## Kontakt\n\nOm du har frågor om integritet, kontakta supporten via butiken.', fi: '# Tietosuojakäytäntö\n\nKeräämme vain tiedot, joita tarvitaan tilausten käsittelyyn, tilisi hallintaan ja kaupan parantamiseen.\n\n## Mitä keräämme\n\n- Tilitiedot, kuten nimi ja sähköpostiosoite\n- Tilaus-, toimitus- ja maksutiedot\n- Tukipyynnöt, palautukset ja arvostelut\n- Valinnaiset analytiikka- ja markkinointiasetukset suostumuksesi perusteella\n\n## Miten käytämme tietojasi\n\n- Ostosten käsittelyyn ja tilausten toimittamiseen\n- Asiakastuen sekä palautusten ja hyvitysten hoitamiseen\n- Petosten, väärinkäytösten ja turvallisuusongelmien ehkäisyyn\n- Kaupan käyttökokemuksen ja viestinnän parantamiseen\n\n## Analytiikka ja suostumus\n\nOtamme käyttöön valinnaiset analytiikkatyökalut, kuten PostHogin ja Microsoft Clarityn, vasta suostumuksesi jälkeen. Voit muuttaa asetuksia milloin tahansa alatunnisteen evästeasetuksista.\n\n## Markkinointisähköpostit\n\nJos annat luvan, voimme lähettää tuoteuutisia, julkaisuja ja toimituksellisia päivityksiä. Jokaisessa viestissä on peruutuslinkki.\n\n## Oikeutesi\n\nSijainnistasi riippuen voit pyytää pääsyä tietoihin, niiden korjaamista, poistamista tai käsittelyn rajoittamista.\n\n## Yhteys\n\nJos sinulla on tietosuojaan liittyviä kysymyksiä, ota yhteyttä tukeen kaupan kautta.', da: '# Privatlivspolitik\n\nVi indsamler kun de oplysninger, der er nødvendige for at behandle ordrer, administrere din konto og forbedre butikken.\n\n## Hvad vi indsamler\n\n- Kontooplysninger som navn og e-mailadresse\n- Ordre-, leverings- og betalingsrelaterede oplysninger\n- Supporthenvendelser, returneringer og anmeldelser\n- Valgfrie analyse- og marketingpræferencer når du giver samtykke\n\n## Hvordan vi bruger dine data\n\n- Til at behandle køb og levere ordrer\n- Til at yde kundesupport og håndtere returneringer eller refunderinger\n- Til at forhindre svindel, misbrug og sikkerhedshændelser\n- Til at forbedre butiksoplevelsen og kommunikationen\n\n## Analyse og samtykke\n\nVi aktiverer kun valgfrie analyseværktøjer som PostHog og Microsoft Clarity efter dit samtykke. Du kan ændre dine præferencer når som helst via cookieindstillingerne i footeren.\n\n## Marketingmails\n\nHvis du tilmelder dig, kan vi sende produktnyheder, lanceringer og redaktionelle opdateringer. Hver mail indeholder en afmeldingsmulighed.\n\n## Dine rettigheder\n\nAfhængigt af hvor du befinder dig, kan du anmode om adgang, rettelse, sletning eller begrænsning af dine personoplysninger.\n\n## Kontakt\n\nHvis du har spørgsmål om privatliv, kontakt support gennem butikken.' },
  cookiePolicyPageTitle: { en: 'Cookie Policy', sv: 'Cookiepolicy', fi: 'Evästekäytäntö', da: 'Cookiepolitik' },
  cookiePolicyPageContent: { en: '# Cookie Policy\n\nWe use cookies and similar technologies to keep the store secure and working properly.\n\n## Essential cookies\n\nEssential cookies support login sessions, carts, checkout, fraud prevention, and language or preference memory.\n\n## Optional analytics cookies\n\nIf you allow analytics, we may use tools such as PostHog and Microsoft Clarity to understand how visitors use the store and where the experience can be improved.\n\n## Managing your preferences\n\nYou can accept or reject optional cookies from the consent banner and reopen those settings at any time from the footer.\n\n## Marketing preferences\n\nMarketing email consent is stored separately from analytics preferences. You can unsubscribe from marketing emails at any time.\n\n## Contact\n\nIf you need more details, review our privacy policy or contact support.', sv: '# Cookiepolicy\n\nVi använder cookies och liknande teknik för att hålla butiken säker och fungerande.\n\n## Nödvändiga cookies\n\nNödvändiga cookies stödjer inloggning, kundvagn, kassa, bedrägeriskydd och språk- eller preferensminne.\n\n## Valfria analyscookies\n\nOm du tillåter analys kan vi använda verktyg som PostHog och Microsoft Clarity för att förstå hur besökare använder butiken och var upplevelsen kan förbättras.\n\n## Hantera dina inställningar\n\nDu kan acceptera eller neka valfria cookies från samtyckesbannern och öppna inställningarna igen när som helst från sidfoten.\n\n## Marknadsföringsinställningar\n\nSamtycke till marknadsföringsmejl lagras separat från analysinställningar. Du kan avsluta prenumerationen när som helst.\n\n## Kontakt\n\nOm du behöver mer information, läs vår integritetspolicy eller kontakta support.', fi: '# Evästekäytäntö\n\nKäytämme evästeitä ja vastaavia tekniikoita pitääksemme kaupan turvallisena ja toimivana.\n\n## Välttämättömät evästeet\n\nVälttämättömät evästeet tukevat kirjautumista, ostoskoria, kassaa, petostentorjuntaa sekä kieli- ja valintamuistia.\n\n## Valinnaiset analytiikkaevästeet\n\nJos sallit analytiikan, voimme käyttää työkaluja kuten PostHogia ja Microsoft Claritya ymmärtääksemme käyttöä ja parantaaksemme kokemusta.\n\n## Asetusten hallinta\n\nVoit hyväksyä tai hylätä valinnaiset evästeet suostumusbannerista ja avata asetukset uudelleen milloin tahansa alatunnisteesta.\n\n## Markkinointiasetukset\n\nMarkkinointisähköpostien suostumus tallennetaan erillään analytiikka-asetuksista. Voit peruuttaa markkinointiviestit milloin tahansa.\n\n## Yhteys\n\nJos tarvitset lisätietoja, tutustu tietosuojakäytäntöön tai ota yhteyttä tukeen.', da: '# Cookiepolitik\n\nVi bruger cookies og lignende teknologier for at holde butikken sikker og velfungerende.\n\n## Nødvendige cookies\n\nNødvendige cookies understøtter login, kurv, checkout, svindelforebyggelse samt hukommelse for sprog og præferencer.\n\n## Valgfrie analysecookies\n\nHvis du tillader analyse, kan vi bruge værktøjer som PostHog og Microsoft Clarity til at forstå, hvordan besøgende bruger butikken, og hvor oplevelsen kan forbedres.\n\n## Håndtering af dine præferencer\n\nDu kan acceptere eller afvise valgfrie cookies fra samtykkebanneret og åbne indstillingerne igen når som helst fra footeren.\n\n## Marketing præferencer\n\nSamtykke til marketingmails gemmes separat fra analysepræferencer. Du kan afmelde marketingmails når som helst.\n\n## Kontakt\n\nHvis du har brug for flere detaljer, så læs vores privatlivspolitik eller kontakt support.' },
  termsOfServicePageTitle: { en: 'Terms of Service', sv: 'Användarvillkor', fi: 'Käyttöehdot', da: 'Vilkår' },
  termsOfServicePageContent: { en: '# Terms of Service\n\nBy creating an account or placing an order, you agree to use the store lawfully and to provide accurate information.\n\n## Accounts\n\n- Keep your login credentials secure.\n- You are responsible for activity under your account.\n- We may suspend accounts involved in abuse, fraud, or unlawful use.\n\n## Orders and payments\n\n- Prices, taxes, and shipping are confirmed during checkout.\n- Orders may be delayed, cancelled, or refused in cases of fraud, stock issues, or payment problems.\n\n## Returns and support\n\nOur shipping, returns, and privacy pages explain the latest support and refund process.\n\n## Intellectual property\n\nStore content, product imagery, branding, and editorial material may not be copied or reused without permission.\n\n## Contact\n\nIf you have questions about these terms, please contact support through the store.', sv: '# Användarvillkor\n\nGenom att skapa ett konto eller lägga en beställning godkänner du att använda butiken lagligt och att lämna korrekta uppgifter.\n\n## Konton\n\n- Skydda dina inloggningsuppgifter.\n- Du ansvarar för aktivitet på ditt konto.\n- Vi kan stänga av konton som används för missbruk, bedrägeri eller olaglig användning.\n\n## Beställningar och betalning\n\n- Priser, skatter och frakt bekräftas i kassan.\n- Beställningar kan försenas, avbrytas eller nekas vid bedrägeri, lagerproblem eller betalningsfel.\n\n## Returer och support\n\nVåra sidor för frakt, returer och integritet beskriver den aktuella processen för support och återbetalningar.\n\n## Immateriella rättigheter\n\nButikens innehåll, produktbilder, varumärke och redaktionellt material får inte kopieras eller återanvändas utan tillstånd.\n\n## Kontakt\n\nOm du har frågor om villkoren, kontakta supporten via butiken.', fi: '# Käyttöehdot\n\nLuomalla tilin tai tekemällä tilauksen hyväksyt kaupan laillisen käytön ja oikeiden tietojen antamisen.\n\n## Tilit\n\n- Suojaa kirjautumistietosi.\n- Vastaat tililläsi tapahtuvasta toiminnasta.\n- Voimme keskeyttää väärinkäyttöön, petokseen tai laittomaan käyttöön liittyvät tilit.\n\n## Tilaukset ja maksut\n\n- Hinnat, verot ja toimituskulut vahvistetaan kassalla.\n- Tilauksia voidaan viivästyttää, peruuttaa tai hylätä petoksen, varasto-ongelmien tai maksuhäiriöiden vuoksi.\n\n## Palautukset ja tuki\n\nToimitus-, palautus- ja tietosuojasivut kuvaavat ajantasaisen tuen ja hyvitysprosessin.\n\n## Immateriaalioikeudet\n\nKaupan sisältöä, tuotekuvia, brändiä ja toimituksellista materiaalia ei saa kopioida tai käyttää uudelleen ilman lupaa.\n\n## Yhteys\n\nJos sinulla on kysyttävää ehdoista, ota yhteyttä tukeen kaupan kautta.', da: '# Vilkår\n\nVed at oprette en konto eller afgive en ordre accepterer du at bruge butikken lovligt og at give korrekte oplysninger.\n\n## Konti\n\n- Beskyt dine loginoplysninger.\n- Du er ansvarlig for aktivitet på din konto.\n- Vi kan suspendere konti involveret i misbrug, svindel eller ulovlig brug.\n\n## Ordrer og betaling\n\n- Priser, skatter og fragt bekræftes ved checkout.\n- Ordrer kan blive forsinket, annulleret eller afvist ved svindel, lagerproblemer eller betalingsfejl.\n\n## Returnering og support\n\nVores sider om fragt, returnering og privatliv forklarer den aktuelle support- og refunderingsproces.\n\n## Immaterielle rettigheder\n\nButikkens indhold, produktbilder, branding og redaktionelt materiale må ikke kopieres eller genbruges uden tilladelse.\n\n## Kontakt\n\nHvis du har spørgsmål om vilkårene, så kontakt support gennem butikken.' },
  linkCopiedText: { en: 'Link copied to clipboard', sv: 'Länken kopierad', fi: 'Linkki kopioitu', da: 'Link kopieret' },
  googleAuthEnabled: true,
  authBackgroundImage: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2832&auto=format&fit=crop',
  productNotFoundText: { en: 'Product not found', sv: 'Produkten hittades inte', fi: 'Tuotetta ei löytynyt', da: 'Produktet blev ikke fundet' },
  backToStoreText: { en: 'Back to Store', sv: 'Tillbaka till butiken', fi: 'Takaisin kauppaan', da: 'Tilbage til butikken' },
  accountTitleText: { en: 'Your Account', sv: 'Ditt konto', fi: 'Tilisi', da: 'Din konto' },
  accountDescriptionText: { en: 'Manage your orders, profile details, and shipping addresses in one place.', sv: 'Hantera dina beställningar, profiluppgifter och leveransadresser på ett ställe.', fi: 'Hallitse tilauksiasi, profiilitietojasi ja toimitusosoitteitasi yhdessä paikassa.', da: 'Administrer dine ordrer, profiloplysninger og forsendelsesadresser på ét sted.' },
  ordersText: { en: 'Orders', sv: 'Beställningar', fi: 'Tilaukset', da: 'Ordrer' },
  supportText: { en: 'Support', sv: 'Support', fi: 'Tuki', da: 'Support' },
  profileText: { en: 'Profile', sv: 'Profil', fi: 'Profiili', da: 'Profil' },
  addressesText: { en: 'Addresses', sv: 'Adresser', fi: 'Osoitteet', da: 'Adresser' },
  totalSuffixText: { en: 'TOTAL', sv: 'TOTALT', fi: 'YHTEENSÄ', da: 'TOTAL' },
  noOrdersYetText: { en: 'No orders yet', sv: 'Inga beställningar än', fi: 'Ei vielä tilauksia', da: 'Ingen ordrer endnu' },
  noOrdersDescriptionText: { en: "You haven't placed any orders yet. Start exploring our collection.", sv: 'Du har inte lagt några beställningar än. Börja utforska vår kollektion.', fi: 'Et ole vielä tehnyt tilauksia. Aloita mallistoomme tutustuminen.', da: 'Du har ikke afgivet nogen ordrer endnu. Begynd at udforske vores kollektion.' },
  noSupportActivityYetText: { en: 'No support activity yet', sv: 'Ingen supportaktivitet än', fi: 'Ei vielä tukipyyntöjä', da: 'Ingen supportaktivitet endnu' },
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
  threadsText: { en: 'Threads', sv: 'Threads', fi: 'Threads', da: 'Threads' },
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
  colorNavyText: { en: 'Navy', sv: 'Marinblå', fi: 'Tummansininen', da: 'Marinblå' },
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
  userAlreadyExistsErrorText: { en: 'An account with this email already exists. Please sign in instead.', sv: 'Ett konto med denna e-postadress finns redan. Vänligen logga in istället.', fi: 'Tämä sähköpostiosoite on jo käytössä. Kirjaudu sisään sen sijaan.', da: 'En konto med denne e-mail findes allerede. Log venligst ind i stedet.' },
  rateLimitWaitErrorText: { en: 'Please wait before requesting another code.', sv: 'Vänligen vänta innan du begär en ny kod.', fi: 'Odota hetki ennen uuden koodین pyytämistä.', da: 'Vent venligst før du anmoder om en ny kode.' },
  invalidOtpErrorText: { en: 'Invalid or expired code. Please try again.', sv: 'Ogiltig eller utgången kod. Vänligen försök igen.', fi: 'Virheellinen tai vanhentunut koodi. Yritä uudelleen.', da: 'Ugyldig eller udløbet kode. Prøv venligst igen.' },
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
  journalSubtitleText: { en: 'Stories, inspiration, and insights on the products that make everyday life better.', sv: 'Berättelser, inspiration och insikter om produkterna som gör vardagen bättre.', fi: 'Tarinoita, inspiraatiota ja oivalluksia tuotteista, jotka tekevät arjesta parempaa.', da: 'Historier, inspiration og indsigt i de produkter, der gør hverdagen bedre.' },
  noJournalEntriesText: { en: 'No journal entries found. Check back later.', sv: 'Inga journalanteckningar hittades. Kom tillbaka senare.', fi: 'Journal-merkintöjä ei löytynyt. Palaa myöhemmin.', da: 'Ingen journalposter fundet. Vend tilbage senere.' },
  checkBackLaterJournalText: { en: 'Check back later for new stories.', sv: 'Kom tillbaka senare för nya berättelser.', fi: 'Palaa myöhemmin katsomaan uusia tarinoita.', da: 'Vend tilbage senare for nye historier.' },
  readArticleText: { en: 'Read Article', sv: 'Läs artikeln', fi: 'Lue artikkeli', da: 'Læs artiklen' },
  byAuthorText: { en: 'By', sv: 'Av', fi: 'Kirjoittaja', da: 'Af' },
  backToJournalText: { en: 'Back to Journal', sv: 'Tillbaka till journalen', fi: 'Takaisin journaliin', da: 'Tillbage til journalen' },
  articleNotFoundText: { en: 'Article not found', sv: 'Artikeln hittades inte', fi: 'Artikkelia ei löytynyt', da: 'Artiklen blev ikke fundet' },
  loadingPageText: { en: 'Loading page...', sv: 'Laddar sida...', fi: 'Ladataan sivua...', da: 'Indlæser side...' },
  pageNotFoundTitleText: { en: 'Page Not Found', sv: 'Sidan hittades inte', fi: 'Sivua ei löytynyt', da: 'Siden blev ikke fundet' },
  pageNotFoundDescriptionText: { en: "The page you are looking for doesn't exist or has been moved.", sv: 'Sidan du letar efter finns inte eller har flyttats.', fi: 'Etsimääsi sivua ei ole olemassa tai se on siirretty.', da: 'Siden, du leder efter, eksisterer ikke eller er blevet flyttet.' },
  returnHomeButtonText: { en: 'Return Home', sv: 'Tillbaka till hem', fi: 'Palaa kotiin', da: 'Vend hjem' },
  homeBreadcrumbText: { en: 'Home', sv: 'Hem', fi: 'Koti', da: 'Hjem' },
  lastUpdatedText: { en: 'Last updated', sv: 'Senast uppdaterad', fi: 'Viimeksi päivitetty', da: 'Sidst opdateret' },
  socialInstagram: '#',
  socialTikTok: '#',
  socialFacebook: '',
  socialThreads: '',
  navbarLinks: [
    { label: { en: 'Shop', sv: 'Handla', fi: 'Kauppa', da: 'Shop' }, href: '/products' },
    { label: { en: 'Journal', sv: 'Journal', fi: 'Journali', da: 'Journal' }, href: '/blog' },
    { label: { en: 'Our Story', sv: 'Vår Historia', fi: 'Tarina', da: 'Vores Historie' }, href: '/p/about' }
  ],
  footerSections: [
    {
      title: { en: 'Shop', sv: 'Handla', fi: 'Kauppa', da: 'Shop' },
      links: [
        { label: { en: 'New Arrivals', sv: 'Nyheter', fi: 'Uutuudet', da: 'Nyheder' }, href: '/products' },
        { label: { en: 'Journal', sv: 'Journal', fi: 'Journali', da: 'Journal' }, href: '/blog' },
        { label: { en: 'Our Story', sv: 'Vår Historia', fi: 'Tarina', da: 'Vores Historie' }, href: '/p/about' }
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
  languages: ['en', 'sv', 'fi', 'da', 'de'],
  quickAddText: { en: 'Quick Add', sv: 'Snabbköp', fi: 'Pikaostos', da: 'Hurtigkøb' },
  noPagesYetText: { en: 'No pages yet', sv: 'Inga sidor ännu', fi: 'Ei sivuja vielä', da: 'Ingen sider endnu' },
  noPagesDescriptionText: { en: 'Add a page manually or seed default pages to get started.', sv: 'Lägg till en sida manuellt eller fyll på med standardsidor för att komma igång.', fi: 'Lisää sivu manuaalisesti tai siemenellä oletussivuja aloittaaksesi.', da: 'Tilføj en side manuelt eller så standardsider for at komme i gang.' },
  inventoryTitleText: { en: 'Pricing & Inventory', sv: 'Pris & Inventarier', fi: 'Hinnoittelu & Varasto', da: 'Prisfastsættelse & Lager' },
  regularPriceText: { en: 'Regular Price (SEK)', sv: 'Ordinarie pris (SEK)', fi: 'Normaalihinta (SEK)', da: 'Normalpris (SEK)' },
  salePriceText: { en: 'Sale Price (SEK)', sv: 'Reapris (SEK)', fi: 'Alennushinta (SEK)', da: 'Udsalgspris (SEK)' },
  skuCodeText: { en: 'SKU Code', sv: 'SKU-kod', fi: 'SKU-koodi', da: 'SKU-kode' },
  initialStockText: { en: 'Initial Stock', sv: 'Initialt lager', fi: 'Alkuvarasto', da: 'Startlager' },
  weightKgText: { en: 'Weight (kg)', sv: 'Vikt (kg)', fi: 'Paino (kg)', da: 'Vægt (kg)' },
  shippingClassText: { en: 'Shipping Class', sv: 'Fraktklass', fi: 'Toimitusluokka', da: 'Forsendelsesklasse' },
  invalidLoginErrorText: { 
    en: 'Invalid email or password.', 
    sv: 'Ogiltig e-post eller lösenord.', 
    fi: 'Virheellinen sähköposti tai salasana.', 
    da: 'Ugyldig e-mail eller adgangskode.' 
  },
  otpTitle: { en: 'Verify your email', sv: 'Bekräfta din e-post', fi: 'Vahvista sähköpostisi', da: 'Bekræft din e-mail' },
  otpSubtitle: { en: "We've sent an 8-digit code to", sv: 'Vi har skickat en 8-siffrig kod till', fi: 'Olemme lähettäneet 8-numeroisen koodin osoitteeseen', da: 'Vi har sendt en 8-cifret kode til' },
  otpCheckSpam: { en: "Don't see it? Please check your spam folder.", sv: 'Ser du det inte? Kontrollera din skräppostmapp.', fi: 'Etkö näe sitä? Tarkista roskapostikansiosi.', da: 'Kan du ikke se den? Tjek venligst din spam-mappe.' },
  otpVerifyButton: { en: 'Verify & Continue', sv: 'Verifiera och fortsätt', fi: 'Vahvista ja jatka', da: 'Bekræft og fortsæt' },
  otpClearButton: { en: 'Clear and try again', sv: 'Rensa och försök igen', fi: 'Tyhjennä ja yritä uudelleen', da: 'Ryd og prøv igen' },
  shippingCountries: [
    { code: 'SE', name: { en: 'Sweden', sv: 'Sverige', fi: 'Ruotsi', da: 'Sverige' } },
    { code: 'FI', name: { en: 'Finland', sv: 'Finland', fi: 'Suomi', da: 'Finland' } },
    { code: 'DK', name: { en: 'Denmark', sv: 'Danmark', fi: 'Tanska', da: 'Danmark' } },
    { code: 'NO', name: { en: 'Norway', sv: 'Norge', fi: 'Norja', da: 'Norge' } },
    { code: 'IS', name: { en: 'Iceland', sv: 'Island', fi: 'Islanti', da: 'Island' } },
  ],
  finalizeAccountTitle: { 
    en: 'Finalize Account', 
    sv: 'Slutför konto', 
    fi: 'Viimeistele tili', 
    da: 'Færdiggør konto' 
  },
  finalizeAccountSubtitle: { 
    en: 'Please confirm your legal preferences to continue.', 
    sv: 'Vänligen bekräfta dina juridiska inställningar för att fortsätta.',
    fi: 'Vahvista oikeudelliset asetuksesi jatkaaksesi.',
    da: 'Bekræft venligst dine juridiske præferencer for at fortsætte.'
  },
  continueToStripeText: {
    en: 'Continue to Checkout',
    sv: 'Fortsätt till kassan',
    fi: 'Jatka kassalle',
    da: 'Fortsæt til udtjekning'
  }
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  settingsLoaded: false,
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
  setSettingsLoaded: (loaded) => set({ settingsLoaded: loaded }),
}));
