// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3ZeUHn15ffVtPoX9klNIsrUHs7LnbEE0",
  authDomain: "kitchentable-2ad13.firebaseapp.com",
  projectId: "kitchentable-2ad13",
  storageBucket: "kitchentable-2ad13.firebasestorage.app",
  messagingSenderId: "817479045777",
  appId: "1:817479045777:web:de2e82d62658af51e8a530",
  measurementId: "G-W0YWFMS6RL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// const analytics = getAnalytics(app);