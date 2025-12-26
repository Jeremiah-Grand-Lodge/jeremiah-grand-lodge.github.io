// ------------------ Firebase Imports ------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, getDocs, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
async function watchPostingSetting() {
  const ref = doc(db, "settings", "site");
  const snap = await getDoc(ref);
  if (snap.exists()) allowPosting = snap.data().allowPosting;
  if (togglePosting) togglePosting.textContent = allowPosting ? "Disable Posting" : "Enable Posting";
}

// ------------------ Load Posts ------------------
async function loadPosts() {
  messagesDiv.innerHTML = "";
  const q = query(collection(db, "posts"), orderBy("ts", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const p = docSnap.data();
    const postId = docSnap.id;

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message");

    // Admin button
    let adminBtn = "";
    if (auth.currentUser && adminEmails.includes(auth.currentUser.email)) {
      adminBtn = `<button class="adminDelete postDelete" data-post="${postId}">Delete Thread</button>`;
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

    // Attach Delete Thread handler
    if (auth.currentUser && adminEmails.includes(auth.currentUser.email)) {
      const deleteBtn = msgDiv.querySelector(".postDelete");
      if (deleteBtn) {
        deleteBtn.onclick = async () => {
          if (confirm("Delete this entire thread and all replies?")) {
            await deleteDoc(doc(db, "posts", deleteBtn.dataset.post));
            msgDiv.remove();
          }
        };
      }
    }

    loadReplies(postId);
  });
}

// ------------------ Load Replies ------------------
async function loadReplies(postId) {
  const repliesDiv = document.getElementById(`replies-${postId}`);
  repliesDiv.innerHTML = "";

  const repliesCol = collection(db, "posts", postId, "replies");
  const snap = await getDocs(query(repliesCol, orderBy("ts", "asc")));

  snap.forEach(replyDoc => {
    const r = replyDoc.data();
    const replyId = replyDoc.id;

    const rDiv = document.createElement("div");
    rDiv.classList.add("reply");
    rDiv.innerHTML = `
      <div class="posterInfo">${r.name} — ${new Date(r.ts).toLocaleString()}</div>
      <p>${r.body}</p>
      ${auth.currentUser && adminEmails.includes(auth.currentUser.email) ? `<button class="adminDelete replyDelete" data-post="${postId}" data-reply="${replyId}">Delete Reply</button>` : ""}
    `;
    repliesDiv.appendChild(rDiv);

    // Attach delete reply handler
    const delBtn = rDiv.querySelector(".replyDelete");
    if (delBtn) {
      delBtn.onclick = async () => {
        if (confirm("Delete this reply?")) {
          await deleteDoc(doc(db, "posts", postId, "replies", replyId));
          rDiv.remove();
        }
      };
    }
  });
}

// ------------------ Login / Logout ------------------
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

// ------------------ Post Message ------------------
postBtn.onclick = async () => {
  if (!auth.currentUser) return alert("You must be logged in to post.");
  if (!allowPosting) return alert("Posting is currently disabled by Admin.");
  if (!title.value || !body.value) return alert("Enter a title and message.");

  const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
  const displayName = userSnap.exists() ? userSnap.data().displayName : auth.currentUser.email;

  await addDoc(collection(db, "posts"), {
    title: title.value,
    body: body.value,
    ts: Date.now(),
    name: displayName,
    uid: auth.currentUser.uid
  });

  title.value = "";
  body.value = "";
  loadPosts();
};

// ------------------ Auth State ------------------
onAuthStateChanged(auth, async user => {
  if (user) {
    // Prompt for display name
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      let name = prompt("Welcome! Please enter your display name:");
      if (!name) name = user.email;
      await setDoc(userRef, { displayName: name });
    }

    loginArea.style.display = "none";
    postArea.style.display = "block";
    logoutBtn.style.display = "inline-block";

    if (adminEmails.includes(user.email) && togglePosting) {
      togglePosting.classList.remove("hidden");
    }

    loadPosts();
    watchPostingSetting();
  } else {
    loginArea.style.display = "block";
    postArea.style.display = "none";
    logoutBtn.style.display = "none";
  }
});
