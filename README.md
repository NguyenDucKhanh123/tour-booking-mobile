# TravelApp – Tour Booking Mobile Application

A full-stack mobile application for tour booking, including a backend REST API and a React Native frontend.  
The system supports user authentication, tour management, booking, and order processing.

---

## Table of Contents
- Introduction
- Technologies
- Features
- Project Structure
- Installation
- Usage
- Notes
- Contact

---

## Introduction

TravelApp is a tour booking mobile application designed to allow users to browse tours, book travel packages, and manage their orders.  
The system is divided into two main parts:

- **Backend (BE):** RESTful API built with Node.js and MySQL  
- **Frontend (FE):** Mobile application built with React Native  

The backend provides APIs for authentication, tour data, and booking management, while the frontend consumes these APIs to deliver a smooth user experience on mobile devices.

---

## Technologies

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcrypt
- dotenv

### Frontend
- React Native
- Redux Toolkit
- React Navigation
- Axios

### Others
- Git & GitHub
- RESTful API
- JSON

---

## Features

### Backend Features
- User authentication (register, login)
- JWT-based authorization
- Tour management (CRUD)
- Booking & order processing
- Secure password hashing
- MySQL database integration

### Frontend Features
- User login & registration
- Tour listing & tour detail view
- Booking tours via mobile app
- State management with Redux
- Clean and user-friendly UI

---

## Project Structure

TravelApp/
│
├── BE/ # Back End
│ ├── auth.js # Authentication logic
│ ├── config.js # App configuration
│ ├── db.js # Database connection
│ ├── server.js # Application entry point
│ ├── package.json
│ ├── package-lock.json
│ └── .gitignore
│
├── FE/ # Front End
│ ├── App.js # Main React Native entry
│ ├── config/ # API base & constants
│ ├── navigation/ # Navigation stack
│ ├── redux/ # Redux store & slices
│ ├── screens/ # UI screens
│ ├── services/ # API services
│ ├── assets/ # Images, fonts, etc.
│ ├── app.json
│ ├── babel.config.js
│ └── .gitignore
│
└── README.md

---

## Installation

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MySQL
- Android Studio / Emulator or real device (for mobile app)

---

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd BE
Install dependencies:

bash
npm install
Configure environment variables: Create a .env file in the BE folder with the following content:

env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=travel_app
JWT_SECRET=your_secret_key
PORT=3000
Start the backend server:

bash
npm start
Backend will run at: http://localhost:3000

Frontend Setup
Open a new terminal and navigate to the frontend folder:

bash
cd FE
Install dependencies:

bash
npm install
Start the React Native app:

bash
npm start
Run on emulator or device:

bash
npm run android
# or
npm run ios
Usage
Start the backend server first.

Launch the mobile app.

Register or login to the application.

Browse tours and book travel packages.

Manage bookings via the mobile interface.

Notes
Make sure MySQL is running before starting the backend.

Do not push node_modules or .env files to GitHub.

Backend and frontend are separated for easier maintenance.

This project is intended for learning and demonstration purposes.

Contact
For questions or collaboration, please contact:

Nguyen Duc Khanh GitHub: NguyenDucKhanh123 Email: khanh.nd11246@sinhvien.hoasen.edu.vn





