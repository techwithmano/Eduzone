# EduZone

This is a Next.js educational platform built in Firebase Studio. It provides a complete solution for teachers to create classrooms and manage assignments, and for students to enroll and submit their work.

## Getting Started

To get started with local development, first install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

---

## Deployment to Vercel

Follow these steps to deploy your EduZone application to Vercel.

### Step 1: Push Your Project to GitHub

1.  **Create a new repository on GitHub.** You can do this on the [GitHub website](https://github.com/new). Make it a private or public repository.
2.  **Initialize Git and push your code.** Open your terminal in the project directory and run the following commands. Replace `<Your-GitHub-Repo-URL>` with the URL of the repository you just created.

    ```bash
    git init -b main
    git add .
    git commit -m "Initial commit"
    git remote add origin <Your-GitHub-Repo-URL>
    git push -u origin main
    ```

### Step 2: Set Up Your Vercel Project

1.  **Sign up or log in** to your [Vercel account](https://vercel.com).
2.  Click the **"Add New..."** button and select **"Project"**.
3.  **Import your GitHub repository** by finding it in the list and clicking **"Import"**. Vercel will automatically detect that it's a Next.js project.

### Step 3: Configure Environment Variables

This is the most important step. Vercel needs your Firebase project's configuration details to connect to your database.

1.  In your Vercel project settings, navigate to the **"Environment Variables"** section.
2.  Add the following variables one by one. You can find all these values in your **Firebase Console** -> **Project Settings** (click the gear icon) -> **General** tab -> scroll down to **"Your apps"** and select the web app.

    | Name                                    | Value                                 |
    | --------------------------------------- | ------------------------------------- |
    | `NEXT_PUBLIC_FIREBASE_API_KEY`          | Your Firebase API Key                 |
    | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`      | Your Firebase Auth Domain             |
    | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`       | Your Firebase Project ID              |
    | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`   | Your Firebase Storage Bucket          |
    | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID   |
    | `NEXT_PUBLIC_FIREBASE_APP_ID`           | Your Firebase App ID                  |

    **Important:** Ensure you copy these values exactly from your Firebase project settings.

### Step 4: Deploy!

1.  After adding the environment variables, click the **"Deploy"** button.
2.  Vercel will build and deploy your application. Once it's finished, you'll be given a live URL.

### Final Checks

1.  **Firestore Rules:** Make sure you have copied the contents of `firestore.rules` from this project into your **Firebase Console -> Firestore Database -> Rules** tab and published them.
2.  **Create Teacher Accounts:** Remember to manually change the `role` of any user you want to be a teacher from `"STUDENT"` to `"TEACHER"` in your Firestore `users` collection.

Your application is now live! Vercel will automatically redeploy your app every time you push new changes to your GitHub repository's `main` branch.
