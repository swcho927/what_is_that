// ════════════════════════════════════════════════════════
//  judge.js  ─  그뭐냐 채점 엔진 (동적 레이팅 시스템 반영)
// ════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyASbcbiXA9SQ3bohWVK7w6xS74Y_RTZhaA",
    authDomain:        "what-is-that-3cc48.firebaseapp.com",
    projectId:         "what-is-that-3cc48",
    storageBucket:     "what-is-that-3cc48.firebasestorage.app",
    messagingSenderId: "745704527046",
    appId:             "1:745704527046:web:1ef97739fdc1348c96b3c7",
    measurementId:     "G-YKN1NFTZRM"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// 유저 상태 감시 및 성공 마커 노출
onAuthStateChanged(auth, async (user) => {
    const userInfo = document.getElementById('user-info');
    if (user) {
        const displayName = user.displayName || "유저";
        if (userInfo) {
            userInfo.innerHTML = `<a href="profile.html" style="color: var(--blue); text-decoration: none; font-weight: bold; cursor: pointer;">${displayName}</a>`;
            userInfo.style.display = 'inline-block';
        }

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const solvedProblems = userDoc.data().solvedProblems || [];
                solvedProblems.forEach(probId => {
                    const marker = document.getElementById(`solved-marker-${probId}`);
                    if (marker) marker.style.display = 'inline-block';
                });
            }
        } catch (e) {
            console.error("사용자 풀이 목록 로드 실패:", e);
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
    }
});

// 🌟 [수정] 푼 문제 ID 기록 함수 (고정 점수 누적 제거, 팝업 없음)
async function awardRating(prob) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const solvedProblems = userDoc.data().solvedProblems || [];
            if (solvedProblems.includes(String(prob.id))) {
                return; // 이미 푼 문제면 조용히 리턴
            }
        }

        // 오직 solvedProblems 배열에 문제 ID만 추가합니다.
        await updateDoc(userRef, {
            solvedProblems: arrayUnion(String(prob.id))
        });
        
        const marker = document.getElementById(`solved-marker-${prob.id}`);
        if (marker) marker.style.display = 'inline-block';

    } catch (e) {
        console.error("푼 문제 데이터베이스 동기화 에러:", e);
    }
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

function resolveAddrFromTokens(tokens) {
    let geoCount = 0;
    let i = tokens.length - 1;
    while (i >= 0 && tokens[i].type === 'geo') {
        geoCount += tokens[i].val.length;
        i--;
    }
    const exprTokens = tokens.slice(0, i + 1);
    let addr = exprTokens.length === 0 ? 0 : getValFromTokens(exprTokens);
    for (let j = 0; j < geoCount - 1; j++) {
        addr = memory.get(addr) ?? 0;
    }
    return addr;
}

function getValFromTokens(toks) {
    if (toks.length === 0) return 0;
    let pos = 0;
    const consume = () => toks[pos++];
    const peek    = () => toks[pos];

    function parseAtom() {
        if (peek() && peek().type === 'bracket' && peek().val === '어') return 0;
        let t = consume();
        if (!t) return 0;
        if (t.type === 'bracket' && t.val === '아') {
            let res = parseExpr();
            consume();
            while (peek() && peek().type === 'geo') {
                const g = consume();
                for (let i = 0; i < g.val.length; i++) res = memory.get(res) ?? 0;
            }
            return res;
        }
        if (t.type === 'num') {
            let val = t.val.length;
            while (peek() && peek().type === 'geo') {
                const g = consume();
                for (let i = 0; i < g.val.length; i++) val = memory.get(val) ?? 0;
            }
            return val;
        }
        return 0;
    }
    function parseFactor() {
        let node = parseAtom();
        while (peek() && peek().type === 'op' && ['.','..','...'].includes(peek().val)) {
            let op = consume().val, right = parseAtom();
            if (op === '.')        node *= right;
            else if (op === '..') node = Math.floor(node / right);
            else                  node %= right;
        }
        return node;
    }
    function parseTerm() {
        let node = parseFactor();
        while (peek() && peek().type === 'op' && [',',',,'].includes(peek().val)) {
            let op = consume().val, right = parseFactor();
            node = op === ',' ? node + right : node - right;
        }
        return node;
    }
    function parseExpr() {
        let node = parseTerm();
        while (peek() && peek().type === 'op' && ['~',';',';;'].includes(peek().val)) {
            let op = consume().val, right = parseTerm();
            if      (op === '~')  node = node === right ? 1 : 0;
            else if (op === ';')  node = node > right   ? 1 : 0;
            else if (op === ';;') node = node >= right  ? 1 : 0;
        }
        return node;
    }
    return parseExpr();
}

