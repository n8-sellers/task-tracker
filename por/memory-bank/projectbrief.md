# Project Brief: Task Tracker Web App

## Overview
A static web application for tracking and analyzing bi-weekly sales order data uploaded from CSV files. The application will provide both high-level overviews and detailed analyses of orders, with a focus on historical tracking and change detection between reports.

## Core Requirements
1. Upload and process bi-weekly CSV reports containing sales order data
2. Display key data columns in a clean, minimal initial interface
3. Provide detailed views when selecting specific location codes or orders
4. Track historical data and visualize changes over time
5. Enable searching and filtering capabilities
6. Support both chart and table visualizations

## Key Data Points
- UniqueID (integer)
- Location Code (text)
- Customer (text)
- Fabric Type (text)
- GPU Model (text)
- Additional columns available in detailed view

## User Stories
1. As a user, I want to upload bi-weekly CSV reports to track sales orders over time
2. As a user, I want a clean dashboard showing key metrics at a glance
3. As a user, I want to see detailed information when clicking on a specific location code
4. As a user, I want to search and filter data to find specific orders
5. As a user, I want to visualize historical trends and changes between reports
6. As a user, I want to toggle between chart and table views for different perspectives on the data

## Scope
- Static web application with client-side processing
- Browser-based data storage (localStorage/IndexedDB)
- No server-side components or database required
- Focused on data visualization and analysis
