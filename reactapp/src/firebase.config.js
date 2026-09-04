// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCzDWsGRCYIKDrL7ChCsNaZJdOcVnzTblI",
    authDomain: "type-racer-users.firebaseapp.com",
    projectId: "type-racer-users",
    messagingSenderId: "452266856882",
    appId: "1:452266856882:web:d0a50f8874cede8831d4ab",
    measurementId: "G-4F9D7068G4",
    storageBucket: "gs://type-racer-users.appspot.com"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Acquire the storage (for profile pictures)
export const storage = getStorage(app)


//export const analytics = getAnalytics(app);