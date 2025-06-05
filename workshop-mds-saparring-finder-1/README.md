# Workshop MDS Saparring Finder

## Overview
The Workshop MDS Saparring Finder is a web application designed to facilitate sparring sessions between users. It allows users to find sparring partners, manage their availability, and communicate effectively through messages and notifications.

## Features
- User authentication and profile management
- Availability scheduling for sparring sessions
- Messaging system for communication between users
- Notification system for updates and alerts
- Favorites system to keep track of preferred sparring partners

## Technologies Used
- **Prisma**: For database schema modeling and management.
- **PostgreSQL**: As the database provider.
- **TypeScript**: For type-safe JavaScript development.
- **Node.js**: As the runtime environment.

## Project Structure
```
workshop-mds-saparring-finder
├── src
│   └── prisma
│       └── schema.prisma  # Defines the database schema
├── package.json             # npm configuration file
├── tsconfig.json            # TypeScript configuration file
└── README.md                # Project documentation
```

## Getting Started
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd workshop-mds-saparring-finder
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Set up your database by configuring the `DATABASE_URL` in your environment variables.
5. Run the migrations to set up the database schema:
   ```
   npx prisma migrate dev
   ```
6. Start the application:
   ```
   npm start
   ```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.