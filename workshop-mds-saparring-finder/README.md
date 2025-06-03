# SPARRING FINDER API

## Overview
The SPARRING FINDER API provides a set of endpoints for user authentication and management. It allows users to register, log in, verify their email addresses, and manage their passwords.

## Project Structure
```
workshop-mds-saparring-finder
├── src
│   ├── docs
│   │   └── swagger.yaml        # OpenAPI specification for the API
│   ├── app.ts                  # Entry point of the application
│   └── types
│       └── index.ts            # TypeScript interfaces and types
├── package.json                 # npm configuration file
├── tsconfig.json                # TypeScript configuration file
└── README.md                    # Project documentation
```

## Installation
To set up the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd workshop-mds-saparring-finder
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

## API Endpoints
The following endpoints are available in the SPARRING FINDER API:

### User Authentication
- **POST /auth/register**: Register a new user.
- **POST /auth/login**: Log in a user.
- **POST /auth/verify-email**: Verify the user's email address.
- **POST /auth/resend-verification**: Resend the verification code to the user's email.
- **POST /auth/forgot-password**: Request a password reset code.
- **PUT /auth/reset-password**: Reset the user's password.

## Usage
Refer to the [OpenAPI specification](src/docs/swagger.yaml) for detailed information on request and response formats for each endpoint.

## License
This project is licensed under the MIT License.