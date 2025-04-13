# Savon Vert Backend

## Description
This project is a backend application for managing users in the Savon Vert platform. It provides functionalities for user signup and signin, utilizing Express and MongoDB through Mongoose.

## Project Structure
```
savon-vert-backend
├── .gitignore
├── app.js
├── package.json
├── vercel.json
├── bin
│   └── www
├── models
│   └── users.js
├── modules
│   └── checkBody.js
├── public
│   ├── index.html
│   └── stylesheets
│       └── style.css
├── routes
│   └── users.js
└── README.md
```

## Setup Instructions

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd savon-vert-backend
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Environment Variables**
   Ensure you have a `.env` file in the root directory with the necessary environment variables for your database connection.

4. **Run the application**
   ```
   npm start
   ```

5. **Access the API**
   The API will be available at `http://localhost:3000`. You can use tools like Postman or curl to interact with the endpoints.

## API Endpoints

### User Management

- **POST /signup**
  - Create a new user.
  - Requires `firstName`, `username`, and `password` in the request body.

- **POST /signin**
  - Authenticate an existing user.
  - Requires `username` and `password` in the request body.

## Dependencies
- **express**: Web framework for Node.js.
- **mongoose**: MongoDB object modeling tool.
- **bcrypt**: Library to hash passwords.

## Deployment
This application can be deployed on Vercel. Ensure to configure the `vercel.json` file with the appropriate settings for your deployment.

## License
This project is licensed under the MIT License.