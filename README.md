# 🌍 Tourist Places Web Application

A full-stack web application designed to explore and discover popular tourist destinations. Built with a **React** frontend and an **Express** backend, configured for full-stack serverless deployment on **Vercel**.

Live Demo: [touristplaces-roan.vercel.app](https://touristplaces-roan.vercel.app/)

---

## 📌 Key Features

* **Interactive Frontend:** Built with React for a dynamic, responsive user experience.
* **RESTful API Backend:** Express server handling data processing and API routes.
* **Seamless Deployment:** Pre-configured Vercel integration (`vercel.json`) supporting both client and serverless API endpoints.
* First Individual Project of MERN Internship

---

## 🛠️ Tech Stack

* **Frontend:** React, HTML5, CSS3, JavaScript (ES6+)
* **Backend:** Node.js, Express.js
* **Deployment & Hosting:** Vercel

---

## 📁 Repository Structure

```text
touristplaces/
├── Express/           # Backend server logic and API routes
├── React/             # Frontend UI built with React
├── .gitignore         # Git ignore rules
└── vercel.json        # Vercel deployment and routing configuration
```

## 🚀 Getting Started
*Prerequisites*

Ensure you have Node.js (v16 or higher) and npm installed on your machine.

--
*Installation & Setup*

**1. Clone the repository:**
  ```bash
  git clone [https://github.com/abheeshtaadhikari-source/touristplaces.git](https://github.com/abheeshtaadhikari-source/touristplaces.git)
cd touristplaces
```

**2. Setup the Backend (Express):**
  ```bash
  cd Express
  npm install
  npm start
```
**3. Setup the Frontend (React):**
  ```bash
  cd ../React
  npm install
  npm start
```

---

## 🌐 Deployment
This repository is setup for multi-directory monorepo deployment using Vercel. Pushing changes to the ```main``` branch will automatically build and deploy the updated application to production.
