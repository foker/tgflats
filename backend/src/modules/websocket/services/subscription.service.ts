import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionDto } from '../dto';
import { v4 as uuidv4 } from 'uuid';

export interface Subscription extends SubscriptionDto {
  subscriptionId: string;
  clientId: string;
  createdAt: Date;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly subscriptions = new Map<string, Subscription[]>();
  private readonly maxSubscriptionsPerClient = 10;

  /**
   * Add a new subscription for a client
   */
  addSubscription(clientId: string, filters: SubscriptionDto): string | null {
    const clientSubscriptions = this.subscriptions.get(clientId) || [];
    
    // Check subscription limit
    if (clientSubscriptions.length >= this.maxSubscriptionsPerClient) {
      this.logger.warn(`Client ${clientId} reached maximum subscriptions limit`);
      return null;
    }

    const subscriptionId = filters.subscriptionId || uuidv4();
    const subscription: Subscription = {
      ...filters,
      subscriptionId,
      clientId,
      createdAt: new Date(),
    };

    clientSubscriptions.push(subscription);
    this.subscriptions.set(clientId, clientSubscriptions);

    this.logger.log(`Added subscription ${subscriptionId} for client ${clientId}`);
    return subscriptionId;
  }

  /**
   * Remove a specific subscription
   */
  removeSubscription(clientId: string, subscriptionId: string): boolean {
    const clientSubscriptions = this.subscriptions.get(clientId);
    if (!clientSubscriptions) {
      return false;
    }

    const index = clientSubscriptions.findIndex(s => s.subscriptionId === subscriptionId);
    if (index === -1) {
      return false;
    }

    clientSubscriptions.splice(index, 1);
    
    if (clientSubscriptions.length === 0) {
      this.subscriptions.delete(clientId);
    } else {
      this.subscriptions.set(clientId, clientSubscriptions);
    }

    this.logger.log(`Removed subscription ${subscriptionId} for client ${clientId}`);
    return true;
  }

  /**
   * Remove all subscriptions for a client
   */
  removeAllSubscriptions(clientId: string): number {
    const clientSubscriptions = this.subscriptions.get(clientId);
    if (!clientSubscriptions) {
      return 0;
    }

    const count = clientSubscriptions.length;
    this.subscriptions.delete(clientId);
    
    this.logger.log(`Removed all ${count} subscriptions for client ${clientId}`);
    return count;
  }

  /**
   * Get all subscriptions for a client
   */
  getClientSubscriptions(clientId: string): Subscription[] {
    return this.subscriptions.get(clientId) || [];
  }

  /**
   * Get all active subscriptions
   */
  getAllSubscriptions(): Subscription[] {
    const allSubscriptions: Subscription[] = [];
    for (const subscriptions of this.subscriptions.values()) {
      allSubscriptions.push(...subscriptions);
    }
    return allSubscriptions;
  }

  /**
   * Check if a listing matches subscription filters
   */
  matchesFilters(listing: any, subscription: Subscription): boolean {
    // District filter
    if (subscription.district && listing.district !== subscription.district) {
      return false;
    }

    // Price range filter
    if (subscription.priceMin !== undefined || subscription.priceMax !== undefined) {
      const listingPrice = listing.price || listing.priceMin;
      if (!listingPrice) return false;

      if (subscription.priceMin !== undefined && listingPrice < subscription.priceMin) {
        return false;
      }
      if (subscription.priceMax !== undefined && listingPrice > subscription.priceMax) {
        return false;
      }
    }

    // Currency filter
    if (subscription.currency && listing.currency !== subscription.currency) {
      return false;
    }

    // Bedrooms filter
    if (subscription.bedroomsMin !== undefined || subscription.bedroomsMax !== undefined) {
      if (!listing.bedrooms) return false;

      if (subscription.bedroomsMin !== undefined && listing.bedrooms < subscription.bedroomsMin) {
        return false;
      }
      if (subscription.bedroomsMax !== undefined && listing.bedrooms > subscription.bedroomsMax) {
        return false;
      }
    }

    // Location radius filter
    if (subscription.location && subscription.location.latitude && subscription.location.longitude && subscription.location.radiusKm) {
      if (!listing.latitude || !listing.longitude) {
        return false;
      }

      const distance = this.calculateDistance(
        subscription.location.latitude,
        subscription.location.longitude,
        listing.latitude,
        listing.longitude
      );

      if (distance > subscription.location.radiusKm) {
        return false;
      }
    }

    // Furnished filter
    if (subscription.furnished !== undefined && listing.furnished !== subscription.furnished) {
      return false;
    }

    // Pets allowed filter
    if (subscription.petsAllowed !== undefined && listing.petsAllowed !== subscription.petsAllowed) {
      return false;
    }

    // Amenities filter
    if (subscription.amenities && subscription.amenities.length > 0) {
      if (!listing.amenities || !Array.isArray(listing.amenities)) {
        return false;
      }

      const listingAmenities = new Set(listing.amenities.map((a: string) => a.toLowerCase()));
      const requiredAmenities = subscription.amenities.map(a => a.toLowerCase());
      
      for (const amenity of requiredAmenities) {
        if (!listingAmenities.has(amenity)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get all clients that should receive a listing based on their subscriptions
   */
  getMatchingClients(listing: any): Map<string, Subscription[]> {
    const matchingClients = new Map<string, Subscription[]>();

    for (const [clientId, subscriptions] of this.subscriptions.entries()) {
      const matchingSubscriptions = subscriptions.filter(sub => 
        this.matchesFilters(listing, sub)
      );

      if (matchingSubscriptions.length > 0) {
        matchingClients.set(clientId, matchingSubscriptions);
      }
    }

    return matchingClients;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get subscription statistics
   */
  getStats() {
    const totalClients = this.subscriptions.size;
    const totalSubscriptions = this.getAllSubscriptions().length;
    const avgSubscriptionsPerClient = totalClients > 0 ? totalSubscriptions / totalClients : 0;

    return {
      totalClients,
      totalSubscriptions,
      avgSubscriptionsPerClient,
      subscriptionsByClient: Array.from(this.subscriptions.entries()).map(([clientId, subs]) => ({
        clientId,
        count: subs.length,
      })),
    };
  }
}