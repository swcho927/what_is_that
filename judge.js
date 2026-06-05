import { app }            from './firebase.js';
import { normId, compareProbId } from './idalias.js';
import { getAuth, onAuthStateChanged }                          from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, collection, addDoc, setDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const auth = getAuth(app);
const db   = getFirestore(app);

// ── 로그인 상태: 사이드바 풀이 마커 갱신 ──
onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) return;
        (snap.data().solvedProblems || []).forEach(id => {
            const el = document.getElementById(`solved-marker-${normId(id)}`);
            if (el) el.style.display = 'inline-block';
        });
    } catch(e) { console.error("풀이 목록 로드 실패:", e); }
});

// ── 풀이 기록 ──
async function awardRating(prob) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const ref  = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && (snap.data().solvedProblems || []).includes(String(prob.id))) return;
        await updateDoc(ref, { solvedProblems: arrayUnion(String(prob.id)) });
        const el = document.getElementById(`solved-marker-${prob.id}`);
        if (el) el.style.display = 'inline-block';

        // 최초 해결 판정 — firstSolves 없을 때만 array-contains 조회
        //   진짜 첫 해결 → nickname 포함 저장 → 팝업
        //   이미 풀린 문제  → nickname:null 저장 → 팝업 없음 (fast path 캐시)
        try {
            const fsRef = doc(db, "firstSolves", String(prob.id));
            if (!(await getDoc(fsRef)).exists()) {
                const solvers = await getDocs(query(collection(db, "users"),
                    where("solvedProblems", "array-contains", String(prob.id))));
                const someoneElse = solvers.docs.some(d => d.id !== user.uid);
                if (!someoneElse) {
                    await setDoc(fsRef, {
                        problemId:    String(prob.id),
                        problemTitle: prob.title || "",
                        nickname:     snap.data()?.nickname || user.displayName || user.email || "익명",
                        uid:          user.uid,
                        solvedAt:     serverTimestamp()
                    });
                } else {
                    await setDoc(fsRef, {
                        problemId:    String(prob.id),
                        problemTitle: prob.title || "",
                        nickname:     null,
                        uid:          user.uid,
                        solvedAt:     serverTimestamp()
                    });
                }
            }
        } catch(_) {}
    } catch(e) { console.error("풀이 기록 실패:", e); }
}

// ── 제출 기록 저장 ──
async function recordSubmission(prob, code, verdict, timeMs, memBytes) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        let nickname = user.displayName || user.email || "익명";
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists() && snap.data().nickname) nickname = snap.data().nickname;
        } catch(_) {}
        // 메타데이터는 공개 문서로 저장 (코드는 제외)
        const ref = await addDoc(collection(db, "submissions"), {
            uid:          user.uid,
            nickname:     nickname,
            problemId:    String(prob.id),
            problemTitle: prob.title || "",
            verdict:      verdict,                 // "AC" | "WA" | "TLE" | "MLE" | "RE"
            success:      verdict === "AC",
            timeMs:       Math.round(timeMs),
            memBytes:     Math.round(memBytes),
            codeLength:   new TextEncoder().encode(code).length,   // UTF-8 바이트 수
            submittedAt:  serverTimestamp()
        });
        // 코드는 서브문서로 분리 — 보안 규칙으로 "그 문제를 푼 사람만" 읽기 허용
        await setDoc(doc(db, "submissions", ref.id, "private", "code"), {
            code:      code,
            problemId: String(prob.id),
            uid:       user.uid
        });
    } catch(e) { console.error("제출 기록 저장 실패:", e); }
}


// ════════════════════════════════════════════════════════
//  1. 그뭐냐 인터프리터
// ════════════════════════════════════════════════════════
var memory = new Map();
var pc = 0;