function precompile(code) {
    return code.split("\n").map(function(line) {
        var fullLine = line.split('#')[0].trim();
        if (!fullLine) return null;

        var allToks = tokenizeLine(fullLine).filter(function(t) {
            return t.type !== 'text' && t.type !== 'comment';
        });
        var cmdIdx = allToks.findIndex(function(t) { return t.type === 'cmd'; });

        if (cmdIdx === -1) return null;

        return {
            cmdVal:    allToks[cmdIdx].val,
            leftToks:  allToks.slice(0, cmdIdx),
            rightToks: allToks.slice(cmdIdx + 1),
        };
    });
}

function runCode(code, input, timeLimitMs, memLimitMB) {
    memory = new Map();
    pc = 0;
    let outputBuffer = "";
    let inputTokens  = input.trim().split(/[\n\s]+/).filter(s => s.length > 0);
    let inputIndex   = 0;
    const memLimitBytes = memLimitMB * 1024 * 1024;
    const startTime     = Date.now();

    const compiled = precompile(code);
    const len      = compiled.length;

    try {
        while (pc >= 0 && pc < len) {
            if (Date.now() - startTime > timeLimitMs) {
                return { output: outputBuffer.trim(), verdict: "TLE" };
            }
            if (memory.size * 8 > memLimitBytes) {
                return { output: outputBuffer.trim(), verdict: "MLE" };
            }

            const line   = compiled[pc];
            let jumped   = false;

            if (line) {
                const { cmdVal, leftToks, rightToks } = line;

                if (cmdVal === '뭐더라') {
                    memory.set(resolveAddrFromTokens(leftToks), getValFromTokens(rightToks));
                }
                else if (cmdVal === '진짜뭐지') {
                    const targetAddr = resolveAddrFromTokens(leftToks);
                    const val = inputIndex < inputTokens.length ? inputTokens[inputIndex++] : "";
                    memory.set(targetAddr, val.length > 0 ? val.charCodeAt(0) : 0);
                }
                else if (cmdVal === '진짜뭐냐') {
                    outputBuffer += String.fromCharCode(getValFromTokens(leftToks));
                }
                else if (cmdVal === '뭐지') {
                    const targetAddr = resolveAddrFromTokens(leftToks);
                    const val = inputIndex < inputTokens.length ? inputTokens[inputIndex++] : "0";
                    memory.set(targetAddr, parseInt(val) || 0);
                }
                else if (cmdVal === '뭐냐') {
                    outputBuffer += String(getValFromTokens(leftToks));
                }
                else if (cmdVal === '있잖아') {
                    pc += getValFromTokens(leftToks);
                    jumped = true;
                }
            }

            if (!jumped) pc++;
        }

        const elapsed = Date.now() - startTime;
        console.log(`실행 시간: ${elapsed}ms`);

        return { output: outputBuffer.trim(), verdict: "AC" };

    } catch (err) {
        return { output: outputBuffer.trim(), verdict: "RE: " + err.message };
    }
}

// ════════════════════════════════════════════════════════
//  2. CodeMirror (Python 에디터 전용)
// ════════════════════════════════════════════════════════
var cmPyEditors = {};
var cmLoaded = false;
var cmLoadPromise = null;

