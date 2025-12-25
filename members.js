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
      const postDiv = document.createElement("div");
      postDiv.classList.add("message");
      postDiv.innerHTML = `
        <div class="posterInfo">${data.name} — ${new Date(data.ts).toLocaleString()}</div>
        <h4>${data.title}</h4>
        <p>${data.body}</p>
        <button id="replyBtn-${docSnap.id}">Reply</button>
        <div id="replies-${docSnap.id}" class="replies"></div>
      `;
      messagesDiv.appendChild(postDiv);

      // Admin delete
      if(adminEmails.includes(auth.currentUser?.email)){
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.classList.add("adminDelete");
        delBtn.onclick = async () => {
          if(confirm("Delete this post?")) await deleteDoc(doc(db,"posts",docSnap.id));
        };
        postDiv.appendChild(delBtn);
      }

      // Inline reply
      const replyBtn = document.getElementById(`replyBtn-${docSnap.id}`);
      replyBtn.onclick = () => {
        const replyDiv = document.getElementById(`replies-${docSnap.id}`);
        if(replyDiv.querySelector("textarea")) return; // prevent multiple

        const textarea = document.createElement("textarea");
        textarea.rows = 2;
        textarea.placeholder = "Write your reply...";
        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Post Reply";

        submitBtn.onclick = async () => {
          if(!textarea.value) return alert("Enter a reply.");
          const userSnap = await getDoc(doc(db,"users",auth.currentUser.uid));
          const displayName = userSnap.exists() ? userSnap.data().displayName : auth.currentUser.email;
          await addDoc(collection(db,"posts",docSnap.id,"replies"), {
            body: textarea.value,
            ts: Date.now(),
            name: displayName,
            uid: auth.currentUser.uid
          });
          textarea.remove();
          submitBtn.remove();
        };

        replyDiv.appendChild(textarea);
        replyDiv.appendChild(submitBtn);
      };

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
      const replyId = docSnap.id;

      const rDiv = document.createElement("div");
      rDiv.classList.add("reply");

      let delBtn = "";
      if(adminEmails.includes(auth.currentUser?.email)){
        delBtn = `<button class="adminDelete" data-post="${postId}" data-reply="${replyId}">Delete Reply</button>`;
      }

      rDiv.innerHTML = `
        <div class="posterInfo">${r.name} — ${new Date(r.ts).toLocaleString()}</div>
        <p>${r.body}</p>
        ${delBtn}
      `;

      repliesDiv.appendChild(rDiv);
    });

    // Attach delete handlers
    document.querySelectorAll(".adminDelete").forEach(btn=>{
      btn.onclick = async ()=>{
        const postId = btn.dataset.post;
        const replyId = btn.dataset.reply;
        if(confirm("Delete this reply?")){
          await deleteDoc(doc(db,"posts",postId,"replies",replyId));
        }
      };
    });
  });
}


// ------------------ Login / Logout ------------------
loginBtn.onclick = async () => {
  try { await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value); }
  catch(err){ alert("Login failed: " + err.message); }
};

logoutBtn.onclick = async () => { await signOut(auth); };

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
  } catch(err){ console.error(err); alert("Error posting message."); }
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
    loginArea.style.display = "none";
    postArea.style.display = allowPosting ? "block" : "none";
    logoutBtn.style.display = "inline-block";
    if(adminEmails.includes(user.email) && togglePosting){
      togglePosting.classList.remove("hidden");
    }

    // Prompt for display name if first login
    const userRef = doc(db,"users",user.uid);
    const userSnap = await getDoc(userRef);
    if(!userSnap.exists()){
      let name = prompt("Welcome! Please enter your display name:");
      if(!name) name = user.email;
      await setDoc(userRef,{displayName:name});
    }

    // Load posts & watch settings
    loadPosts();
    watchPostingSetting();
  } else {
    loginArea.style.display = "block";
    postArea.style.display = "none";
    logoutBtn.style.display = "none";
    messagesDiv.innerHTML = ""; // hide posts when logged out
    if(togglePosting) togglePosting.classList.add("hidden");
  }
});
