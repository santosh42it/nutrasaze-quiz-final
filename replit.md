# Overview

NutraSage is a personalized nutrition platform designed for India's modern wellness needs. The application provides a comprehensive health assessment quiz that generates personalized supplement recommendations and wellness guidance. The platform combines a React-based frontend with Supabase backend to deliver tailored nutrition solutions through an interactive quiz system and product recommendation engine.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application is built using React 18 with TypeScript and Vite as the build tool. The frontend follows a component-based architecture with clear separation of concerns:

- **Routing**: React Router DOM for client-side navigation between quiz, results, and admin sections
- **State Management**: Zustand for global state management, particularly for admin panel functionality
- **Styling**: Tailwind CSS with custom design system variables and responsive design patterns
- **UI Components**: Radix UI primitives for accessible, unstyled components with custom styling
- **Progressive Enhancement**: Progressive saving of quiz responses to prevent data loss

## Backend Architecture
The backend leverages Supabase as a Backend-as-a-Service (BaaS) solution providing:

- **Database**: PostgreSQL database with structured tables for quiz management
- **Authentication**: Supabase Auth for admin panel access with session management
- **Real-time**: Real-time subscriptions for live data updates
- **Storage**: File upload capabilities for quiz responses

## Data Architecture
The database schema includes several key entities:

- **Quiz Management**: Questions, question options, and quiz responses with answers
- **Recommendation Engine**: Tags system linking quiz responses to product recommendations
- **Product Catalog**: Products with pricing, descriptions, and Shopify integration
- **Content Management**: Banners, expectations, and answer keys for quiz results
- **Analytics**: Comprehensive response tracking and reporting capabilities

## Key Features

### Quiz System
- Dynamic question loading from database with multiple question types (text, select, number, email, tel)
- Progressive saving to prevent data loss during quiz completion
- File upload support for medical reports or additional documentation
- Conditional logic for follow-up questions based on previous answers

### Recommendation Engine
- Tag-based product recommendation system matching quiz responses to relevant products
- Answer key system mapping response patterns to specific product combinations
- Discount and coupon code integration for personalized offers

### Admin Panel
- Complete content management system for questions, products, and recommendations
- Response analytics and reporting with date filtering and export capabilities
- Drag-and-drop question reordering and real-time preview
- Rich text editing for product descriptions and content

### Progressive Saving
- Automatic saving of user information to prevent data loss
- Duplicate prevention system to avoid multiple responses from same user
- Session recovery for interrupted quiz attempts

## Security & Performance
- Environment variable management for sensitive configuration
- Input validation and sanitization throughout the application
- Error boundaries for graceful error handling
- Optimized build configuration with code splitting and asset optimization

# External Dependencies

## Primary Services
- **Supabase**: Backend-as-a-Service providing PostgreSQL database, authentication, real-time subscriptions, and file storage
- **Google Analytics**: User behavior tracking and conversion analytics (GA4 implementation)
- **Netlify**: Frontend hosting and deployment with continuous integration

## Third-Party Integrations
- **Shopify**: E-commerce integration for product catalog and variant management
- **React Router DOM**: Client-side routing and navigation
- **Radix UI**: Accessible UI component primitives for dialogs, accordions, and form elements
- **DND Kit**: Drag-and-drop functionality for admin question management
- **React Quill**: Rich text editor for content management
- **Embla Carousel**: Touch-friendly carousel component for testimonials and product displays

## Development Dependencies
- **Vite**: Build tool and development server with hot module replacement
- **TypeScript**: Type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Zustand**: Lightweight state management for admin functionality