function loadCodeMirror() {
    if (cmLoaded) return Promise.resolve();
    if (cmLoadPromise) return cmLoadPromise;

    cmLoadPromise = new Promise(function(resolve, reject) {
        var link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css';
        document.head.appendChild(link);

        var themeLink = document.createElement('link');
        themeLink.rel  = 'stylesheet';
        themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css';
        document.head.appendChild(themeLink);

        var style = document.createElement('style');
        style.textContent = `
            .cm-py .CodeMirror {
                height: 180px;
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                font-size: 0.9rem;
                line-height: 1.7;
                border-radius: 8px;
                border: 1px solid var(--border);
                background: #010409;
            }
            .cm-py .CodeMirror-focused {
                border-color: rgba(88,166,255,0.5) !important;
                box-shadow: 0 0 0 3px rgba(88,166,255,0.08);
            }
        `;
        document.head.appendChild(style);

        var s1 = document.createElement('script');
        s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js';
        s1.onload = function() {
            var s2 = document.createElement('script');
            s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js';
            s2.onload = function() {
                var s3 = document.createElement('script');
                s3.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js';
                s3.onload = function() { cmLoaded = true; resolve(); };
                s3.onerror = reject;
                document.head.appendChild(s3);
            };
            s2.onerror = reject;
            document.head.appendChild(s2);
        };
        s1.onerror = reject;
        document.head.appendChild(s1);
    });

    return cmLoadPromise;
}

function getPyEditorValue(probId) {
    if (cmPyEditors[probId]) return cmPyEditors[probId].getValue();
    var el = document.getElementById("pyEditor-" + probId);
    return el ? el.value : "";
}

// ════════════════════════════════════════════════════════
//  3. 파이썬 모드
// ════════════════════════════════════════════════════════
var ADMIN_HASH = "905e8270550625954fab4e3515024b924ca20c3c0da3989252e0e42f8447a582";
var pyodideInstance = null;
var pyodideLoading  = false;

