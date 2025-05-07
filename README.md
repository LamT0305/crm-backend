# crm-backend

# CRM Backend Setup Guide

This guide will help you set up and run the CRM backend system on your local machine. Follow these steps carefully to ensure a smooth setup process.

## Prerequisites

Before you begin, make sure you have the following installed on your system:

1. **Node.js** (v16.x or higher)
   - Download from [Node.js official website](https://nodejs.org/)
   - Verify installation: `node --version`

2. **MongoDB** (v6.0 or higher)
   - Download from [MongoDB official website](https://www.mongodb.com/try/download/community)
   - Verify installation: `mongod --version`

3. **Git**
   - Download from [Git official website](https://git-scm.com/)
   - Verify installation: `git --version`

## Step-by-Step Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/LamT0305/crm-backend.git
cd crm-backend

# Install dependencies
npm install


# Environment setup
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/crm_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

#Cloudinary
CLOUDINARY_CLOUD_NAME= your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

#Go to cloudinary and create a new account to get the above information

# Start the server
npm start


# Access the application
Open your web browser and navigate to  Access the application
Open your web browser and navigate to URL_ADDRESS:3000 to access the CRM backend.
# Build Notes

This README provides a comprehensive guide focused on environment setup and build notes, making it easy for newcomers to get started with the project. It includes detailed steps, common issues and solutions, and helpful resources for development.


#Account testing
email: jzeem643@gmail.com
password: 0359369208a