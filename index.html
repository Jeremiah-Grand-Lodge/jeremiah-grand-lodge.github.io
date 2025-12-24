// ------------------ Firebase Imports ------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ------------------ Firebase Config ------------------
const firebaseConfig = {
  apiKey: "AIzaSyCkOuSyyy6w0tGEw5qQEEJtZ7kS5ybBeyI",
  authDomain: "jeremiah-grand-lodge.firebaseapp.com",
  projectId: "jeremiah-grand-lodge",
  storageBucket: "jeremiah-grand-lodge.firebasestorage.app",
  messagingSenderId: "61539924326",
  appId: "1:61539924326:web:59444a2c1d9e48470070a7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// ------------------ DOM Elements ------------------
const loginForm = document.getElementById("loginForm"); // optional if login form exists
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const postBtn = document.getElementById("postBtn");
const title = document.getElementById("title");
const body = document.getElementById("body");
const messagesDiv = document.getElementById("messages");
const togglePosting = document.getElementById("togglePosting");

// ------------------ Variables ------------------
const adminEmails = ["stephanie.l.washington@gmail.com"];
let allowPosting = true;

// ------------------ Watch Posting Setting ------------------
async function watchPostingSetting(){
  const ref = doc(db,"settings","site");
  onSnapshot(ref, snap=>{
    if(snap.exists()) allowPosting = snap.data().allowPosting;
    if(togglePosting){
      togglePosting.textContent = allowPosting ? "Disable Posting" : "Enable Posting";
    }
  });
}

// ------------------ Load Messages ------------------
function loadPosts(){
  const q = query(collection(db,"posts"), orderBy("ts","desc"));
  onSnapshot(q, (querySnapshot) => {
    messagesDiv.innerHTML = "";
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message");
      msgDiv.innerHTML = `<strong>${data.name} — ${new Date(data.ts).toLocaleString()}</strong>
                          <h4>${data.title}</h4>
                          <p>${data.body}</p>`;
      messagesDiv.appendChild(msgDiv);
    });
  });
}

// ------------------ Login / Logout ------------------
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch(err) {
    alert("Login failed: " + err.message);
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

// ------------------ Post Message ------------------
postBtn.onclick = async () => {
  if(!auth.currentUser) return alert("You must be logged in to post.");
  if(!allowPosting) return alert("Posting is currently disabled by Admin.");
  if(!title.value || !body.value) return alert("Enter a title and message.");

  try {
    const userSnap = await getDoc(doc(db,"users",auth.currentUser.uid));
    const displayName = userSnap.exists() ? userSnap.data().displayName : auth.currentUser.email;

    await addDoc(collection(db,"posts"), {
      title: title.value,
      body: body.value,
      ts: Date.now(),
      name: displayName,
      uid: auth.currentUser.uid
    });

    title.value = "";
    body.value = "";
  } catch(err) {
    console.error(err);
    alert("Error posting message. Check console.");
  }
};

// ------------------ Admin Toggle Posting ------------------
if(togglePosting){
  togglePosting.onclick = async () => {
    const ref = doc(db,"settings","site");
    await setDoc(ref, { allowPosting: !allowPosting });
  };
}

// ------------------ Auth State ------------------
onAuthStateChanged(auth, async user => {
  if(user){
    // Prompt for display name if first login
    const userRef = doc(db,"users",user.uid);
    const userSnap = await getDoc(userRef);
    if(!userSnap.exists()){
      let name = prompt("Welcome! Please enter your display name:");
      if(!name) name = user.email;
      await setDoc(userRef,{displayName:name});
    }

    // Show admin toggle if applicable
    if(adminEmails.includes(user.email) && togglePosting){
      togglePosting.classList.remove("hidden");
    }

    // Load posts & watch posting setting
    loadPosts();
    watchPostingSetting();
  }
});
