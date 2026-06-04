// 최초 해결(퍼스트) 실시간 알림 팝업
//
// firstSolves/{번호} 문서가 생기면(= 그 문제를 처음 푼 사람 등장) 모든 접속자에게
// "OOO님이 xxxx번 문제를 처음으로 해결했습니다!" 토스트를 띄운다.
// 각 사람당 한 번만 (localStorage seen-set). 첫 방문자에겐 과거 기록을 띄우지 않고
// 이후 발생分만 알림.

import { app } from './firebase.js';
import { getFirestore, collection, query, orderBy, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const db = getFirestore(app);
const SEEN_KEY = 'firstSolveSeen';

function getSeen() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
    catch (_) { return new Set(); }
}
function saveSeen(set) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch (_) {}
}

let seen = getSeen();

// ── 토스트 UI ──────────────────────────────
function injectStyle() {
    if (document.getElementById('fb-style')) return;
    const s = document.createElement('style');
    s.id = 'fb-style';
    s.textContent = `
    #fb-wrap { position: fixed; top: 76px; left: 50%; transform: translateX(-50%); z-index: 2000; display: flex; flex-direction: column; gap: 10px; align-items: center; pointer-events: none; }
    .fb-toast { pointer-events: auto; min-width: 280px; max-width: 90vw; background: linear-gradient(135deg, #1f6feb, #8957e5); color: #fff; border-radius: 12px; padding: 14px 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.4); font-size: 0.92rem; font-weight: 600; display: flex; align-items: center; gap: 10px; animation: fb-in 0.35s cubic-bezier(.2,.8,.2,1); }
    .fb-toast.out { animation: fb-out 0.3s ease forwards; }
    .fb-toast .fb-emoji { font-size: 1.4rem; }
    .fb-toast .fb-text { line-height: 1.4; }
    .fb-toast .fb-text b { font-weight: 800; }
    .fb-toast .fb-close { margin-left: 6px; cursor: pointer; opacity: 0.8; font-size: 1.1rem; line-height: 1; }
    .fb-toast .fb-close:hover { opacity: 1; }
    @keyframes fb-in  { from { opacity: 0; transform: translateY(-14px) scale(0.96); } to { opacity: 1; transform: none; } }
    @keyframes fb-out { to { opacity: 0; transform: translateY(-14px) scale(0.96); } }
    `;
    document.head.appendChild(s);
}

function wrap() {
    let w = document.getElementById('fb-wrap');
    if (!w) { w = document.createElement('div'); w.id = 'fb-wrap'; document.body.appendChild(w); }
    return w;
}

const queue = [];
let showing = false;

function enqueue(ev) { queue.push(ev); if (!showing) showNext(); }

function showNext() {
    if (!queue.length) { showing = false; return; }
    showing = true;
    const ev = queue.shift();

    injectStyle();
    const label = /^\d+$/.test(String(ev.problemId)) ? `${ev.problemId}번` : `${ev.problemId}`;
    const title = ev.problemTitle ? ` ${ev.problemTitle}` : '';

    const toast = document.createElement('div');
    toast.className = 'fb-toast';
    toast.innerHTML =
        `<span class="fb-emoji">🎉</span>` +
        `<span class="fb-text"><b>${esc(ev.nickname)}</b>님이 <b>${esc(label)}${esc(title)}</b> 문제를 처음으로 해결했습니다!</span>` +
        `<span class="fb-close">&times;</span>`;
    wrap().appendChild(toast);

    let closed = false;
    const close = () => {
        if (closed) return; closed = true;
        toast.classList.add('out');
        setTimeout(() => { toast.remove(); showNext(); }, 300);
    };
    toast.querySelector('.fb-close').addEventListener('click', close);
    setTimeout(close, 7000);
}

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── Firestore 구독 ─────────────────────────
async function start() {
    const col = collection(db, "firstSolves");

    // 첫 방문(저장된 seen이 없음): 기존 기록을 "본 것"으로 처리하고 알림은 안 띄움
    if (localStorage.getItem(SEEN_KEY) === null) {
        try {
            const snap = await getDocs(col);
            snap.forEach(d => seen.add(d.id));
            saveSeen(seen);
        } catch (_) {}
    }

    // 실시간 구독: 새로 추가되는 문서(= 새 퍼스트) 중 안 본 것만 알림
    onSnapshot(query(col, orderBy("solvedAt", "asc")), snap => {
        snap.docChanges().forEach(ch => {
            if (ch.type !== 'added') return;
            const id = ch.doc.id;
            if (seen.has(id)) return;
            seen.add(id); saveSeen(seen);
            const data = ch.doc.data();
            if (!data.nickname) return;  // nickname:null = 이미 풀려 있던 문제 캐시, 팝업 생략
            enqueue({ id, ...data });
        });
    }, err => console.error("firstSolves 구독 실패:", err));
}

start();
