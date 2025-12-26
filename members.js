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

  onSnapshot(q, snapshot=>{
    messagesDiv.innerHTML = "";

    snapshot.forEach(docSnap=>{
      const p = docSnap.data();
      const postId = docSnap.id;

      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message");

      let adminBtn = "";
      if(adminEmails.includes(auth.currentUser?.email)){
        adminBtn = `<button class="adminDelete" data-id="${postId}">Delete</button>`;
      }

      msgDiv.innerHTML = `
        <div class="posterInfo">${p.name} — ${new Date(p.ts).toLocaleString()}</div>
        <h4>${p.title}</h4>
        <p>${p.body}</p>
        <button class="replyBtn" data-id="${postId}">Reply</button>
        ${adminBtn}
        <div class="replies" id="replies-${postId}"></div>
      `;

      messagesDiv.appendChild(msgDiv);

      loadReplies(postId);
    });

    // Post delete
    document.querySelectorAll(".adminDelete").forEach(btn=>{
      if(btn.dataset.id){
        btn.onclick = async ()=>{
          if(confirm("Delete this entire thread?")){
            await deleteDoc(doc(db,"posts", btn.dataset.id));
          }
        };
      }
    });

    // Reply button
    document.querySelectorAll(".replyBtn").forEach(btn=>{
      btn.onclick = ()=>{
        const postId = btn.dataset.id;
        const repliesDiv = document.getElementById(`replies-${postId}`);

        if(repliesDiv.querySelector("textarea")) return;

        const box = document.createElement("textarea");
        box.placeholder = "Write reply...";
        const send = document.createElement("button");
        send.textContent = "Post Reply";

        send.onclick = async ()=>{
          if(!box.value) return alert("Write a reply.");
          const userSnap = await getDoc(doc(db,"users",auth.currentUser.uid));
          const name = userSnap.data().displayName;

          await addDoc(collection(db,"posts",postId,"replies"),{
            body: box.value,
            name,
            ts: Date.now()
          });

          box.remove();
          send.remove();
        };

        repliesDiv.appendChild(box);
        repliesDiv.appendChild(send);
      };
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
