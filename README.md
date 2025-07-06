# EduZone 📚✨

**EduZone** is a full-stack educational web platform designed for schools, tutors, and online learning centers. It provides a robust dashboard for both teachers and students, a resource-rich store, and fully interactive learning tools — all deployed via Vercel and built with scalability and performance in mind.

From course creation to student assignment tracking, EduZone simplifies education management in a modern, user-friendly way.

---

## 🎯 Core Features

- 🧑‍🏫 **Teacher Accounts**:
  - Create and manage courses
  - Assign homework and quizzes
  - Add/remove students from courses
  - Monitor student progress and submissions

- 👩‍🎓 **Student Accounts**:
  - View enrolled courses
  - Submit homework and take quizzes
  - Track scores and feedback

- 🛍️ **Searchable Store**:
  - Courses, classified notes, worksheets, and more
  - Filter and search by subject or category

- 🔐 **Authentication**:
  - Secure login/signup system for both students and teachers

- 📑 **Data Management**:
  - Backend-integrated student profiles, scores, course tracking

---

## ⚙️ Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Firebase (Firestore/Auth)
- **Hosting**: Vercel
- **Database**: Firebase Realtime DB or Firestore

---

## 🗂 Folder Structure (Example)

```
eduzone/
│
├── public/             # Static assets (icons, images, etc.)
├── pages/              # Home, Login, Dashboard, Courses
├── components/         # Navbar, Cards, Modals, Forms
├── lib/                # Firebase integration, utilities
├── styles/             # Global Tailwind styles
└── ...
```

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/techwithmano/Eduzone.git
cd Eduzone
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

- Create a Firebase project.
- Enable **Firestore**, **Authentication**, and optionally **Storage**.
- Add your Firebase config to `.env` or `lib/firebase.js`.

### 4. Run the App

```bash
npm run dev
```

### 5. Deploy

```bash
vercel
```

---

## ✨ Future Features (Planned)

- 🌐 Multi-language support
- 🗃️ Student report cards and PDF export
- 💬 Course discussions / comments
- 📊 Analytics for teachers
- 🔔 Notification system

---

## 🧩 Contributing

We welcome contributions from developers and educators! To contribute:

1. Fork the repository  
2. Create a new branch  
   ```bash
   git checkout -b feature/YourFeature
   ```
3. Make your changes  
4. Push and open a Pull Request

---

## ✍️ Credits

Built with ❤️ by [Tech with Mano](https://github.com/techwithmano)

