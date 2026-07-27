# TWPublishers Project

TWPublishers is a modern web application consisting of a Next.js frontend and a .NET Minimal API backend, using MongoDB for data storage. 

This document explains the architecture, the features, and how to set up and run the project locally or deploy it to production.

## 🏗 Architecture Overview

The system is split into two distinct parts that communicate over HTTP:

1. **Frontend (`/frontend`)**: Built with React and Next.js. It serves the user interface, landing pages, and the administrative dashboard. 
2. **Backend (`/backend`)**: Built with C# and .NET 10 Minimal APIs. It handles business logic, securely interacts with the MongoDB database, processes webhooks, and serves an API.

---

## 🛠 Backend Details (`/backend`)

The backend is an API service built using **.NET 10**.

### Key Technologies
- **.NET 10 Minimal APIs**: Used for defining lightweight, high-performance HTTP endpoints without the overhead of heavy controllers.
- **MongoDB.Driver**: The official .NET driver for MongoDB. Used to perform CRUD operations on our database collections.
- **Swagger (Swashbuckle)**: Automatically generates interactive API documentation.
- **Docker**: The backend is completely containerized, meaning it can be built and run in a consistent environment anywhere.

### Available Endpoints
You can view and test all endpoints interactively via Swagger by navigating to `/swagger` when the app is running.

* **GET `/`**: The root endpoint. Returns a simple text message `TWPublishers Backend is running` to indicate the server is alive.
* **GET `/health`**: Returns a status of `Healthy` if the application has started correctly. Used by hosting providers (like Render) to verify the app hasn't crashed.
* **GET `/api/stats`**: Fetches the global statistics (revenue, visitors, packages sold, consultations booked, and chart data) used by the frontend dashboard.
* **POST `/api/payfast/webhook`**: Listens for payment confirmations from the Payfast payment gateway. When a successful payment (`payment_status=COMPLETE`) is received, it increments the packages sold and adds the gross amount to the total revenue.
* **POST `/api/auth/login`**: A simple authentication endpoint that checks for static credentials (`admin` or `dev`) and returns a role and a token.
* **POST `/api/track/visitor`**: Increments the total website visitor count in the database. Called by the frontend when a user lands on the site.
* **POST `/api/consultations`**: Submits a new consultation booking (Name, Email, Phone, Message) to the database and increments the `consultationsBooked` stat.
* **GET `/api/consultations`**: Retrieves the latest 50 consultation bookings for display in the dashboard.

### Database (MongoDB)
The backend connects to a MongoDB Atlas cluster. It uses a single database `TwPublisher`, with two primary collections:
1. `Stats`: Holds a single document tracking live statistics (revenue, visitors, etc.).
2. `Consultations`: Stores individual booking records containing user details and the time they booked.

### Deployment & Docker
The backend includes a `Dockerfile` using a multi-stage build:
1. **Base Stage**: Uses the lightweight ASP.NET runtime image.
2. **Build Stage**: Uses the .NET SDK to compile the application and restore NuGet packages.
3. **Publish Stage**: Packages the compiled app into a ready-to-run folder.
4. **Final Stage**: Copies the published files into the runtime image. 
This process ensures the final image is as small and secure as possible.

Currently, the backend is deployed on **Render** as a Web Service, listening on the port provided by the `PORT` environment variable (defaulting to 8080).

---

## 💻 Frontend Details (`/frontend`)

The frontend is a **Next.js** application. Next.js provides server-side rendering, static site generation, and a powerful React-based developer experience.

### Key Responsibilities
- **Landing Page**: The public-facing website for TWPublishers where visitors can learn about the service and book consultations.
- **Dashboard**: A protected area (accessed via the `/api/auth/login` endpoint) for administrators to view live statistics, revenue charts, and a list of recent consultation bookings.
- **API Integration**: The frontend fetches data from the backend's `/api/...` endpoints. CORS is configured on the backend to allow requests from `localhost:3000` (for local development) and the production frontend URL.

---

## 🚀 How to Run Locally

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Optional, for running backend via Docker)

### Running the Backend

**Option 1: Using .NET CLI (Recommended for development)**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the application:
   ```bash
   dotnet run
   ```
3. The API will start (usually on `http://localhost:5000` or `https://localhost:5001`). You can access Swagger at `/swagger`.

**Option 2: Using Docker**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the Docker image:
   ```bash
   docker build -t twpublishers-backend .
   ```
3. Run the container:
   ```bash
   docker run -p 8080:8080 twpublishers-backend
   ```
4. Access the API at `http://localhost:8080`.

### Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the frontend at `http://localhost:3000`.
