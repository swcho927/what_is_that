import { app } from './firebase.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const auth = getAuth(app);
const el   = document.getElementById('topbar');
if (el) {
    const subtitle = el.dataset.subtitle ?? '그 뭐냐 언어 온라인 채점 사이트';
    const hasRanking     = 'ranking'     in el.dataset;
    const hasSubmissions = 'submissions' in el.dataset;
    const noAuth         = 'noAuth'      in el.dataset;

    el.innerHTML =
        `<span class="topbar-brand" onclick="location.href='index.html'">그 뭐냐 <span>Judge</span></span>` +
        `<div class="topbar-divider"></div>` +
        `<span class="topbar-sub">${subtitle}</span>` +
        (hasRanking ? `<button class="topbar-btn" onclick="location.href='judge.html'" style="margin-left:10px;border:none;">문제</button>` : '') +
        (hasRanking ? `<button class="topbar-btn" onclick="location.href='ranking.html'" style="margin-left:6px;border:none;">랭킹</button>` : '') +
        (hasSubmissions ? `<button class="topbar-btn" onclick="location.href='submissions.html'" style="margin-left:6px;border:none;">제출 기록</button>` : '') +
        (!noAuth
            ? `<div class="topbar-auth">` +
                `<span id="user-info" class="topbar-user" style="display:none;"></span>` +
                `<button id="btn-login"  class="topbar-btn" onclick="location.href='login.html'" style="display:none;">로그인</button>` +
                `<button id="btn-signup" class="topbar-btn topbar-btn-primary" onclick="location.href='signup.html'" style="display:none;">회원가입</button>` +
                `<button id="btn-logout" class="topbar-btn" style="display:none;">로그아웃</button>` +
              `</div>`
            : '');

    if (!noAuth) {
        onAuthStateChanged(auth, user => {
            const userInfo  = document.getElementById('user-info');
            const btnLogin  = document.getElementById('btn-login');
            const btnSignup = document.getElementById('btn-signup');
            const btnLogout = document.getElementById('btn-logout');
            if (user) {
                const name = user.displayName || user.email || "유저";
                userInfo.innerHTML = `<a href="profile.html">${name}</a>`;
                userInfo.style.display  = 'inline-block';
                btnLogin.style.display  = 'none';
                btnSignup.style.display = 'none';
                btnLogout.style.display = 'inline-block';
            } else {
                userInfo.style.display  = 'none';
                btnLogin.style.display  = 'inline-block';
                btnSignup.style.display = 'inline-block';
                btnLogout.style.display = 'none';
            }
        });
        document.addEventListener('click', e => {
            if (e.target.id === 'btn-logout') signOut(auth).then(() => location.href = 'index.html');
        });
    }
}
