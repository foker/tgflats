import { Injectable } from '@nestjs/common';
import { Listing } from '@prisma/client';

interface Point {
  id: string;
  latitude: number;
  longitude: number;
  data?: any;
}

interface Cluster {
  id: string;
  type: 'cluster';
  latitude: number;
  longitude: number;
  count: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  data?: any;
}

interface IndividualPoint {
  id: string;
  type: 'point';
  latitude: number;
  longitude: number;
  data: any;
}

export type ClusterResult = Cluster | IndividualPoint;

interface ClusteringOptions {
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  maxPointsPerCluster?: number;
  minClusterSize?: number;
}

@Injectable()
export class ClusteringService {
  private cache = new Map<string, { result: ClusterResult[]; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 60 seconds cache

  /**
   * Main clustering method using grid-based algorithm
   * @param listings - Array of listings to cluster
   * @param options - Clustering options including zoom and bounds
   * @returns Array of clusters and individual points
   */
  clusterListings(
    listings: Listing[],
    options: ClusteringOptions,
  ): ClusterResult[] {
    const { zoom, bounds } = options;
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(listings.length, options);
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Filter listings with valid coordinates
    const validListings = listings.filter(
      listing => 
        listing.latitude !== null && 
        listing.longitude !== null &&
        listing.latitude >= bounds.south &&
        listing.latitude <= bounds.north &&
        listing.longitude >= bounds.west &&
        listing.longitude <= bounds.east
    );

    // Don't cluster at high zoom levels (>= 15)
    if (zoom >= 15) {
      const result = this.createIndividualPoints(validListings);
      this.saveToCache(cacheKey, result);
      return result;
    }

    // Calculate grid size based on zoom level
    const gridSize = this.calculateGridSize(zoom);
    
    // Perform grid-based clustering
    const result = this.performGridClustering(validListings, gridSize, zoom);
    
    // Save to cache
    this.saveToCache(cacheKey, result);
    
    return result;
  }

  /**
   * Calculate grid size based on zoom level
   * Higher zoom = smaller grid cells = more detailed clustering
   */
  private calculateGridSize(zoom: number): number {
    // Grid size in degrees
    // Zoom 0-5: very large cells
    // Zoom 6-10: medium cells  
    // Zoom 11-14: small cells
    const baseSize = 0.5; // Base grid size at zoom 0
    const scaleFactor = Math.pow(2, zoom);
    return baseSize / scaleFactor;
  }

  /**
   * Perform grid-based clustering algorithm
   */
  private performGridClustering(
    listings: Listing[],
    gridSize: number,
    zoom: number,
  ): ClusterResult[] {
    const grid = new Map<string, Listing[]>();
    
    // Assign each listing to a grid cell
    for (const listing of listings) {
      if (listing.latitude === null || listing.longitude === null) continue;
      
      const gridX = Math.floor(listing.longitude / gridSize);
      const gridY = Math.floor(listing.latitude / gridSize);
      const gridKey = `${gridX},${gridY}`;
      
      if (!grid.has(gridKey)) {
        grid.set(gridKey, []);
      }
      grid.get(gridKey)!.push(listing);
    }
    
    const results: ClusterResult[] = [];
    
    // Process each grid cell
    for (const [gridKey, cellListings] of grid.entries()) {
      const [gridX, gridY] = gridKey.split(',').map(Number);
      
      // Determine if we should cluster this cell
      const shouldCluster = this.shouldClusterCell(cellListings.length, zoom);
      
      if (shouldCluster && cellListings.length > 1) {
        // Create a cluster
        const cluster = this.createCluster(cellListings, gridX, gridY, gridSize);
        results.push(cluster);
      } else {
        // Add as individual points
        for (const listing of cellListings) {
          results.push(this.createIndividualPoint(listing));
        }
      }
    }
    
    // Merge nearby clusters if needed
    if (zoom < 10) {
      return this.mergeNearbyClusters(results, gridSize);
    }
    
    return results;
  }

  /**
   * Determine if a grid cell should be clustered
   */
  private shouldClusterCell(count: number, zoom: number): boolean {
    // More aggressive clustering at lower zoom levels
    if (zoom < 8) return count > 0;
    if (zoom < 12) return count > 1;
    return count > 3;
  }

  /**
   * Create a cluster from listings in a grid cell
   */
  private createCluster(
    listings: Listing[],
    gridX: number,
    gridY: number,
    gridSize: number,
  ): Cluster {
    // Calculate centroid
    let sumLat = 0;
    let sumLng = 0;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let sumPrice = 0;
    let minPrice = Infinity;
    let maxPrice = 0;
    let priceCount = 0;
    
    for (const listing of listings) {
      if (listing.latitude === null || listing.longitude === null) continue;
      
      sumLat += listing.latitude;
      sumLng += listing.longitude;
      
      minLat = Math.min(minLat, listing.latitude);
      maxLat = Math.max(maxLat, listing.latitude);
      minLng = Math.min(minLng, listing.longitude);
      maxLng = Math.max(maxLng, listing.longitude);
      
      // Calculate price statistics
      const price = listing.price || ((listing.priceMin || 0) + (listing.priceMax || 0)) / 2;
      if (price > 0) {
        sumPrice += price;
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
        priceCount++;
      }
    }
    
    const avgLat = sumLat / listings.length;
    const avgLng = sumLng / listings.length;
    const avgPrice = priceCount > 0 ? sumPrice / priceCount : 0;
    
    return {
      id: `cluster_${gridX}_${gridY}_${listings.length}`,
      type: 'cluster',
      latitude: avgLat,
      longitude: avgLng,
      count: listings.length,
      bounds: {
        north: maxLat,
        south: minLat,
        east: maxLng,
        west: minLng,
      },
      data: {
        avgPrice: avgPrice > 0 ? Math.round(avgPrice) : null,
        priceRange: priceCount > 0 ? {
          min: Math.round(minPrice),
          max: Math.round(maxPrice),
        } : null,
        districts: this.getUniqueDistricts(listings),
        bedroomStats: this.getBedroomStats(listings),
      },
    };
  }

  /**
   * Create individual point from listing
   */
  private createIndividualPoint(listing: Listing): IndividualPoint {
    return {
      id: listing.id,
      type: 'point',
      latitude: listing.latitude!,
      longitude: listing.longitude!,
      data: {
        price: listing.price,
        priceMin: listing.priceMin,
        priceMax: listing.priceMax,
        currency: listing.currency,
        bedrooms: listing.bedrooms,
        district: listing.district,
        address: listing.address,
        areaSqm: listing.areaSqm,
        furnished: listing.furnished,
        petsAllowed: listing.petsAllowed,
      },
    };
  }

  /**
   * Create individual points from all listings
   */
  private createIndividualPoints(listings: Listing[]): IndividualPoint[] {
    return listings.map(listing => this.createIndividualPoint(listing));
  }

  /**
   * Merge nearby clusters for better visualization at low zoom levels
   */
  private mergeNearbyClusters(
    results: ClusterResult[],
    gridSize: number,
  ): ClusterResult[] {
    const merged: ClusterResult[] = [];
    const processed = new Set<string>();
    const mergeDistance = gridSize * 1.5; // Merge clusters within 1.5 grid cells
    
    for (const result of results) {
      if (processed.has(result.id)) continue;
      
      if (result.type === 'point') {
        merged.push(result);
        processed.add(result.id);
        continue;
      }
      
      // Find nearby clusters to merge
      const nearbyCluster = results.filter(r => 
        r.type === 'cluster' &&
        r.id !== result.id &&
        !processed.has(r.id) &&
        this.calculateDistance(
          result.latitude,
          result.longitude,
          r.latitude,
          r.longitude,
        ) < mergeDistance
      ) as Cluster[];
      
      if (nearbyCluster.length > 0) {
        // Merge clusters
        const mergedCluster = this.mergeClusters([result as Cluster, ...nearbyCluster]);
        merged.push(mergedCluster);
        processed.add(result.id);
        nearbyCluster.forEach(c => processed.add(c.id));
      } else {
        merged.push(result);
        processed.add(result.id);
      }
    }
    
    return merged;
  }

  /**
   * Merge multiple clusters into one
   */
  private mergeClusters(clusters: Cluster[]): Cluster {
    let totalCount = 0;
    let sumLat = 0;
    let sumLng = 0;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    
    for (const cluster of clusters) {
      totalCount += cluster.count;
      sumLat += cluster.latitude * cluster.count;
      sumLng += cluster.longitude * cluster.count;
      
      minLat = Math.min(minLat, cluster.bounds.south);
      maxLat = Math.max(maxLat, cluster.bounds.north);
      minLng = Math.min(minLng, cluster.bounds.west);
      maxLng = Math.max(maxLng, cluster.bounds.east);
    }
    
    return {
      id: `merged_cluster_${Date.now()}_${totalCount}`,
      type: 'cluster',
      latitude: sumLat / totalCount,
      longitude: sumLng / totalCount,
      count: totalCount,
      bounds: {
        north: maxLat,
        south: minLat,
        east: maxLng,
        west: minLng,
      },
      data: {
        mergedFrom: clusters.length,
      },
    };
  }

  /**
   * Calculate distance between two points (simplified for performance)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    // Simple Euclidean distance in degrees (good enough for clustering)
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  /**
   * Get unique districts from listings
   */
  private getUniqueDistricts(listings: Listing[]): string[] {
    const districts = new Set<string>();
    for (const listing of listings) {
      if (listing.district) {
        districts.add(listing.district);
      }
    }
    return Array.from(districts).slice(0, 5); // Limit to 5 districts
  }

  /**
   * Get bedroom statistics
   */
  private getBedroomStats(listings: Listing[]): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const listing of listings) {
      if (listing.bedrooms !== null && listing.bedrooms !== undefined) {
        const key = `${listing.bedrooms}br`;
        stats[key] = (stats[key] || 0) + 1;
      }
    }
    return stats;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(listingCount: number, options: ClusteringOptions): string {
    const { zoom, bounds } = options;
    return `${listingCount}_${zoom}_${bounds.north}_${bounds.south}_${bounds.east}_${bounds.west}`;
  }

  /**
   * Get from cache if valid
   */
  private getFromCache(key: string): ClusterResult[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  /**
   * Save to cache
   */
  private saveToCache(key: string, result: ClusterResult[]): void {
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}