import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Paste your Firebase config object here:
const firebaseConfig = const firebaseConfig = {
  apiKey: "XXXXX",
  authDomain: "XXXXX.firebaseapp.com",
  projectId: "XXXXX",
  storageBucket: "XXXXX.appspot.com",
  messagingSenderId: "XXXXX",
  appId: "XXXXX"
};
;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const postBtn = document.getElementById('postBtn');

loginBtn.onclick = ()=> signInWithEmailAndPassword(auth, email.value, password.value)
    .catch(e => alert("Login error: "+e.message));

logoutBtn.onclick = ()=> signOut(auth);

postBtn.onclick = async ()=>{
    if(!title.value || !body.value) return alert("Please enter title and message");
    await addDoc(collection(db,"posts"),{title:title.value,body:body.value,ts:Date.now()});
    title.value=''; body.value='';
};

onAuthStateChanged(auth,user=>{
    document.getElementById('login').classList.toggle("hidden",!!user);
    document.getElementById('content').classList.toggle("hidden",!user);
    if(user){
        const q = query(collection(db,"posts"),orderBy("ts","desc"));
        onSnapshot(q,s=>{
            posts.innerHTML='';
            s.forEach(d=>{
                const p=d.data();
                posts.innerHTML+=`<div class="post"><b>${p.title}</b><br>${p.body}</div>`;
            });
        });
    }
});
