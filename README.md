# 🚗 ChalokNao

> **চালক নাও** — A full-stack driver hiring platform connecting vehicle owners with professional drivers across Bangladesh.

---

## 📖 About

**ChalokNao** is a comprehensive driver-on-demand platform that bridges the gap between vehicle owners and professional drivers. Owners can search, shortlist, interview, and hire drivers — while drivers can manage their profiles, showcase credentials, and land employment opportunities. The platform supports both short-term and long-term hiring with a secure payment workflow powered by Stripe.

---

## ✨ Features

### 🧑‍✈️ Driver Side
- **Profile Management** — Complete driver profile with photo, experience, license info, work type, and expected salary
- **Document Upload & Verification** — Upload NID and license documents; track verification status (Pending / Approved / Rejected)
- **Employment History** — Add, edit, and delete past employment records to showcase credibility
- **Availability Calendar** — Set date ranges of availability for short-term hire matching
- **Location & Service Area** — Pin location using OpenStreetMap or dropdown selection
- **Salary Configuration** — Set both monthly and daily expected salary
- **Interview Response Panel** — Accept or reject interview requests (online / offline / chat)
- **Performance Analytics Dashboard** — View total interviews, hires, and average rating
- **Skill & Training Tracker** — Complete training modules and earn progress badges

### 🏢 Owner Side
- **Advanced Driver Search & Filtering** — Filter by salary range, location, rating, and more
- **Driver Shortlisting** — Save and manage a personal shortlist of preferred drivers
- **Driver Comparison View** — Compare multiple drivers side-by-side on salary, rating, and experience
- **Custom Salary Offer Submission** — Send tailored salary offers to drivers
- **Interview Scheduling Module** — Schedule interviews with date, location, and type selection
- **Short-Term Hiring Requests** — Request drivers for specific date ranges
- **Hire Confirmation & Payment** — Stripe-powered payment flow upon mutual confirmation
- **Contract Management Dashboard** — Track ongoing and completed contracts

### 🔐 Admin Side
- **Verification Dashboard** — Review and approve/reject driver documents; suspend users
- **Commission & Transaction Tracking** — Monitor all transactions and platform commission

### 💬 General
- **Real-Time Chat** — Socket.io powered messaging between drivers and owners

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js + Express.js |
| Database | MongoDB |
| Real-time | Socket.io |
| Payments | Stripe |
| Maps | OpenStreetMap |
| Architecture | MVC |

---

## 📁 Project Structure

```
ChalokNao/
├── frontend/          # React.js client
├── backend/           # Node.js + Express API (MVC)
│   ├── models/
│   ├── controllers/
│   └── routes/
├── project_spec.md    # Feature specifications
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MohammadHasibulAmin/ChalokNao.git
   cd ChalokNao
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend/` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   PORT=5000
   ```

5. **Run the development servers**

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm start
   ```

6. Open your browser at `http://localhost:3000`

---

## 👥 Contributors

Built under the supervision of Md. Nafiu Rahman [@nafiurahman00](https://github.com/nafiurahman00)

**Group Members**

| Name | GitHub |
|---|---|
| Mohammad Hasibul Amin | [@MohammadHasibulAmin](https://github.com/MohammadHasibulAmin) |
| Fabiha Tarannum Areena | [@FabihaTarannumA](https://github.com/FabihaTarannumA) |
| MD Ahnaf Tazwar | [@mdahnaftazwar](https://github.com/mdahnaftazwar) |

---

## 📄 License

This project was developed for academic purposes as part of the Software Engineering (CSE470) coursework at BRAC University.
