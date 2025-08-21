// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAUZvdygzvcxquI4JY3t0i-1xEOkKzrA7c",
    authDomain: "dolcecaffesignage.firebaseapp.com",
    projectId: "dolcecaffesignage",
    storageBucket: "dolcecaffesignage.appspot.com",
    messagingSenderId: "873925685048",
    appId: "1:873925685048:web:274a4b77186885b8e05bcd",
    measurementId: "G-4X0RBL1545"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const storage = firebase.storage();
  const db = firebase.firestore();
  const myAuth = firebase.auth();
  
  // After firebase.initializeApp(config)
firebase.firestore().enablePersistence({
  synchronizeTabs: true  // Allows multiple tabs to share cache
})
.then(() => {
  console.log("✅ Firebase offline persistence enabled");
})
.catch((err) => {
  console.error("❌ Failed to enable persistence:", err);
  if (err.code === 'failed-precondition') {
    console.log("Multiple tabs open, persistence can only be enabled in one tab at a time");
  } else if (err.code === 'unimplemented') {
    console.log("Browser doesn't support persistence");
  }
});