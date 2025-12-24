import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---------- CONFIG ----------
const firebaseConfig = const firebaseConfig = {
  apiKey: "AIzaSyCkOuSyyy6w0tGEw5qQEEJtZ7kS5ybBeyI",
  authDomain: "jeremiah-grand-lodge.firebaseapp.com",
  projectId: "jeremiah-grand-lodge",
  storageBucket: "jeremiah-grand-lodge.firebasestorage.app",
  messagingSenderId: "61539924326",
  appId: "1:61539924326:web:59444a2c1d9e48470070a7",
};; // Paste your Firebase config here
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

// ---------- LOGIN ----------
loginBtn.onclick = () => signInWithEmailAndPassword(auth,email.value,password.value)
  .catch(e => alert("Login error: "+e.message));

logoutBtn.onclick = () => signOut(auth);

// ---------- POST ----------
postBtn.onclick = async ()=>{
    if(!title.value || !body.value) return alert("Enter title and message");
    if(!allowPosting) return alert("Posting is disabled by admin");

    const userDoc = await getDoc(doc(db,"users",auth.currentUser.uid));
    const displayName = userDoc.exists() ? userDoc.data().displayName : auth.currentUser.email;

    await addDoc(collection(db,"posts"),{
        title: title.value,
        body: body.value,
        ts: Date.now(),
        name: displayName,
        uid: auth.currentUser.uid
    });
    title.value=''; body.value='';
};

// ---------- AUTH STATE ----------
onAuthStateChanged(auth, async user => {
    // Show/hide login and content sections
    login.classList.toggle("hidden", !!user);
    content.classList.toggle("hidden", !user);

    if(user){
        // Check if this user already has a displayName in Firestore
        const userRef = doc(db,"users",user.uid);      // Firestore path: users/{uid}
        const userSnap = await getDoc(userRef);        // Get document
        if(!userSnap.exists()){                        // If no document exists
            // PROMPT the user for their Display Name
            let name = prompt("Welcome! Please enter your display name:");
            if(!name) name = user.email;              // fallback if they cancel
            await setDoc(userRef,{displayName:name}); // Save to Firestore
        }

        // Now that we have a displayName, load the posts
        loadPosts();
    }
});


// ---------- LOAD POSTS & REPLIES ----------
async function loadPosts(){
    const q = query(collection(db,"posts"), orderBy("ts","desc"));
    onSnapshot(q, snapshot => {
        posts.innerHTML='';
        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const postId = docSnap.id;

            const postDiv = document.createElement("div");
            postDiv.className = "post";
            postDiv.innerHTML = `
                <b>${p.title}</b> <small>by ${p.name} on ${new Date(p.ts).toLocaleString()}</small><br>
                ${p.body}
                <div class="replies" id="replies-${postId}"></div>
            `;

            // Admin Delete Button
            if(adminEmails.includes(auth.currentUser.email)){
                const delBtn = document.createElement("button");
                delBtn.textContent = "Delete Post";
                delBtn.onclick = async ()=>{ await deleteDoc(doc(db,"posts",postId)); };
                postDiv.appendChild(delBtn);
            }

            // Reply Form
            const replyInput = document.createElement("input");
            replyInput.placeholder = "Write a reply";
            const replyBtn = document.createElement("button");
            replyBtn.textContent = "Reply";
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
            onSnapshot(repliesQ, repSnap => {
                const repliesDiv = document.getElementById(`replies-${postId}`);
                repliesDiv.innerHTML='';
                repSnap.forEach(rep=>{
                    const r = rep.data();
                    const rDiv = document.createElement("div");
                    rDiv.style.marginLeft="20px";
                    rDiv.innerHTML = `<small>${r.name} on ${new Date(r.ts).toLocaleString()}</small><br>${r.body}`;

                    // Admin delete reply
                    if(adminEmails.includes(auth.currentUser.email)){
                        const delR = document.createElement("button");
                        delR.textContent="Delete Reply";
                        delR.onclick = async ()=>{ await deleteDoc(doc(db,"posts",postId,"replies",rep.id)); };
                        rDiv.appendChild(delR);
                    }

                    repliesDiv.appendChild(rDiv);
                });
            });

        });
    });
}
