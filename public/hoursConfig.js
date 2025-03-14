const hoursConfig = {
    apiKey: "AIzaSyAQTwB6-NdzeaiqsoeIDCCtWuxf-2oxmIQ",
    authDomain: "dolcevitasinage.firebaseapp.com",
    projectId: "dolcevitasinage",
    storageBucket: "dolcevitasinage.appspot.com",
    messagingSenderId: "525631031898",
    appId: "1:525631031898:web:53dfa013799a41ab1c2663",
    measurementId: "G-KVG4XSLLQZ"
};

if (!firebase.apps.some(app => app.name === "hoursApp")) {
    firebase.initializeApp(hoursConfig, "hoursApp");
}

const hoursDB = firebase.app("hoursApp").firestore();