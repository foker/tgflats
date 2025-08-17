# BDD Documentation - Tbilisi Property Rental Platform

This directory contains all Behavior-Driven Development (BDD) scenarios for the Tbilisi property rental platform. These scenarios define the expected business behavior and serve as the source of truth for all development work.

## Overview

The platform automates the process of collecting, analyzing, and displaying rental property listings from Telegram channels in Tbilisi, Georgia.

## Features

### 1. [Telegram Parsing](telegram-parsing.feature)
Automated collection of posts from Telegram channels

### 2. [AI Analysis](ai-analysis.feature)
Intelligent identification and extraction of rental listings from posts

### 3. [Listing Management](listing-management.feature)
Storage and management of rental property listings

### 4. [Geocoding](geocoding.feature)
Converting addresses to geographic coordinates

### 5. [Search and Filtering](search-filtering.feature)
Finding listings based on various criteria

### 6. [Map Visualization](map-visualization.feature)
Interactive map display with clustering

### 7. [List View](list-view.feature)
Tabular display of rental listings

## Key Business Rules

1. **Data Quality**: Only posts identified as rental listings with confidence > 80% should be saved
2. **Duplicate Prevention**: Same listing from different channels should be merged
3. **Data Freshness**: Listings older than 30 days should be marked as potentially outdated
4. **Geographic Scope**: Only properties within Tbilisi administrative boundaries
5. **Currency Support**: Prices in GEL, USD, and EUR with automatic conversion for filtering

## User Personas

### End User (Rental Seeker)
- Wants to find rental properties in Tbilisi
- Needs filtering by price, area, district, pet-friendliness
- Prefers visual map interface but also needs list view
- Values up-to-date and accurate information

### System Administrator
- Monitors parsing pipeline health
- Manages Telegram channel sources
- Reviews AI accuracy and adjusts thresholds
- Handles system configuration

## Testing Strategy

All E2E tests must trace back to these BDD scenarios. Each scenario should have:
- Automated E2E test coverage
- Unit tests for critical business logic
- Integration tests for external services (Telegram, AI, Geocoding)