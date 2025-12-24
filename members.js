import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---------- CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyCkOuSyyy6w0tGEw5qQEEJtZ7kS5ybBeyI",
  authDomain: "jeremiah-grand-lodge.firebaseapp.com",
  projectId: "jeremiah-grand-lodge",
  storageBucket: "jeremiah-grand-lodge.firebasestorage.app",
  messagingSenderId: "61539924326",
  appId: "1:61539924326:web:59444a2c1d9e48470070a7"
};

// paste your Firebase config here
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- ADMIN ----------
const adminEmails = ["stephanie.l.washington@gmail.com"];
let allowPosting = true;

// ---------- DOM ----------
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const postBtn = document.getElementById('postBtn');
const login = document.getElementById('login');
const content = document.getElementById('content');
const posts = document.getElementById('posts');
const email = document.getElementById('email');
const password = document.getElementById('password');
const title = document.getElementById('title');
const body = document.getElementById('body');
const togglePosting = document.getElementById("togglePosting");

// ---------- LOGIN ----------
loginBtn.onclick = () => signInWithEmailAndPassword(auth,email.value,password.value)
  .catch(e=>alert("Login error: "+e.message));

logoutBtn.onclick = () => signOut(auth);

// ---------- POST ----------
postBtn.onclick = async () => {
  if (!auth.currentUser) return alert("You must be logged in to post.");
  if (!title.value || !body.value) return alert("Enter a title and message.");

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

// ---------- AUTH STATE ----------
onAuthStateChanged(auth, async user=>{
  login.classList.toggle("hidden", !!user);
  content.classList.toggle("hidden", !user);

  if(user){
    // Prompt Display Name if first login
    if(adminEmails.includes(user.email)){
     togglePosting.classList.remove("hidden");
     togglePosting.onclick = async ()=>{
    await setDoc(doc(db,"settings","site"), { allowPosting: !allowPosting });
  };
}
    
    const userRef = doc(db,"users",user.uid);
    const userSnap = await getDoc(userRef);
    if(!userSnap.exists()){
      let name = prompt("Welcome! Please enter your display name:");
      if(!name) name = user.email;
      await setDoc(userRef,{displayName:name});
    }
    loadPosts();
    watchPostingSetting();
  }
});

// ---------- LOAD POSTS & REPLIES ----------
async function loadPosts(){
  const q = query(collection(db,"posts"), orderBy("ts","desc"));
  onSnapshot(q, snapshot=>{
    posts.innerHTML='';
    snapshot.forEach(docSnap=>{
      const p = docSnap.data();
      const postId = docSnap.id;

      const postDiv = document.createElement("div");
      postDiv.className="post";
      postDiv.innerHTML = `
        <b>${p.title}</b>
        <small>by ${p.name} on ${new Date(p.ts).toLocaleString()}</small>
        <div class="post-body">${p.body}</div>
        <div class="replies" id="replies-${postId}"></div>
      `;

      // Admin delete post
      if(adminEmails.includes(auth.currentUser.email)){
        const delBtn = document.createElement("button");
        delBtn.className="admin-btn";
        delBtn.textContent="Delete Post";
        delBtn.onclick = async ()=>{ await deleteDoc(doc(db,"posts",postId)); };
        postDiv.appendChild(delBtn);
      }

      // Reply form
      const replyInput = document.createElement("input");
      replyInput.className="replyInput";
      replyInput.placeholder="Write a reply";
      const replyBtn = document.createElement("button");
      replyBtn.className="replyBtn";
      replyBtn.textContent="Reply";
      replyBtn.onclick = async ()=>{
        if(!replyInput.value) return;
        const userSnap = await getDoc(doc(db,"users",auth.currentUser.uid));
        const displayName = userSnap.exists() ? userSnap.data().displayName : auth.currentUser.email;

        await addDoc(collection(db,"posts",postId,"replies"),{
          body: replyInput.value,
          ts: Date.now(),
          name: displayName
        });
        replyInput.value='';
      };

      postDiv.appendChild(replyInput);
      postDiv.appendChild(replyBtn);

      posts.appendChild(postDiv);

      // Load replies
      const repliesQ = query(collection(db,"posts",postId,"replies"), orderBy("ts","asc"));
      onSnapshot(repliesQ, repSnap=>{
        const repliesDiv = document.getElementById(`replies-${postId}`);
        repliesDiv.innerHTML='';
        repSnap.forEach(rep=>{
          const r = rep.data();
          const rDiv = document.createElement("div");
          rDiv.innerHTML=`<small>${r.name} on ${new Date(r.ts).toLocaleString()}</small><br>${r.body}`;
          // Admin delete reply
          if(adminEmails.includes(auth.currentUser.email)){
            const delR = document.createElement("button");
            delR.className="admin-btn";
            delR.textContent="Delete Reply";
            delR.onclick = async ()=>{ await deleteDoc(doc(db,"posts",postId,"replies",rep.id)); };
            rDiv.appendChild(delR);
          }
          repliesDiv.appendChild(rDiv);
        });
      });

    });
  });
async function watchPostingSetting(){
  const ref = doc(db,"settings","site");
  onSnapshot(ref, snap=>{
    if(snap.exists()) allowPosting = snap.data().allowPosting;
  });
}

}
