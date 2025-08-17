import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ListingDetailPage extends BasePage {
  // Main content locators
  readonly pageTitle: Locator;
  readonly imageGallery: Locator;
  readonly mainImage: Locator;
  readonly thumbnails: Locator;
  readonly priceTag: Locator;
  readonly pricePerSqm: Locator;
  readonly address: Locator;
  readonly district: Locator;
  readonly description: Locator;
  readonly postedDate: Locator;
  readonly listingId: Locator;

  // Property details
  readonly bedroomsCount: Locator;
  readonly bathroomsCount: Locator;
  readonly areaSize: Locator;
  readonly floorInfo: Locator;
  readonly furnishedBadge: Locator;
  readonly petsAllowedBadge: Locator;
  readonly parkingBadge: Locator;
  readonly balconyBadge: Locator;

  // Amenities
  readonly amenitiesSection: Locator;
  readonly amenityItems: Locator;

  // Contact section
  readonly contactSection: Locator;
  readonly phoneNumber: Locator;
  readonly whatsappButton: Locator;
  readonly telegramButton: Locator;
  readonly emailButton: Locator;
  readonly contactForm: Locator;
  readonly contactNameInput: Locator;
  readonly contactEmailInput: Locator;
  readonly contactMessageInput: Locator;
  readonly sendMessageButton: Locator;

  // Map section
  readonly locationMap: Locator;
  readonly mapMarker: Locator;
  readonly nearbyPlaces: Locator;

  // Actions
  readonly saveButton: Locator;
  readonly shareButton: Locator;
  readonly reportButton: Locator;
  readonly backButton: Locator;
  readonly similarListingsSection: Locator;
  readonly similarListingCards: Locator;

  constructor(page: Page) {
    super(page);

    // Main content
    this.pageTitle = page.getByRole('heading', { level: 1 });
    this.imageGallery = page.getByTestId('image-gallery');
    this.mainImage = page.getByTestId('main-image');
    this.thumbnails = page.getByTestId('thumbnail-image');
    this.priceTag = page.getByTestId('listing-price');
    this.pricePerSqm = page.getByTestId('price-per-sqm');
    this.address = page.getByTestId('listing-address');
    this.district = page.getByTestId('listing-district');
    this.description = page.getByTestId('listing-description');
    this.postedDate = page.getByTestId('posted-date');
    this.listingId = page.getByTestId('listing-id');

    // Property details
    this.bedroomsCount = page.getByTestId('bedrooms-count');
    this.bathroomsCount = page.getByTestId('bathrooms-count');
    this.areaSize = page.getByTestId('area-size');
    this.floorInfo = page.getByTestId('floor-info');
    this.furnishedBadge = page.getByTestId('furnished-badge');
    this.petsAllowedBadge = page.getByTestId('pets-allowed-badge');
    this.parkingBadge = page.getByTestId('parking-badge');
    this.balconyBadge = page.getByTestId('balcony-badge');

    // Amenities
    this.amenitiesSection = page.getByTestId('amenities-section');
    this.amenityItems = page.getByTestId('amenity-item');

    // Contact
    this.contactSection = page.getByTestId('contact-section');
    this.phoneNumber = page.getByTestId('phone-number');
    this.whatsappButton = page.getByRole('button', { name: /whatsapp/i });
    this.telegramButton = page.getByRole('button', { name: /telegram/i });
    this.emailButton = page.getByRole('button', { name: /email/i });
    this.contactForm = page.getByTestId('contact-form');
    this.contactNameInput = page.getByLabel(/name/i);
    this.contactEmailInput = page.getByLabel(/email/i);
    this.contactMessageInput = page.getByLabel(/message/i);
    this.sendMessageButton = page.getByRole('button', { name: /send.*message/i });

    // Map
    this.locationMap = page.getByTestId('location-map');
    this.mapMarker = page.locator('.leaflet-marker-icon, [role="img"][aria-label*="Map pin"]');
    this.nearbyPlaces = page.getByTestId('nearby-places');

    // Actions
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.shareButton = page.getByRole('button', { name: /share/i });
    this.reportButton = page.getByRole('button', { name: /report/i });
    this.backButton = page.getByRole('button', { name: /back/i });
    this.similarListingsSection = page.getByTestId('similar-listings');
    this.similarListingCards = page.getByTestId('similar-listing-card');
  }

  /**
   * Navigate to listing detail page
   */
  async goto(listingId: string) {
    await this.navigate(`/listings/${listingId}`);
    await this.waitForPageLoad();
  }

  /**
   * Get listing title
   */
  async getTitle(): Promise<string> {
    return await this.getTextContent(this.pageTitle);
  }

  /**
   * Get price information
   */
  async getPriceInfo(): Promise<{
    price: string;
    pricePerSqm: string;
  }> {
    return {
      price: await this.getTextContent(this.priceTag),
      pricePerSqm: await this.getTextContent(this.pricePerSqm)
    };
  }

  /**
   * Get location information
   */
  async getLocationInfo(): Promise<{
    address: string;
    district: string;
  }> {
    return {
      address: await this.getTextContent(this.address),
      district: await this.getTextContent(this.district)
    };
  }

  /**
   * Get property details
   */
  async getPropertyDetails(): Promise<{
    bedrooms: string;
    bathrooms: string;
    area: string;
    floor: string;
  }> {
    return {
      bedrooms: await this.getTextContent(this.bedroomsCount),
      bathrooms: await this.getTextContent(this.bathroomsCount),
      area: await this.getTextContent(this.areaSize),
      floor: await this.getTextContent(this.floorInfo)
    };
  }

  /**
   * Check property features
   */
  async getPropertyFeatures(): Promise<{
    furnished: boolean;
    petsAllowed: boolean;
    parking: boolean;
    balcony: boolean;
  }> {
    return {
      furnished: await this.isVisible(this.furnishedBadge),
      petsAllowed: await this.isVisible(this.petsAllowedBadge),
      parking: await this.isVisible(this.parkingBadge),
      balcony: await this.isVisible(this.balconyBadge)
    };
  }

  /**
   * Get description
   */
  async getDescription(): Promise<string> {
    return await this.getTextContent(this.description);
  }

  /**
   * Get posted date
   */
  async getPostedDate(): Promise<string> {
    return await this.getTextContent(this.postedDate);
  }

  /**
   * Get listing ID
   */
  async getListingId(): Promise<string> {
    return await this.getTextContent(this.listingId);
  }

  /**
   * Get number of images
   */
  async getImagesCount(): Promise<number> {
    return await this.thumbnails.count();
  }

  /**
   * Click on thumbnail image
   */
  async clickThumbnail(index: number) {
    await this.thumbnails.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate through gallery
   */
  async navigateGallery(direction: 'next' | 'prev') {
    const button = this.page.getByRole('button', { 
      name: direction === 'next' ? /next/i : /prev/i 
    });
    await this.clickWhenReady(button);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get amenities list
   */
  async getAmenities(): Promise<string[]> {
    return await this.getAllTextContent(this.amenityItems);
  }

  /**
   * Check if amenity exists
   */
  async hasAmenity(amenity: string): Promise<boolean> {
    const amenities = await this.getAmenities();
    return amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()));
  }

  /**
   * Get phone number
   */
  async getPhoneNumber(): Promise<string> {
    return await this.getTextContent(this.phoneNumber);
  }

  /**
   * Click WhatsApp button
   */
  async clickWhatsApp() {
    await this.clickWhenReady(this.whatsappButton);
  }

  /**
   * Click Telegram button
   */
  async clickTelegram() {
    await this.clickWhenReady(this.telegramButton);
  }

  /**
   * Click Email button
   */
  async clickEmail() {
    await this.clickWhenReady(this.emailButton);
  }

  /**
   * Fill and send contact form
   */
  async sendContactMessage(name: string, email: string, message: string) {
    await this.fillInput(this.contactNameInput, name);
    await this.fillInput(this.contactEmailInput, email);
    await this.fillInput(this.contactMessageInput, message);
    await this.clickWhenReady(this.sendMessageButton);
    
    // Wait for success message
    await this.page.waitForSelector('[data-testid="success-message"]');
  }

  /**
   * Save listing to favorites
   */
  async saveToFavorites() {
    await this.clickWhenReady(this.saveButton);
    await expect(this.saveButton).toHaveAttribute('data-saved', 'true');
  }

  /**
   * Check if listing is saved
   */
  async isSaved(): Promise<boolean> {
    const saved = await this.saveButton.getAttribute('data-saved');
    return saved === 'true';
  }

  /**
   * Share listing
   */
  async shareListing() {
    await this.clickWhenReady(this.shareButton);
    // Wait for share modal or copy confirmation
    await this.page.waitForSelector('[data-testid="share-modal"], [data-testid="link-copied"]');
  }

  /**
   * Report listing
   */
  async reportListing(reason: string) {
    await this.clickWhenReady(this.reportButton);
    const modal = this.page.getByRole('dialog');
    await modal.waitFor({ state: 'visible' });
    
    const reasonSelect = modal.getByLabel(/reason/i);
    await this.selectOption(reasonSelect, reason);
    
    const submitButton = modal.getByRole('button', { name: /submit/i });
    await this.clickWhenReady(submitButton);
    
    await modal.waitFor({ state: 'hidden' });
  }

  /**
   * Go back to listings
   */
  async goBack() {
    await this.clickWhenReady(this.backButton);
  }

  /**
   * Check if map is displayed
   */
  async isMapDisplayed(): Promise<boolean> {
    return await this.isVisible(this.locationMap);
  }

  /**
   * Get nearby places
   */
  async getNearbyPlaces(): Promise<string[]> {
    const places = this.nearbyPlaces.locator('[data-testid="nearby-place"]');
    return await this.getAllTextContent(places);
  }

  /**
   * Get similar listings count
   */
  async getSimilarListingsCount(): Promise<number> {
    return await this.similarListingCards.count();
  }

  /**
   * Click on similar listing
   */
  async clickSimilarListing(index: number) {
    await this.similarListingCards.nth(index).click();
  }

  /**
   * Check if all required sections are present
   */
  async hasAllRequiredSections(): Promise<{
    gallery: boolean;
    details: boolean;
    amenities: boolean;
    contact: boolean;
    map: boolean;
    similar: boolean;
  }> {
    return {
      gallery: await this.isVisible(this.imageGallery),
      details: await this.isVisible(this.bedroomsCount),
      amenities: await this.isVisible(this.amenitiesSection),
      contact: await this.isVisible(this.contactSection),
      map: await this.isVisible(this.locationMap),
      similar: await this.isVisible(this.similarListingsSection)
    };
  }

  /**
   * Open image in fullscreen
   */
  async openImageFullscreen() {
    await this.mainImage.click();
    await this.page.waitForSelector('[data-testid="fullscreen-gallery"]');
  }

  /**
   * Close fullscreen gallery
   */
  async closeFullscreenGallery() {
    const closeButton = this.page.getByRole('button', { name: /close/i });
    await this.clickWhenReady(closeButton);
  }

  /**
   * Check responsive layout on mobile
   */
  async checkMobileLayout(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    if (!viewport || viewport.width > 768) {
      await this.page.setViewportSize({ width: 375, height: 667 });
    }
    
    // Check if elements are stacked vertically
    const gallery = await this.imageGallery.boundingBox();
    const details = await this.bedroomsCount.boundingBox();
    
    if (!gallery || !details) return false;
    
    // Gallery should be above details on mobile
    return gallery.y < details.y;
  }
}