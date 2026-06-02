# 그뭐냐 Judge 프로젝트 인수인계 문서

> 핵심 요약은 루트 [CLAUDE.md](../CLAUDE.md) 참고. 이 문서는 전체 상세본.

## 1. 프로젝트 개요

**그뭐냐 Judge** — 친구가 직접 설계한 "그 뭐냐" 언어 전용 온라인 채점 사이트.

- 배포 주소: `https://swcho927.github.io/baekjoon/`
- GitHub: `github.com/swcho927/baekjoon`
- 호스팅: GitHub Pages (정적 파일, 서버 없음)
- Firebase 프로젝트: `what-is-that-3cc48`

## 2. 그뭐냐 언어 스펙

| 문법 | 설명 |
|---|---|
| `그+` | 숫자 리터럴 (그 개수 = 값) |
| `그+거+` | 메모리 주소 접근 |
| `아...어` | 괄호 (수식) |
| `아...어거` | 수식 결과를 주소로 메모리 접근 (동적 주소) |
| `아어거` | memory[0] 접근 |
| `뭐더라` | 대입: `<주소> 뭐더라 <수식>` |
| `뭐지` | 숫자 입력: `<주소> 뭐지` |
| `뭐냐` | 숫자 출력: `<주소> 뭐냐` |
| `진짜뭐지` | 문자 입력 (ASCII) |
| `진짜뭐냐` | 문자 출력 (ASCII) |
| `있잖아` | 상대 점프: `있잖아 <수식>` |
| `,` | 더하기 |
| `,,` | 빼기 |
| `.` | 곱하기 |
| `..` | 나누기 (내림) |
| `...` | 나머지 |
| `~` | 같음 비교 |
| `;` | 큰지 비교 |
| `;;` | 크거나 같은지 비교 |
| `#` | 주석 |

### 중요 버그 수정 이력

- `아어거` (0번 메모리 접근) 버그: `parseAtom`에서 `어` 토큰을 소비하지 않고 0 반환 (judge.js에 반영 완료)
  ```javascript
  function parseAtom() {
      if (peek()?.type === 'bracket' && peek()?.val === '어') return 0;
      // ... 나머지
  }
  ```
- 입력 파싱: 공백과 줄바꿈 모두 구분자로 처리 (`input.trim().split(/[\n\s]+/)`)

## 3. judge.js 구조

1. **그뭐냐 인터프리터** — `tokenizeLine()`(토크나이저), `resolveAddrFromTokens()`(주소 계산), `getValFromTokens()`(재귀 하강 수식 파서), `precompile()`(사전 컴파일), `runCode()`(Map 기반 메모리 실행)
2. **CodeMirror** (Python 에디터 전용) — `loadCodeMirror()`, `getPyEditorValue()`
3. **Python 검증 모드** (관리자 전용) — 암호 입력 시 Pyodide로 Python 실행 후 테스트케이스 비교
4. **채점 UI** — `submitCode(probId)` 채점 루프 + 프로그레스 바
5. **Python 모드 활성화** — `activatePythonMode()`
6. **탭 전환** — `switchProblem(probId)`
7. **티어 배지 헬퍼** — `tierClass()`, `tierLabel()`
8. **자동 렌더링** — `DOMContentLoaded`에서 `PROBLEMS` 읽어 사이드바 + 문제 페이지 생성, `buildExamples()`
9. **팝업** — `showAddProblemPopup()`, `hideAddProblemPopup()`

## 4. problems/번호.js 구조

```javascript
(function () {
    function solve(input) { /* 정답 계산 */ }
    function makeRng(seed) { /* 시드 고정 난수 */ }
    function randInt(rng, min, max) { /* 범위 내 정수 */ }

    var testCases = [];
    function add(input) { testCases.push({ in: input, out: solve(input) }); }

    // 테스트케이스 생성 (고정 + 랜덤)
    // 브론즈 50 / 실버 50 / 골드+ 60개 이상

    window.PROBLEMS['번호'] = {
        id: 번호, title: "제목", timeLimit: 1, memoryLimit: 256,
        tier: { name: "Bronze", level: "V" },
        description: "...", inputDesc: "...", outputDesc: "...",
        examples: [{ input: "...", output: "..." }],
        testCases: testCases,
        // specialJudge: function(output, expected) { }  // 특수 채점 필요 시
    };
})();
```

새 문제 추가 시 judge.html에서: 사이드바 탭 추가(`sidebar-item`) + `<script src="problems/번호.js"></script>` 추가.

## 5. 현재 문제 목록 (코드 기준)

