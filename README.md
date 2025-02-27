# Babes Espresso

A modern web application for a content platform with gallery, premium content, and creator management features.

## Features

- **Gallery Management**: Browse and manage image galleries with support for premium content
- **User Authentication**: Secure login and registration system with role-based access control
- **Admin Dashboard**: Comprehensive admin interface for content and user management
- **Creator Profiles**: Support for creator accounts with profile management
- **Premium Content**: Subscription-based access to exclusive content
- **Responsive Design**: Modern UI that works across devices

## Technology Stack

- **Frontend**: React with Vite, TanStack Query for data fetching
- **Backend**: Express.js (Node.js)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Styling**: Tailwind CSS with shadcn/ui components

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/babesespresso/updated_2.26.25-Babes-Espresso.git
   cd updated_2.26.25-Babes-Espresso
   ```

2. Install dependencies for both client and server:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Start the development servers:
   ```bash
   # Start the server (from the server directory)
   npm run dev

   # Start the client (from the client directory)
   npm run dev
   ```

4. Access the application:
   - Client: http://localhost:3004
   - Server: http://localhost:3003

## Project Structure

- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared types and utilities
- `/uploads` - Storage for uploaded files

## Recent Improvements

- Fixed gallery loading issues by ensuring consistent API endpoint usage
- Added proper error handling for browser extension interference
- Improved accessibility in dialog components
- Enhanced error recovery mechanisms
- Added About page and fixed routing issues

## License

This project is proprietary and confidential.

## Contact

For questions or support, please contact support@babesespresso.com
