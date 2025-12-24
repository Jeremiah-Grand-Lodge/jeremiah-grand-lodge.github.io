// ------------------ Firebase Imports ------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const postBtn = document.getElementById("postBtn");
const title = document.getElementById("title");
const body = document.getElementById("body");
const messagesDiv = document.getElementById("messages");
const togglePosting = document.getElementById("togglePosting");
const loginArea = document.getElementById("loginArea");
const postArea = document.getElementById("postArea");

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
      postArea.style.display = allowPosting ? "block" : "none";
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
      let adminButtons = "";

      // Admin delete button
      if(adminEmails.includes(auth.currentUser?.email)){
        adminButtons = `<button onclick="deletePost('${docSnap.id}')">Delete</button>`;
      }

      // Reply button
      const replyBtn = `<button onclick="replyToPost('${docSnap.id}')">Reply</button>`;

      msgDiv.innerHTML = `<strong>${data.name} — ${new Date(data.ts).toLocaleString()}</strong>
                          <h4>${data.title}</h4>
                          <p>${data.body}</p>
                          ${replyBtn} ${adminButtons}
                          <div id="replies-${docSnap.id}" class="replies"></div>`;
      messagesDiv.appendChild(msgDiv);

      // Load replies
      loadReplies(docSnap.id);
    });
  });
}

// ------------------ Load Replies ------------------
function loadReplies(postId){
  const repliesDiv = document.getElementById(`replies-${postId}`);
  const q = query(collection(db,"posts",postId,"replies"), orderBy("ts","asc"));
  onSnapshot(q, snapshot=>{
    repliesDiv.innerHTML = "";
    snapshot.forEach(docSnap=>{
      const r = docSnap.data();
      const rDiv = document.createElement("div");
      rDiv.style.marginLeft = "20px";
      rDiv.innerHTML = `<strong>${r.name} — ${new Date(r.ts).toLocaleString()}</strong>
                        <p>${r.body}</p>`;
      repliesDiv.appendChild(rDiv);
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

  try{
    const userSnap = await getDoc(doc(db,"users",auth.currentUser.uid));
    const displayName = userSnap.exists() ? userSnap.data().displayName : auth.currentUser.email;

    await addDoc(collection(db,"posts"), {
      title: title.value,
      body: body.value,
      ts: Date.now(),
      name: displayName,
      uid: auth.currentUser.uid
    });

    title.value = ""; body.value = "";
  } catch(err){
    console.error(err); alert("Error posting message. Check console.");
  }
};

// ------------------ Reply to Post ------------------
window.replyToPost = async (postId) => {
  const replyText = prompt("Enter your reply:");
  if(!replyText) return;
  const userSnap = await getDoc(doc(db,"users",auth.currentUser.uid));
  const displayName = userSnap.exists() ? userSnap.data().displayName : auth.currentUser.email;
  await addDoc(collection(db,"posts",postId,"replies"),{
    body: replyText,
    ts: Date.now(),
    name: displayName,
    uid: auth.currentUser.uid
  });
};

// ------------------ Delete Post (Admin) ------------------
window.deletePost = async (postId) => {
  if(!adminEmails.includes(auth.currentUser?.email)) return;
  if(!confirm("Are you sure you want to delete this post?")) return;
  await deleteDoc(doc(db,"posts",postId));
};

// ------------------ Admin Toggle ------------------
if(togglePosting){
  togglePosting.onclick = async () => {
    const ref = doc(db,"settings","site");
    await setDoc(ref, { allowPosting: !allowPosting });
  };
}

// ------------------ Auth State ------------------
onAuthStateChanged(auth, async user => {
  if(user){
    // Hide login inputs, show logout
    loginArea.style.display = "none";
    postArea.style.display = allowPosting ? "block" : "none";
    logoutBtn.style.display = "inline-block";

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

    // Load posts & watch posting setting **ONLY after login**
    loadPosts();
    watchPostingSetting();
  } else {
    // Logged out: show login, hide posting, hide messages
    loginArea.style.display = "block";
    postArea.style.display = "none";
    logoutBtn.style.display = "none";
    messagesDiv.innerHTML = "";           // <--- hide all messages
    if(togglePosting) togglePosting.classList.add("hidden");
  }
});
