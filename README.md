# VidSphere

A YouTube-inspired backend API built with Node.js, Express, and MongoDB. VidSphere provides modular REST APIs for comprehensive video management, user authentication, and interactive features.

## Features

- **User Management**: User registration, authentication, profile management, and subscriptions
- **Video Management**: Upload, edit, delete, and retrieve video metadata
- **Interactions**: Comments, likes, views, and notifications
- **Search & Discovery**: Video search and recommendations
- **Modular Architecture**: Clean separation of concerns with organized controllers, models, and routes

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Environment**: dotenv for configuration management

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with required environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Project Structure

```
backend/
├── controllers/       # Request handlers
├── models/           # Database schemas
├── routes/           # API endpoints
├── middleware/       # Custom middleware
├── config/           # Configuration files
└── server.js         # Entry point
```

## API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Videos
- `POST /api/videos` - Upload video
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get video details
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video

### Interactions
- `POST /api/comments` - Add comment
- `POST /api/likes` - Add like
- `GET /api/videos/:id/comments` - Get video comments

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on the repository.