function tokenizeLine(text) {
    const regex = /(#.*)|(그+)|(거+)|(진짜뭐지|진짜뭐냐|뭐더라|뭐지|뭐냐|있잖아)|(아|어)|(\.\.\.|\.\.|\.|,,|,|;;|;|~)/g;
    let tokens = [], lastIdx = 0;
    text.replace(regex, (match, comm, num, geo, cmd, bracket, op, offset) => {
        if (offset > lastIdx) tokens.push({ type: 'text',    val: text.slice(lastIdx, offset) });
        if      (comm)    tokens.push({ type: 'comment', val: comm });
        else if (num)     tokens.push({ type: 'num',     val: num });
        else if (geo)     tokens.push({ type: 'geo',     val: geo });
        else if (cmd)     tokens.push({ type: 'cmd',     val: cmd });
        else if (bracket) tokens.push({ type: 'bracket', val: bracket });
        else if (op)      tokens.push({ type: 'op',      val: op });
        lastIdx = offset + match.length;
    });
    if (lastIdx < text.length) tokens.push({ type: 'text', val: text.slice(lastIdx) });
    return tokens;
}

// 토큰 → 클로저 컴파일. 한 번만 파싱해서 () => 값 형태의 함수를 만들어 둔다.
// (기존엔 실행 줄마다 재파싱 + 클로저 5개 생성이라 느렸음)
function compileTokens(toks) {
    if (!toks.length) return () => 0;
    let pos = 0;
    const peek = () => toks[pos];

    function atom() {
        const p = peek();
        if (p && p.type === 'bracket' && p.val === '어') return () => 0;   // 아어거 = memory[0]
        const t = toks[pos++];
        if (!t) return () => 0;
        if (t.type === 'bracket' && t.val === '아') {                      // 아...어 괄호
            const inner = expr();
            pos++; // 어 소비
            let derefs = 0;
            while (peek() && peek().type === 'geo') derefs += toks[pos++].val.length;
            if (derefs === 0) return inner;
            return () => { let r = inner(); for (let i = 0; i < derefs; i++) r = memory.get(r) ?? 0; return r; };
        }
        if (t.type === 'num') {                                            // 그+ 숫자/주소
            const base = t.val.length;
            let derefs = 0;
            while (peek() && peek().type === 'geo') derefs += toks[pos++].val.length;
            if (derefs === 0) return () => base;
            return () => { let v = base; for (let i = 0; i < derefs; i++) v = memory.get(v) ?? 0; return v; };
        }
        return () => 0;
    }
    function factor() {
        let node = atom(), p;
        while ((p = peek()) && p.type === 'op' && (p.val === '.' || p.val === '..' || p.val === '...')) {
            const op = toks[pos++].val, left = node, right = atom();
            if      (op === '.')  node = () => left() * right();
            else if (op === '..') node = () => Math.floor(left() / right());
            else                  node = () => left() % right();
        }
        return node;
    }
    function term() {
        let node = factor(), p;
        while ((p = peek()) && p.type === 'op' && (p.val === ',' || p.val === ',,')) {
            const op = toks[pos++].val, left = node, right = factor();
            node = op === ',' ? () => left() + right() : () => left() - right();
        }
        return node;
    }
    function expr() {
        let node = term(), p;
        while ((p = peek()) && p.type === 'op' && (p.val === '~' || p.val === ';' || p.val === ';;')) {
            const op = toks[pos++].val, left = node, right = term();
            if      (op === '~')  node = () => left() === right() ? 1 : 0;
            else if (op === ';')  node = () => left() >  right()  ? 1 : 0;
            else                  node = () => left() >= right()  ? 1 : 0;
        }
        return node;
    }
    return expr();
}

// 주소 토큰 → 클로저. 끝의 거 토큰들을 간접참조로 해석 (마지막 거 1개는 주소 자체)
function compileAddr(tokens) {
    let geoCount = 0, i = tokens.length - 1;
    while (i >= 0 && tokens[i].type === 'geo') { geoCount += tokens[i].val.length; i--; }
    const baseFn = i < 0 ? (() => 0) : compileTokens(tokens.slice(0, i + 1));
    const derefs = geoCount - 1;
    if (derefs <= 0) return baseFn;
    return () => { let a = baseFn(); for (let j = 0; j < derefs; j++) a = memory.get(a) ?? 0; return a; };
}

// 명령어 → 타입코드: 0 뭐더라 1 진짜뭐지 2 진짜뭐냐 3 뭐지 4 뭐냐 5 있잖아
const CMD_TYPE = { '뭐더라': 0, '진짜뭐지': 1, '진짜뭐냐': 2, '뭐지': 3, '뭐냐': 4, '있잖아': 5 };

window.runCode = runCode;

let _precompileCache = null;
function precompile(code) {
    if (_precompileCache && _precompileCache.code === code) return _precompileCache.result;
    const result = code.split("\n").map(line => {
        const fullLine = line.split('#')[0].trim();
        if (!fullLine) return null;
        const allToks = tokenizeLine(fullLine).filter(t => t.type !== 'text' && t.type !== 'comment');
        const cmdIdx  = allToks.findIndex(t => t.type === 'cmd');
        if (cmdIdx === -1) return null;
        const t = CMD_TYPE[allToks[cmdIdx].val];
        const leftToks = allToks.slice(0, cmdIdx), rightToks = allToks.slice(cmdIdx + 1);
        if (t === 0)            return { t, a: compileAddr(leftToks), b: compileTokens(rightToks) }; // 뭐더라
        if (t === 1 || t === 3) return { t, a: compileAddr(leftToks) };                             // 진짜뭐지 / 뭐지
        return { t, b: compileTokens(leftToks) };                                                    // 진짜뭐냐 / 뭐냐 / 있잖아
    });
    _precompileCache = { code, result };
    return result;
}

function runCode(code, input, timeLimitMs, memLimitMB) {
    memory = new Map();
    pc = 0;
    input = String(input).replace(/\r\n?/g, "\n");   // 개행 정규화
    let out = "", inputPos = 0;
    // 숫자(뭐지): 공백·엔터 모두 건너뜀 / 문자(진짜뭐지): 엔터만 건너뜀, 공백은 읽음 — 커서 공유
    const readNum = () => {
        while (inputPos < input.length && /\s/.test(input[inputPos])) inputPos++;
        const start = inputPos;
        while (inputPos < input.length && !/\s/.test(input[inputPos])) inputPos++;
        return parseInt(input.slice(start, inputPos)) || 0;
    };
    const readChar = () => {
        while (inputPos < input.length && input[inputPos] === '\n') inputPos++;
        return inputPos < input.length ? input.charCodeAt(inputPos++) : 0;
    };
    const compiled = precompile(code), len = compiled.length;
    const memLimit = memLimitMB * 1024 * 1024, startTime = Date.now();
    let steps = 0;

    try {
        while (pc >= 0 && pc < len) {
            // 메모리는 단조 증가라 MLE는 매 스텝 검사(저렴). 시간 검사는 1024스텝마다(Date.now 비용 절감)
            if (memory.size * 8 > memLimit) return { output: out.trim(), verdict: "MLE", time: Date.now() - startTime, mem: memory.size * 8, steps };
            if ((steps++ & 1023) === 0 && Date.now() - startTime > timeLimitMs) return { output: out.trim(), verdict: "TLE", time: Date.now() - startTime, mem: memory.size * 8, steps };

            const line = compiled[pc];
            let jumped = false;
            if (line) {
                switch (line.t) {
                    case 0: memory.set(line.a(), line.b());     break;   // 뭐더라
                    case 1: memory.set(line.a(), readChar());   break;   // 진짜뭐지
                    case 2: out += String.fromCharCode(line.b()); break; // 진짜뭐냐
                    case 3: memory.set(line.a(), readNum());    break;   // 뭐지
                    case 4: out += line.b();                    break;   // 뭐냐
                    case 5: pc += line.b(); jumped = true;      break;   // 있잖아
                }
            }
            if (!jumped) pc++;
        }
        return { output: out.trim(), verdict: "AC", time: Date.now() - startTime, mem: memory.size * 8, steps };
    } catch(err) {
        return { output: out.trim(), verdict: "RE: " + err.message, time: Date.now() - startTime, mem: memory.size * 8, steps };
    }
}


// ════════════════════════════════════════════════════════
//  2. CodeMirror (Python 에디터)
// ════════════════════════════════════════════════════════
var cmPyEditors = {}, cmLoaded = false, cmLoadPromise = null;

function loadCodeMirror() {
    if (cmLoaded) return Promise.resolve();
    if (cmLoadPromise) return cmLoadPromise;
    cmLoadPromise = new Promise((resolve, reject) => {
        const addLink = href => { const el = document.createElement('link'); el.rel = 'stylesheet'; el.href = href; document.head.appendChild(el); };
        addLink('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css');
        addLink('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css');
        const style = document.createElement('style');
        style.textContent = `.cm-py .CodeMirror { height:180px; font-family:'JetBrains Mono',monospace; font-size:0.9rem; line-height:1.7; border-radius:8px; border:1px solid var(--border); background:#010409; } .cm-py .CodeMirror-focused { border-color:rgba(88,166,255,0.5)!important; box-shadow:0 0 0 3px rgba(88,166,255,0.08); }`;
        document.head.appendChild(style);
        const load = (src, next) => { const s = document.createElement('script'); s.src = src; s.onload = next; s.onerror = reject; document.head.appendChild(s); };
        load('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js', () =>
        load('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js', () =>
        load('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js', () => { cmLoaded = true; resolve(); })));
    });
    return cmLoadPromise;
}

function getPyEditorValue(probId) {
    if (cmPyEditors[probId]) return cmPyEditors[probId].getValue();
    return document.getElementById("pyEditor-" + probId)?.value ?? "";
}


// ════════════════════════════════════════════════════════
//  3. 파이썬 모드
// ════════════════════════════════════════════════════════
const ADMIN_HASH = "905e8270550625954fab4e3515024b924ca20c3c0da3989252e0e42f8447a582";
var pyodideInstance = null, pyodideLoading = false;

async function hashPassword(pw) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function loadPyodideIfNeeded(statusEl) {
    if (pyodideInstance) return pyodideInstance;
    if (pyodideLoading) { while (pyodideLoading) await new Promise(r => setTimeout(r, 100)); return pyodideInstance; }
    pyodideLoading = true;
    if (statusEl) statusEl.textContent = "Pyodide 로딩 중... (처음 한 번만)";
    await new Promise((resolve, reject) => {
        if (window.loadPyodide) { resolve(); return; }
        const s = document.createElement('script');
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
    pyodideInstance = await window.loadPyodide();
    pyodideLoading = false;
    return pyodideInstance;
}


// ════════════════════════════════════════════════════════
//  4. 채점 UI 공통 헬퍼
// ════════════════════════════════════════════════════════
var isJudging = false;

function sortTestCases(tcs) {
    return tcs.slice().sort((a, b) => {
        const tA = a.in.trim().split(/[\n\s]+/).filter(Boolean);
        const tB = b.in.trim().split(/[\n\s]+/).filter(Boolean);
        const nA = parseInt(tA[0]), nB = parseInt(tB[0]);
        if (nA !== nB) return nA - nB;
        const sum = arr => arr.reduce((s, v) => s + (parseInt(v) || 0), 0);
        return sum(tA) - sum(tB);
    });
}

function getEls(probId) {
    return {
        btn:          document.getElementById("sBtn-"         + probId),
        progressWrap: document.getElementById("progressWrap-" + probId),
        progressFill: document.getElementById("progressFill-" + probId),
        progressNum:  document.getElementById("progressNum-"  + probId),
        progressText: document.getElementById("progressText-" + probId),
        resultBox:    document.getElementById("resultBox-"    + probId),
        errorLog:     document.getElementById("errorLog-"     + probId),
    };
}

function initUI(els, total, label) {
    isJudging = true;
    els.btn.disabled    = true;
    els.btn.textContent = label;
    els.progressWrap.style.display = "block";
    els.progressFill.style.width   = "0%";
    els.progressFill.style.background = "linear-gradient(90deg, var(--blue-dark), var(--blue))";
    els.progressNum.textContent  = "0 / " + total;
    els.progressText.textContent = "0%";
    els.resultBox.style.display  = "none";
    els.resultBox.className      = "result-display";
    els.resultBox.textContent    = "";
    els.errorLog.style.display   = "none";
    els.errorLog.textContent     = "";
}

function updateProgress(els, i, total) {
    const pct = Math.round(((i + 1) / total) * 100);
    els.progressNum.textContent  = (i + 1) + " / " + total;
    els.progressFill.style.width = pct + "%";
    els.progressText.textContent = pct + "%";
}

function showFail(els, failMsg) {
    els.progressFill.style.background = "var(--red)";
    els.resultBox.style.display = "block";
    els.resultBox.className     = "result-display res-fail";
    els.resultBox.textContent   = failMsg.split("\n")[0];
    els.errorLog.style.display  = "block";
    els.errorLog.textContent    = failMsg;
}

function showSuccess(els, msg) {
    els.progressFill.style.background = "var(--green)";
    els.resultBox.style.display = "block";
    els.resultBox.className     = "result-display res-success";
    els.resultBox.textContent   = msg;
}

function resetBtn(els) {
    els.btn.disabled    = false;
    els.btn.textContent = "다시 제출";
    isJudging           = false;
}


// ════════════════════════════════════════════════════════
//  5. 그뭐냐 채점
// ════════════════════════════════════════════════════════
const SUBMIT_COOLDOWN_MS = 10000;   // 제출 쿨다운 (10초에 한 번)
let lastSubmitAt = 0;

async function submitCode(probId) {
    if (isJudging) return;
    const prob = window.PROBLEMS[probId];
    if (!prob) { alert("문제 데이터 없음: " + probId); return; }
    const code = document.getElementById("editor-" + probId).value.trim();
    if (!code) { alert("코드를 입력해주세요."); return; }

    if (await hashPassword(code) === ADMIN_HASH) { activatePythonMode(probId); return; }

    const sinceLast = Date.now() - lastSubmitAt;
    if (sinceLast < SUBMIT_COOLDOWN_MS) {
        alert(`제출은 10초에 한 번만 가능합니다. ${Math.ceil((SUBMIT_COOLDOWN_MS - sinceLast) / 1000)}초 후 다시 시도해주세요.`);
        return;
    }
    lastSubmitAt = Date.now();

    const tcs = sortTestCases(prob.testCases);
    const els = getEls(probId);
    initUI(els, tcs.length, "채점 중...");

    let peakTime = 0, peakMem = 0;
    for (let i = 0; i < tcs.length; i++) {
        const result = runCode(code, tcs[i].in, (prob.timeLimit || 2) * 1000, prob.memoryLimit || 256);
        updateProgress(els, i, tcs.length);
        if (result.time > peakTime) peakTime = result.time;
        if (result.mem  > peakMem)  peakMem  = result.mem;
        const opsPerSec = result.time > 0 ? Math.round(result.steps / result.time * 1000) : result.steps;
        console.log(`[테스트 ${i+1}/${tcs.length}] ${result.verdict}  시간 ${result.time}ms  메모리 ${result.mem}B  연산 ${result.steps.toLocaleString()}회  (초당 ${opsPerSec.toLocaleString()}회)`);

        let failMsg = "", verdict = "";
        if      (result.verdict === "TLE")        { failMsg = `[테스트 ${i+1}] 시간 초과`;        verdict = "TLE"; }
        else if (result.verdict === "MLE")        { failMsg = `[테스트 ${i+1}] 메모리 초과`;      verdict = "MLE"; }
        else if (result.verdict.startsWith("RE")) { failMsg = `[테스트 ${i+1}] 런타임 에러\n${result.verdict.slice(4)}`; verdict = "RE"; }
        else {
            const ok = prob.specialJudge
                ? prob.specialJudge(result.output.trim(), String(tcs[i].out).trim())
                : result.output.trim() === String(tcs[i].out).trim();
            if (!ok) { failMsg = `[테스트 ${i+1}] 틀렸습니다\n입력:    ${tcs[i].in.replace(/\n/g," / ")}\n정답:    ${tcs[i].out}\n내 출력: ${result.output}`; verdict = "WA"; }
        }

        await new Promise(r => setTimeout(r, 30));
        if (failMsg) {
            showFail(els, failMsg); resetBtn(els);
            recordSubmission(prob, code, verdict, peakTime, peakMem);
            return;
        }
    }

    showSuccess(els, "맞았습니다!! 🎉");
    await awardRating(prob);
    resetBtn(els);
    recordSubmission(prob, code, "AC", peakTime, peakMem);
}


// ════════════════════════════════════════════════════════
//  6. 파이썬 검증
// ════════════════════════════════════════════════════════
async function submitCodePython(probId) {
    if (isJudging) return;
    const prob  = window.PROBLEMS[probId];
    const code  = getPyEditorValue(probId).trim();
    if (!code) { alert("파이썬 코드를 입력해주세요."); return; }

    const tcs = sortTestCases(prob.testCases);
    const els = getEls(probId);
    initUI(els, tcs.length, "검증 중...");

    els.resultBox.style.display  = "block";
    els.resultBox.style.fontSize = "0.9rem";
    els.resultBox.style.color    = "var(--text-muted)";

    let pyodide;
    try { pyodide = await loadPyodideIfNeeded(els.resultBox); }
    catch(e) { els.resultBox.textContent = "Pyodide 로드 실패: " + e.message; resetBtn(els); return; }
    els.resultBox.style.display = "none";

    for (let i = 0; i < tcs.length; i++) {
        updateProgress(els, i, tcs.length);
        const wrapper = `
import sys, io
sys.stdin  = io.StringIO("""${tcs[i].in.replace(/`/g,'\\`')}""")
sys.stdout = io.StringIO()
try:
    exec("""${code.replace(/\\/g,'\\\\').replace(/"""/g,'\\"\\"\\"')}""")
    _out = sys.stdout.getvalue().strip()
except Exception as _e:
    _out = "RE: " + str(_e)
_out`;

        let output = "", verdict = "AC";
        try {
            output = String(await pyodide.runPythonAsync(wrapper)).trim();
            if (output.startsWith("RE: ")) verdict = output;
        } catch(e) { verdict = "RE: " + e.message; }

        let failMsg = "";
        if (verdict.startsWith("RE")) {
            failMsg = `[테스트 ${i+1}] 런타임 에러\n${verdict.slice(4)}`;
        } else {
            const ok = prob.specialJudge ? prob.specialJudge(output, String(tcs[i].out)) : output === String(tcs[i].out).trim();
            if (!ok) failMsg = `[테스트 ${i+1}] 불일치\n입력:    ${tcs[i].in.replace(/\n/g," / ")}\n정답:    ${tcs[i].out}\n파이썬:  ${output}`;
        }

        await new Promise(r => setTimeout(r, 30));
        if (failMsg) {
            els.resultBox.style.fontSize = "";
            els.resultBox.style.color    = "";
            showFail(els, failMsg); resetBtn(els); return;
        }
    }

    els.resultBox.style.fontSize = "";
    els.resultBox.style.color    = "";
    showSuccess(els, "모든 테스트케이스 일치 ✅");
    await awardRating(prob);
    resetBtn(els);
}


// ════════════════════════════════════════════════════════
//  7. 파이썬 모드 활성화
// ════════════════════════════════════════════════════════
async function activatePythonMode(probId) {
    if (document.getElementById("pyEditor-" + probId)) {
        document.getElementById("pyEditor-" + probId).focus(); return;
    }
    const judgeArea = document.getElementById("progressWrap-" + probId).parentNode;
    const pySection = document.createElement('div');
    pySection.id = "pySection-" + probId;
    pySection.innerHTML =
        `<div style="margin-top:20px;padding-top:16px;border-top:1px dashed var(--border);">
            <div style="font-size:0.8rem;color:var(--blue);margin-bottom:8px;font-weight:700;">🐍 파이썬 검증 모드</div>
            <div class="cm-py">
                <textarea id="pyEditor-${probId}" class="code-editor" placeholder="파이썬 정답 코드를 입력하세요..." spellcheck="false" style="height:180px;"></textarea>
            </div>
            <button class="btn-submit" id="pySubmitBtn-${probId}" style="margin-top:8px;background:linear-gradient(135deg,#2d6a2d,#3fb950);">파이썬으로 검증</button>
        </div>`;
    judgeArea.insertBefore(pySection, judgeArea.firstChild);
    document.getElementById('pySubmitBtn-' + probId).addEventListener('click', () => submitCodePython(probId));

    await loadCodeMirror();
    const textarea = document.getElementById("pyEditor-" + probId);
    if (textarea && window.CodeMirror) {
        cmPyEditors[probId] = CodeMirror.fromTextArea(textarea, {
            mode: 'python', theme: 'dracula', lineNumbers: true,
            autoCloseBrackets: true, indentWithTabs: false, tabSize: 4,
            extraKeys: { 'Tab': cm => cm.replaceSelection('    ') }
        });
        cmPyEditors[probId].focus();
    }
}


// ════════════════════════════════════════════════════════
//  8. 탭 전환 / 티어 헬퍼
// ════════════════════════════════════════════════════════
function switchProblem(probId) {
    document.querySelectorAll('.prob-page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    document.getElementById("page-" + probId)?.classList.add('active');
    document.getElementById("tab-"  + probId)?.classList.add('active');
}

function tierClass(tier) { return tier ? "tier-" + tier.name.toLowerCase() : ""; }
function tierLabel(tier) { return tier ? tier.name + " " + tier.level : ""; }

// 문제 설명: 소스의 줄바꿈을 그대로 화면 줄바꿈으로 (문제 글을 실제 글처럼 작성)
function nl2br(s) { return String(s || '').replace(/\n/g, '<br>'); }

window.submitCode       = submitCode;
window.submitCodePython = submitCodePython;
window.switchProblem    = switchProblem;


// ════════════════════════════════════════════════════════
//  9. 자동 렌더링
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const sidebarList = document.getElementById('sidebar-list');
    const mainContent = document.getElementById('main-content');
    if (!window.PROBLEMS) return;

    const targetProb = new URLSearchParams(location.search).get('prob');

    Object.keys(window.PROBLEMS).sort(compareProbId).forEach((probId, idx) => {
        const prob  = window.PROBLEMS[probId];
        const tc    = tierClass(prob.tier);
        const tl    = tierLabel(prob.tier);
        const first = idx === 0;

        // 사이드바
        const tab = document.createElement('a');
        tab.className = 'sidebar-item' + (first ? ' active' : '');
        tab.id        = 'tab-' + probId;
        tab.setAttribute('onclick', `switchProblem('${probId}')`);
        tab.innerHTML =
            `<span class="sidebar-num">${prob.id}</span>` +
            `<span class="sidebar-title">${prob.title}</span>` +
            `<span class="solved-marker" id="solved-marker-${prob.id}" style="display:none;color:#3fb950;border:1px solid #3fb950;padding:1px 5px;border-radius:4px;font-size:0.7rem;font-weight:bold;margin-right:8px;">성공</span>` +
            (tc ? `<span class="tier-badge ${tc}">${tl}</span>` : '');
        sidebarList.appendChild(tab);

        // 문제 페이지
        const page = document.createElement('div');
        page.className = 'prob-page' + (first ? ' active' : '');
        page.id        = 'page-' + probId;
        page.innerHTML =
            `<div class="container">
                <div class="problem-header">
                    <div class="problem-number">${prob.id}번</div>
                    <h1 class="problem-title">${prob.title}${tc ? ` <span class="tier-badge-lg ${tc}">${tl}</span>` : ''}</h1>
                </div>
                <table class="info-table">
                    <thead><tr><th>시간 제한</th><th>메모리 제한</th><th>테스트 케이스</th></tr></thead>
                    <tbody><tr>
                        <td>${prob.timeLimit || 2} 초</td>
                        <td>${prob.memoryLimit || 256} MB</td>
                        <td>${prob.testCases.length}개</td>
                    </tr></tbody>
                </table>
                <div class="section-title">문제</div>
                <div class="content-box">${nl2br(prob.description)}</div>
                <div class="section-title">입력</div>
                <div class="content-box">${nl2br(prob.inputDesc)}</div>
                <div class="section-title">출력</div>
                <div class="content-box">${nl2br(prob.outputDesc)}</div>
                ${prob.examples ? buildExamples(prob.examples) : ''}
                <div class="submit-section">
                    <div class="submit-header">
                        <span class="submit-title">코드 제출</span>
                        <span class="submit-lang">그 뭐냐 언어</span>
                    </div>
                    <textarea id="editor-${probId}" class="code-editor" placeholder="여기에 그 뭐냐 코드를 작성하세요..." spellcheck="false">${prob.defaultCode || ''}</textarea>
                    <button id="sBtn-${probId}" class="btn-submit" onclick="submitCode('${probId}')">제출 및 채점 시작</button>
                    <a href="submissions.html?problem=${probId}" class="btn-records">제출 현황</a>
                    <div class="judge-area">
                        <div class="progress-wrap" id="progressWrap-${probId}">
                            <div class="progress-info">
                                <span>채점 중&nbsp;<span id="progressNum-${probId}">0 / 0</span></span>
                                <span id="progressText-${probId}">0%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" id="progressFill-${probId}"></div>
                            </div>
                        </div>
                        <div id="resultBox-${probId}" class="result-display"></div>
                        <div id="errorLog-${probId}"  class="error-log"></div>
                    </div>
                </div>
            </div>`;
        mainContent.appendChild(page);
    });

    if (targetProb && window.PROBLEMS[targetProb]) switchProblem(targetProb);
});

function buildExamples(examples) {
    return '<div class="section-title">예제</div>' + examples.map((ex, i) =>
        `<div class="examples-grid" style="margin-bottom:12px">
            <div class="example-block">
                <div class="example-header">입력 ${i+1}</div>
                <div class="example-content">${ex.input}</div>
            </div>
            <div class="example-block">
                <div class="example-header">출력 ${i+1}</div>
                <div class="example-content">${ex.output}</div>
            </div>
        </div>`
    ).join('');
}