| 파일 | 제목 | 티어 | judge.html 등록 |
|---|---|---|---|
| 0523 | 십자인대 | Gold V | ✅ |
| 1000 | A+B | Bronze V | ✅ |
| 1001 | A−B | Bronze V | ✅ |
| 1002 | A×B | Bronze V | ✅ |
| 1003 | A÷B | Silver IV | ✅ |
| 1006 | 피보나치 수 | Silver V | ✅ |
| 1991 | Stalin Sort | Bronze II | ✅ |
| 2000 | 정렬 | Silver I | ✅ |
| 3000 | 정렬 | Platinum V | ✅ |
| 9000 | 한로로와 싸이 | Silver IV | ❌ 미등록 |
| 9001 | 파도의 만가 | Gold II | ✅ |

> 주의: 구버전 인수인계 문서엔 9000=파도의 만가로 적혀 있었으나 실제로는 9000=한로로와 싸이, 9001=파도의 만가.

## 6. Firebase 구조

```
users/{uid}/
    nickname: "swcho927"
    email: "..."
    joinedAt: timestamp
    solvedProblems: ["1000", "1001", ...]   // 맞은 문제 ID 배열

submissions/{autoId}/                       // 제출 기록 (judge.js recordSubmission)
    uid, nickname
    problemId, problemTitle
    verdict: "AC"|"WA"|"TLE"|"MLE"|"RE"
    success: boolean
    timeMs: number          // 테스트케이스 중 최대 실행 시간(ms)
    memBytes: number        // 최대 메모리(byte, memory.size*8)
    codeLength: number
    code: string            // 제출 코드 원문 (기록 클릭 시 표시)
    submittedAt: serverTimestamp
```

레이팅 = solvedProblems 각 문제 티어 점수 합산.

제출 기록은 채점 성공/실패 모두 저장됨. `submissions.html`에서 전체/내 기록 토글 + 사용시간/코드길이/제출시간 정렬 + 행 클릭 시 코드 모달.

> **Firestore 규칙 필수**: `submissions` 컬렉션 read/create 규칙을 콘솔에 추가해야 동작함. 저장소 루트 `firestore.rules` 참고해서 Firebase 콘솔 → Firestore → 규칙에 붙여넣을 것.

## 7. 티어 시스템

| 티어 | 레이팅 범위 | 색상 |
|---|---|---|
| Bronze V~I | 0~119 | #ad5600 |
| Silver V~I | 120~299 | #435f7a |
| Gold V~I | 300~639 | #ec9a00 |
| Platinum V~I | 640~1199 | #27e2a4 |
| Diamond V~I | 1200~1999 | #00b4fc |
| Ruby V~I | 2000~ | #ff0062 |

문제 티어 점수표: Bronze V=1점 ~ Ruby I=140점.

## 8. 테스트케이스 생성 원칙

- 정답 하드코딩 금지 — solver 함수로 자동 계산
- `testcase.ac` 참고: `correct_basic.cpp` → solver, `generator_random.cpp` → 랜덤 생성
- 구성: 예제 + 경계값 + 극단값 + 시드 고정 랜덤
- 개수: 브론즈 50, 실버 50, 골드+ 60개 이상
- 입력 형식: 공백 구분 (정올/백준 동일)

## 9. 구현 완료 기능

인터프리터, 사전 컴파일 + Map 메모리 최적화, 사이드바 자동 생성, 채점 프로그레스 바, TLE/MLE/RE/AC 판정, 스페셜 저지, 관리자 Python 검증 모드, Firebase Auth/Firestore, 유저 프로필, 전체 랭킹, 문제 추가 팝업, 동적 주소(`아...어거`), 공백/줄바꿈 입력 구분.

## 10. 미구현 / 앞으로 할 기능

### 단기
- `9000.js`(한로로와 싸이) judge.html 등록 여부 결정
- 상단바 모든 페이지 통일 (index.html은 `.topbar-auth` 등 클래스화 완료, 다른 페이지 적용 필요)
- 랭킹 페이지 UI 개선
- 퀵소트 문제 추가 + JS 시간 배율 측정

### 장기
- 경쟁 시스템: 실시간 대결 (Firebase Realtime Database)
- 투표 시스템: 커뮤니티 티어 투표
- 유니크도: 문제 고유 지표 (미정의)
- 연습문제: 별도 카테고리
- 번호 체계 확정 (1000번~, 알고리즘 카테고리별)
- 더 많은 문제 (퀵소트, 그래프, DP 등)

## 11. 작업/배포 흐름

- 파일 수정 후 `git push` → GitHub Pages가 main 브랜치 루트에서 자동 배포
- 캐시 이슈 잦음 → `Ctrl+Shift+R` 강력 새로고침
- Firebase API 키 노출은 GitHub Pages 특성상 불가피 → Firestore 보안 규칙으로 관리
