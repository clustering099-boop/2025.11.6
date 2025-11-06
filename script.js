// 🔥 Firebase 초기화
const firebaseConfig = {
  apiKey: "AIzaSyAE9YO92ihud2sk1jU7hQnhECaPlZqcvZE",
  authDomain: "project-2-4c16e.firebaseapp.com",
  projectId: "project-2-4c16e",
  storageBucket: "project-2-4c16e.firebasestorage.app",
  messagingSenderId: "371577094849",
  appId: "1:371577094849:web:21e63436707eabf6410a40",
  measurementId: "G-VRSZ1LM0F3"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const calendarEl = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

let currentUser = null;
let currentMonth = new Date();

// ✅ 회원가입 / 로그인 / 로그아웃
document.getElementById("signupBtn").onclick = async () => {
  const email = prompt("이메일:");
  const pw = prompt("비밀번호:");
  try {
    await auth.createUserWithEmailAndPassword(email, pw);
    alert("회원가입 완료!");
  } catch (e) { alert(e.message); }
};

document.getElementById("loginBtn").onclick = async () => {
  const email = prompt("이메일:");
  const pw = prompt("비밀번호:");
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    alert("로그인 성공!");
  } catch (e) { alert(e.message); }
};

document.getElementById("logoutBtn").onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) renderCalendar(currentMonth);
  else calendarEl.innerHTML = "<p>로그인 후 이용해주세요.</p>";
});

// ✅ 캘린더 렌더링
async function renderCalendar(date) {
  if (!currentUser) return;

  const year = date.getFullYear();
  const month = date.getMonth();
  monthTitle.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const snapshot = await db.collection("schedules")
    .where("uid", "==", currentUser.uid)
    .get();
  const schedules = snapshot.docs.map(d => d.data());

  let html = "";
  const startDay = firstDay.getDay();
  for (let i = 0; i < startDay; i++) html += `<div class="day empty"></div>`;

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const todaySchedules = schedules.filter(s => s.date === dateStr);

    html += `
      <div class="day" data-date="${dateStr}">
        <strong>${day}</strong>
        <button class="add-event-btn" data-date="${dateStr}">+</button>
        ${todaySchedules.map(s => `<div class="event">${s.title}</div>`).join("")}
      </div>`;
  }

  calendarEl.innerHTML = html;

  document.querySelectorAll(".add-event-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      openScheduleForm(e.target.dataset.date);
    });
  });

  document.querySelectorAll(".event").forEach(el => {
    el.addEventListener("click", e => {
      const title = e.target.textContent;
      if (confirm(`"${title}" 일정을 삭제할까요?`)) {
        deleteSchedule(title);
      }
    });
  });
}

function openScheduleForm(date) {
  const title = prompt(`[${date}] 과목명을 입력하세요:`);
  if (!title) return;
  db.collection("schedules").add({
    uid: currentUser.uid,
    title, date,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => renderCalendar(currentMonth));
}

async function deleteSchedule(title) {
  const snapshot = await db.collection("schedules")
    .where("uid", "==", currentUser.uid)
    .where("title", "==", title).get();
  snapshot.forEach(doc => doc.ref.delete());
  renderCalendar(currentMonth);
}

prevBtn.onclick = () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCalendar(currentMonth); };
nextBtn.onclick = () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCalendar(currentMonth); };

// ✅ AI 챗봇 (시뮬레이션)
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  appendMessage(msg, "user");
  chatInput.value = "";

  setTimeout(() => {
    const reply = generateFakeAIReply(msg);
    appendMessage(reply, "ai");
  }, 600);
};

function appendMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add(type === "user" ? "user-msg" : "ai-msg");
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function generateFakeAIReply(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes("루틴") || lower.includes("추천")) {
    return "좋아요! 등록된 시험 일정을 기반으로 공부 계획을 추천드릴게요 📘";
  }
  if (lower.includes("시험") || lower.includes("공부")) {
    return "하루에 3~4시간씩 꾸준히 복습하는 걸 추천해요. 특히 약한 과목은 1.5배 시간을 투자해보세요 💪";
  }
  return "좋은 질문이에요! 구체적인 일정이나 과목을 알려주시면 맞춤 루틴을 제안드릴게요 ✨";
}