async function hashPassword(password) {
    var msgBuffer  = new TextEncoder().encode(password);
    var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    var hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loadPyodideIfNeeded(statusEl) {
    if (pyodideInstance) return pyodideInstance;
    if (pyodideLoading) {
        while (pyodideLoading) await new Promise(r => setTimeout(r, 100));
        return pyodideInstance;
    }
    pyodideLoading = true;
    if (statusEl) statusEl.textContent = "Pyodide 로딩 중... (처음 한 번만)";

    await new Promise((resolve, reject) => {
        if (window.loadPyodide) { resolve(); return; }
        var s = document.createElement('script');
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        s.onload  = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });

    pyodideInstance = await window.loadPyodide();
    pyodideLoading  = false;
    if (statusEl) statusEl.textContent = "Pyodide 준비 완료";
    return pyodideInstance;
}

async function submitCodePython(probId) {
    if (isJudging) return;

    var prob = window.PROBLEMS[probId];
    if (!prob) return;

    var pyCode = getPyEditorValue(probId).trim();
    if (!pyCode) { alert("파이썬 코드를 입력해주세요."); return; }

    var tcs = prob.testCases.slice().sort(function(a, b) {
        var tokensA = a.in.trim().split(/[\n\s]+/).filter(s => s.length > 0);
        var tokensB = b.in.trim().split(/[\n\s]+/).filter(s => s.length > 0);
        var nA = parseInt(tokensA[0]);
        var nB = parseInt(tokensB[0]);
        if (nA !== nB) return nA - nB;
        var sumA = tokensA.reduce(function(acc, v) { return acc + (parseInt(v) || 0); }, 0);
        var sumB = tokensB.reduce(function(acc, v) { return acc + (parseInt(v) || 0); }, 0);
        return sumA - sumB;
    });

    var total        = tcs.length;
    var btn          = document.getElementById("sBtn-"          + probId);
    var progressWrap = document.getElementById("progressWrap-" + probId);
    var progressFill = document.getElementById("progressFill-" + probId);
    var progressNum  = document.getElementById("progressNum-"  + probId);
    var progressText = document.getElementById("progressText-" + probId);
    var resultBox    = document.getElementById("resultBox-"    + probId);
    var errorLog     = document.getElementById("errorLog-"     + probId);

    isJudging = true;
    btn.disabled    = true;
    btn.textContent = "검증 중...";

    progressWrap.style.display = "block";
    progressFill.style.width   = "0%";
    progressFill.style.background = "linear-gradient(90deg, var(--blue-dark), var(--blue))";
    progressNum.textContent  = "0 / " + total;
    progressText.textContent = "0%";
    resultBox.style.display  = "none";
    resultBox.className      = "result-display";
    resultBox.textContent    = "";
    errorLog.style.display   = "none";
    errorLog.textContent     = "";

    var statusEl = resultBox;
    statusEl.style.display  = "block";
    statusEl.className      = "result-display";
    statusEl.style.fontSize = "0.9rem";
    statusEl.style.color    = "var(--text-muted)";

    var pyodide;
    try {
        pyodide = await loadPyodideIfNeeded(statusEl);
    } catch(e) {
        statusEl.textContent = "Pyodide 로드 실패: " + e.message;
        btn.disabled    = false;
        btn.textContent = "다시 제출";
        isJudging       = false;
        return;
    }

    statusEl.style.display = "none";

    for (var i = 0; i < total; i++) {
        var tc  = tcs[i];
        var pct = Math.round(((i + 1) / total) * 100);

        progressNum.textContent  = (i + 1) + " / " + total;
        progressFill.style.width = pct + "%";
        progressText.textContent = pct + "%";

        var wrapper = `
import sys, io
sys.stdin  = io.StringIO("""${tc.in.replace(/`/g, '\\`')}""")
sys.stdout = io.StringIO()
try:
    exec("""${pyCode.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}""")
    _out = sys.stdout.getvalue().strip()
except Exception as _e:
    _out = "RE: " + str(_e)
_out
`;
        var output  = "";
        var verdict = "AC";
        try {
            output = String(await pyodide.runPythonAsync(wrapper)).trim();
            if (output.startsWith("RE: ")) verdict = output;
        } catch(e) {
            verdict = "RE: " + e.message;
        }

        var failed  = false;
        var failMsg = "";

        if (verdict.startsWith("RE")) {
            failed  = true;
            failMsg = "[테스트 " + (i+1) + "] 런타임 에러\n" + verdict.slice(4);
        } else {
            var correct = prob.specialJudge
                ? prob.specialJudge(output, String(tc.out))
                : output === String(tc.out).trim();
            if (!correct) {
                failed  = true;
                failMsg =
                    "[테스트 " + (i+1) + "] 불일치\n" +
                    "입력:    " + tc.in.replace(/\n/g, " / ") + "\n" +
                    "정답:    " + tc.out + "\n" +
                    "파이썬:  " + output;
            }
        }

        await new Promise(r => setTimeout(r, 30));

        if (failed) {
            progressFill.style.background = "var(--red)";
            resultBox.style.display  = "block";
            resultBox.className      = "result-display res-fail";
            resultBox.style.fontSize = "";
            resultBox.style.color    = "";
            resultBox.textContent    = failMsg.split("\n")[0];
            errorLog.style.display   = "block";
            errorLog.textContent     = failMsg;
            btn.disabled    = false;
            btn.textContent = "다시 제출";
            isJudging       = false;
            return;
        }
    }

    progressFill.style.background = "var(--green)";
    resultBox.style.display  = "block";
    resultBox.className      = "result-display res-success";
    resultBox.textContent    = "모든 테스트케이스 일치 ✅";
    
    await awardRating(prob);

    btn.disabled    = false;
    btn.textContent = "다시 제출";
    isJudging       = false;
}

// ════════════════════════════════════════════════════════
//  4. 채점 UI
// ════════════════════════════════════════════════════════
var isJudging = false;

async function submitCode(probId) {
    if (isJudging) return;

    var prob = window.PROBLEMS[probId];
    if (!prob) { alert("문제 데이터 없음: " + probId); return; }

    var code = document.getElementById("editor-" + probId).value.trim();
    if (!code) { alert("코드를 입력해주세요."); return; }

    var inputHash = await hashPassword(code);
    if (inputHash === ADMIN_HASH) {
        activatePythonMode(probId);
        return;
    }

    var tcs = prob.testCases.slice().sort(function(a, b) {
        var tokensA = a.in.trim().split(/[\n\s]+/).filter(function(s) { return s.length > 0; });
        var tokensB = b.in.trim().split(/[\n\s]+/).filter(function(s) { return s.length > 0; });
        var nA = parseInt(tokensA[0]);
        var nB = parseInt(tokensB[0]);
        if (nA !== nB) return nA - nB;
        var sumA = tokensA.reduce(function(acc, v) { return acc + (parseInt(v) || 0); }, 0);
        var sumB = tokensB.reduce(function(acc, v) { return acc + (parseInt(v) || 0); }, 0);
        return sumA - sumB;
    });

    var total       = tcs.length;
    var timeLimitMs = (prob.timeLimit || 2) * 1000;
    var memLimitMB  = prob.memoryLimit || 256;

    var btn          = document.getElementById("sBtn-"          + probId);
    var progressWrap = document.getElementById("progressWrap-" + probId);
    var progressFill = document.getElementById("progressFill-" + probId);
    var progressNum  = document.getElementById("progressNum-"  + probId);
    var progressText = document.getElementById("progressText-" + probId);
    var resultBox    = document.getElementById("resultBox-"    + probId);
    var errorLog     = document.getElementById("errorLog-"     + probId);

    isJudging = true;
    btn.disabled    = true;
    btn.textContent = "채점 중...";

    progressWrap.style.display = "block";
    progressFill.style.width   = "0%";
    progressFill.style.background = "linear-gradient(90deg, var(--blue-dark), var(--blue))";
    progressNum.textContent  = "0 / " + total;
    progressText.textContent = "0%";
    resultBox.style.display  = "none";
    resultBox.className      = "result-display";
    resultBox.textContent    = "";
    errorLog.style.display   = "none";
    errorLog.textContent     = "";

    for (var i = 0; i < total; i++) {
        var tc     = tcs[i];
        var result = runCode(code, tc.in, timeLimitMs, memLimitMB);
        var pct    = Math.round(((i + 1) / total) * 100);

        progressNum.textContent  = (i + 1) + " / " + total;
        progressFill.style.width = pct + "%";
        progressText.textContent = pct + "%";

        var failed  = false;
        var failMsg = "";

        if (result.verdict === "TLE") {
            failed  = true;
            failMsg = "[테스트 " + (i+1) + "] 시간 초과";
        } else if (result.verdict === "MLE") {
            failed  = true;
            failMsg = "[테스트 " + (i+1) + "] 메모리 초과";
        } else if (result.verdict.startsWith("RE")) {
            failed  = true;
            failMsg = "[테스트 " + (i+1) + "] 런타임 에러\n" + result.verdict.slice(4);
        } else {
            var correct = prob.specialJudge
                ? prob.specialJudge(result.output.trim(), String(tc.out).trim())
                : result.output.trim() === String(tc.out).trim();
            if (!correct) {
                failed  = true;
                failMsg =
                    "[테스트 " + (i+1) + "] 틀렸습니다\n" +
                    "입력:    " + tc.in.replace(/\n/g, " / ") + "\n" +
                    "정답:    " + tc.out + "\n" +
                    "내 출력: " + result.output;
            }
        }

        await new Promise(function(r) { setTimeout(r, 30); });

        if (failed) {
            progressFill.style.background = "var(--red)";
            resultBox.style.display = "block";
            resultBox.className     = "result-display res-fail";
            resultBox.textContent   = failMsg.split("\n")[0];
            errorLog.style.display  = "block";
            errorLog.textContent    = failMsg;
            btn.disabled    = false;
            btn.textContent = "다시 제출";
            isJudging       = false;
            return;
        }
    }

    progressFill.style.background = "var(--green)";
    resultBox.style.display = "block";
    resultBox.className     = "result-display res-success";
    resultBox.textContent   = "맞았습니다!! 🎉";
    
    await awardRating(prob);

    btn.disabled    = false;
    btn.textContent = "다시 제출";
    isJudging       = false;
}

// ════════════════════════════════════════════════════════
//  5. 파이썬 모드 활성화
// ════════════════════════════════════════════════════════
async function activatePythonMode(probId) {
    if (document.getElementById("pyEditor-" + probId)) {
        document.getElementById("pyEditor-" + probId).focus();
        return;
    }

    var judgeArea = document.getElementById("progressWrap-" + probId).parentNode;

    var pySection = document.createElement('div');
    pySection.id = "pySection-" + probId;
    pySection.innerHTML =
        '<div style="margin-top:20px; padding-top:16px; border-top:1px dashed var(--border);">' +
            '<div style="font-size:0.8rem; color:var(--blue); margin-bottom:8px; font-weight:700;">🐍 파이썬 검증 모드</div>' +
            '<div class="cm-py">' +
                '<textarea id="pyEditor-' + probId + '" class="code-editor" ' +
                    'placeholder="파이썬 정답 코드를 입력하세요..." spellcheck="false" ' +
                    'style="height:180px;"></textarea>' +
            '</div>' +
            '<button class="btn-submit" style="margin-top:8px; background:linear-gradient(135deg,#2d6a2d,#3fb950);" ' +
                'id="pySubmitBtn-' + probId + '">' +
                '파이썬으로 검증' +
            '</button>' +
        '</div>';

    judgeArea.insertBefore(pySection, judgeArea.firstChild);

    document.getElementById('pySubmitBtn-' + probId).addEventListener('click', function() {
        submitCodePython(probId);
    });

    await loadCodeMirror();
    var textarea = document.getElementById("pyEditor-" + probId);
    if (textarea && window.CodeMirror) {
        var cm = CodeMirror.fromTextArea(textarea, {
            mode:              'python',
            theme:             'dracula',
            lineNumbers:       true,
            autoCloseBrackets: true,
            indentWithTabs:    false,
            tabSize:           4,
            lineWrapping:      false,
            extraKeys: {
                'Tab': function(cm) { cm.replaceSelection('    '); }
            }
        });
        cmPyEditors[probId] = cm;
        cm.focus();
    }
}

// ════════════════════════════════════════════════════════
//  6. 탭 전환
// ════════════════════════════════════════════════════════
function switchProblem(probId) {
    document.querySelectorAll('.prob-page').forEach(function(el) { el.classList.remove('active'); });
    document.querySelectorAll('.sidebar-item').forEach(function(el) { el.classList.remove('active'); });
    var page = document.getElementById("page-"  + probId);
    var tab  = document.getElementById("tab-"   + probId);
    if (page) page.classList.add('active');
    if (tab)  tab.classList.add('active');
}

// ════════════════════════════════════════════════════════
//  7. 티어 배지 헬퍼
// ════════════════════════════════════════════════════════
function tierClass(tier) {
    if (!tier) return "";
    return "tier-" + tier.name.toLowerCase();
}

function tierLabel(tier) {
    if (!tier) return "";
    return tier.name + " " + tier.level;
}

window.submitCode = submitCode;
window.submitCodePython = submitCodePython;
window.switchProblem = switchProblem;

// ════════════════════════════════════════════════════════
//  8. 자동 렌더링
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    var sidebarList = document.getElementById('sidebar-list');
    var mainContent = document.getElementById('main-content');
    var isFirst     = true;

    if (!window.PROBLEMS) return;

    var sortedIds = Object.keys(window.PROBLEMS).sort(function(a, b) {
        return parseInt(a) - parseInt(b);
    });

    sortedIds.forEach(function (probId) {
        var prob = window.PROBLEMS[probId];
        var tc   = tierClass(prob.tier);
        var tl   = tierLabel(prob.tier);

        var tabEl = document.createElement('a');
        tabEl.className = 'sidebar-item' + (isFirst ? ' active' : '');
        tabEl.id        = 'tab-' + probId;
        tabEl.setAttribute('onclick', "switchProblem('" + probId + "')");
        
        tabEl.innerHTML =
            '<span class="sidebar-num">'    + prob.id    + '</span>' +
            '<span class="sidebar-title">' + prob.title + '</span>' +
            '<span class="solved-marker" id="solved-marker-' + probId + '" style="display:none; color:#3fb950; border:1px solid #3fb950; padding:1px 5px; border-radius:4px; font-size:0.7rem; font-weight:bold; margin-right:8px; vertical-align:middle; line-height:1;">성공</span>' +
            (tc ? '<span class="tier-badge ' + tc + '">' + tl + '</span>' : '');
        sidebarList.appendChild(tabEl);

        var pageEl = document.createElement('div');
        pageEl.className = 'prob-page' + (isFirst ? ' active' : '');
        pageEl.id        = 'page-' + probId;
        pageEl.innerHTML =
            '<div class="container">' +
                '<div class="problem-header">' +
                    '<div class="problem-number">' + prob.id + '번</div>' +
                    '<h1 class="problem-title">' +
                        prob.title +
                        (tc ? ' <span class="tier-badge-lg ' + tc + '">' + tl + '</span>' : '') +
                    '</h1>' +
                '</div>' +
                '<table class="info-table">' +
                    '<thead><tr><th>시간 제한</th><th>메모리 제한</th><th>테스트 케이스</th></tr></thead>' +
                    '<tbody><tr>' +
                        '<td>' + (prob.timeLimit || 2) + ' 초</td>' +
                        '<td>' + (prob.memoryLimit || 256) + ' MB</td>' +
                        '<td>' + prob.testCases.length + '개</td>' +
                    '</tr></tbody>' +
                '</table>' +
                '<div class="section-title">문제</div>' +
                '<div class="content-box">' + (prob.description || '') + '</div>' +
                '<div class="section-title">입력</div>' +
                '<div class="content-box">' + (prob.inputDesc || '') + '</div>' +
                '<div class="section-title">출력</div>' +
                '<div class="content-box">' + (prob.outputDesc || '') + '</div>' +
                (prob.examples ? buildExamples(prob.examples) : '') +
                '<div class="submit-section">' +
                    '<div class="submit-header">' +
                        '<span class="submit-title">코드 제출</span>' +
                        '<span class="submit-lang">그 뭐냐 언어</span>' +
                    '</div>' +
                    '<textarea id="editor-' + probId + '" class="code-editor" ' +
                        'placeholder="여기에 그 뭐냐 코드를 작성하세요..." spellcheck="false">' +
                        (prob.defaultCode || '') +
                    '</textarea>' +
                    '<button id="sBtn-' + probId + '" class="btn-submit" ' +
                        'onclick="submitCode(\'' + probId + '\')">' +
                        '제출 및 채점 시작' +
                    '</button>' +
                    '<div class="judge-area">' +
                        '<div class="progress-wrap" id="progressWrap-' + probId + '">' +
                            '<div class="progress-info">' +
                                '<span>채점 중&nbsp;<span id="progressNum-' + probId + '">0 / 0</span></span>' +
                                '<span id="progressText-' + probId + '">0%</span>' +
                            '</div>' +
                            '<div class="progress-bar-bg">' +
                                '<div class="progress-bar-fill" id="progressFill-' + probId + '"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div id="resultBox-' + probId + '" class="result-display"></div>' +
                        '<div id="errorLog-'  + probId + '" class="error-log"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        mainContent.appendChild(pageEl);
        isFirst = false;
    });
});

function buildExamples(examples) {
    var html = '<div class="section-title">예제</div>';
    examples.forEach(function (ex, idx) {
        html +=
            '<div class="examples-grid" style="margin-bottom:12px">' +
                '<div class="example-block">' +
                    '<div class="example-header">입력 ' + (idx+1) + '</div>' +
                    '<div class="example-content">' + ex.input + '</div>' +
                '</div>' +
                '<div class="example-block">' +
                    '<div class="example-header">출력 ' + (idx+1) + '</div>' +
                    '<div class="example-content">' + ex.output + '</div>' +
                '</div>' +
            '</div>';
    });
    return html;
}