# 그 뭐냐 Judge

"그 뭐냐" 언어 전용 온라인 채점 사이트. GitHub Pages 정적 호스팅 + Firebase.

- 배포: https://swcho927.github.io/what_is_that/ (main 브랜치 루트 자동 배포)
- Firebase 프로젝트: `what-is-that-3cc48`
- 상세 인수인계 문서: [docs/handoff.md](docs/handoff.md) — 티어 점수표, 로드맵, Firebase 구조 등은 여기 참고

## 파일 구조

```
index.html       메인 홈
judge.html       채점 페이지 (메인 기능) — 새 문제 <script> 등록 위치
ranking.html     전체 랭킹
submissions.html 제출 현황 (전체/문제별, 정렬, 코드 모달, 푼 사람만 코드 열람)
profile.html     유저 프로필
login/signup.html
navbar.js        상단바 공통 컴포넌트 (data-* 속성으로 버튼 노출)
firebase.js      Firebase 앱 초기화 (config 노출 — 정상)
idalias.js       문제 번호 별칭(normId)·정렬(compareProbId) 공유 모듈
style.css        공통 스타일
judge.js         인터프리터 + 채점 엔진 + 제출 기록 저장
firestore.rules  Firestore 보안 규칙 (참고용 — 실제 적용은 콘솔 게시)
problems/번호.js  문제별 solver + 테스트케이스
```

## 그 뭐냐 언어 문법

| 문법 | 의미 | 문법 | 의미 |
|---|---|---|---|
| `그+` | 숫자 리터럴(그 개수=값) | `뭐더라` | 대입 `<주소> 뭐더라 <수식>` |
| `그+거+` | 메모리 주소 접근 | `뭐지` / `뭐냐` | 숫자 입력 / 출력 |
| `아...어` | 괄호(수식) | `진짜뭐지` / `진짜뭐냐` | 문자 입출력(ASCII) |
| `아...어거` | 수식 결과를 주소로 메모리 접근 | `있잖아 <수식>` | 상대 점프(goto) |
| `아어거` | memory[0] 접근 | `#` | 주석 |

연산: `,` 덧셈 · `,,` 뺄셈 · `.` 곱셈 · `..` 나눗셈(내림) · `...` 나머지 · `~` 같음 · `;` 큰지 · `;;` 크거나 같은지

## judge.js 핵심

- 인터프리터: `tokenizeLine` → `getValFromTokens`(재귀 하강 파서) → `precompile`(속도 최적화) → `runCode`(Map 기반 메모리)
- `parseAtom`은 `어` 토큰을 만나면 소비 없이 0 반환 (`아어거`=memory[0] 처리)
- `runCode(code, input, timeLimitMs, memLimitMB)` 반환: `{ output, verdict, time, mem }`
  - `verdict`: `"AC"` | `"TLE"` | `"MLE"` | `"RE: ..."`
  - `time`: `Date.now()` 기반 ms (1ms 미만이면 0으로 찍힘 — 측정 한계)
  - `mem`: **사용한 메모리 칸 수 × 8 byte** (실제 RAM 아님, 인터프리터 자체 지표). MLE 판정도 이 기준
  - 입력: `뭐지`(숫자)와 `진짜뭐지`(문자)가 커서(`inputPos`) 공유. 숫자는 공백 구분 토큰, **문자는 공백·엔터 포함 raw 한 글자씩** 읽음
- 채점: `submitCode(probId)` 루프 + 프로그레스 바, TLE/MLE/RE/AC 판정, specialJudge(오차 허용) 지원
  - 모든 테스트케이스의 최대 time·mem을 모아 채점 후 `recordSubmission()`으로 제출 기록 저장(성공/실패 모두)
- 관리자 Python 검증 모드(Pyodide) — 암호 입력 시 활성화 (이 모드는 제출 기록 저장 안 함)
- `DOMContentLoaded`에서 `PROBLEMS` 객체를 읽어 사이드바·문제 페이지 자동 생성
- 문제 딥링크: `judge.html?prob=번호` 로 들어오면 해당 문제 탭 자동 활성화

## 제출 현황 (submissions.html)

- 상단바 "제출 현황" 버튼 → **전체 기록**, 문제 페이지의 "제출 현황" 버튼(`?problem=번호`) → **그 문제만**
- 전체/내 기록 토글, 사용시간·코드길이·제출시간 정렬(▲▼), 행 클릭 시 코드 모달
- 표/모달에서 **문제 번호 클릭** → `judge.html?prob=`, **닉네임 클릭** → `profile.html?uid=`
- **코드 길이는 UTF-8 byte(B)** 단위 (글자 수 아님 — 한글 1자=3B)
- **코드 열람 제한 (안티치트)**: 그 문제를 **푼 사람만** 코드를 볼 수 있음
  - 코드는 `submissions/{id}/private/code` 서브문서로 분리 저장 (메타 문서엔 코드 없음)
  - 보안 규칙이 "읽는 사람의 `solvedProblems`에 그 문제가 있을 때만" 서브문서 읽기 허용 → 안 푼 문제 코드는 네트워크로도 안 내려옴
  - `openCode()`는 푼 경우에만 서브문서를 조회. 안 푼 경우 "🔒 해결한 문제의 코드만 열람할 수 있어요." 표시
  - 구버전 기록(메타에 `code` 필드가 있던 것)은 메타의 코드로 폴백 표시 — 단 이들은 여전히 공개 노출됨

## Firebase / Firestore

```
users/{uid}/        nickname, email, joinedAt, solvedProblems:["1000",...]  // 맞은 문제 ID(문자열)
submissions/{id}/   uid, nickname, problemId, problemTitle, verdict, success,
                    timeMs, memBytes, codeLength(byte), submittedAt           // 메타(공개)
  private/code/     code, problemId, uid                                      // 코드(읽기 제한)
```

- 레이팅 = `solvedProblems` 각 문제 티어 점수 합산 (점수표는 handoff.md / ranking.html)
- **규칙 게시 필수**: `firestore.rules` 내용을 Firebase 콘솔 → Firestore → 규칙에 붙여넣고 **게시**해야 제출 기록·코드 열람이 동작함. 코드만 푸시하면 적용 안 됨
- Firebase config(API 키)는 코드에 노출됨 — GitHub Pages 특성상 불가피, **Firestore 보안 규칙으로 관리**

## navbar.js

- `#topbar` div의 data 속성으로 버튼 노출 제어: `data-ranking`(문제·랭킹 버튼), `data-submissions`(제출 현황 버튼), `data-no-auth`(로그인/회원가입 영역 숨김), `data-subtitle`
- 버튼 순서: 문제 · 랭킹 · 제출 현황
- **로그인 깜빡임 방지**: 인증 상태 확인(`onAuthStateChanged`) 전에는 로그인/회원가입 버튼을 숨겨두고, 확정된 뒤에만 알맞은 버튼 노출

## 새 문제 추가 절차

1. `problems/번호.js` 작성 (아래 형식)
2. `judge.html`에 `<script src="problems/번호.js"></script>` 추가
3. 정답은 **하드코딩 금지** — `solve()` 함수로 자동 계산. 시드 고정 랜덤으로 테스트케이스 생성
4. 입력은 **공백 구분** (`"1 2"`), 줄바꿈 구분 아님
5. `description`/`inputDesc`/`outputDesc`는 **백틱(`` ` ``) 템플릿 리터럴 + 실제 줄바꿈**으로 작성 (소스 줄바꿈 = 화면 줄바꿈). `<br>` 쓰지 말 것 — 렌더러가 `\n`을 `<br>`로 변환(`nl2br`). 여러 줄일 때 이어지는 줄은 들여쓰기 없이 **0열부터** 써야 앞 공백이 안 붙음. 문단 구분은 빈 줄

```javascript
(function () {
    function solve(input) { /* 정답 계산 */ }
    var testCases = [];
    function add(input) { testCases.push({ in: input, out: solve(input) }); }
    // 고정 케이스 + 경계값 + 시드 고정 랜덤 (브론즈 50 / 실버 50 / 골드+ 60개+)
    window.PROBLEMS['번호'] = {
        id: 번호, title: "...", timeLimit: 1, memoryLimit: 256,
        tier: { name: "Bronze", level: "V" },
        description: `첫 줄.
이어지는 줄은 0열부터.

빈 줄로 문단 구분.`,
        inputDesc: `...`, outputDesc: `...`,
        examples: [{ input: "...", output: "..." }],
        testCases: testCases,
        // specialJudge: function(output, expected) { }  // 필요 시
    };
})();
```

> 현재 문제 목록은 `problems/` 디렉터리와 `judge.html`의 `<script>` 등록 목록 참고.

## 문제 번호 체계 / 별칭

- 문제 번호(`id`·`PROBLEMS` 키)는 **문자열**. 숫자(`"1000"`)도, 문자 접두사(`"U0523"`)도 가능
- 정렬: `compareProbId` — **숫자 전용이 먼저(숫자순), 문자 포함이 뒤(자연순)**. 예) `1000, 2000, U0523, U1991`
- 번호 변경 시 4곳: ① `problems/파일.js`의 `PROBLEMS['키']`·`id` ② 파일명 ③ `judge.html` `<script>` ④ — 끝
- **기존 Firestore 기록 호환(선택)**: 번호를 바꿨는데 DB를 마이그레이션 안 했다면, `idalias.js`의 `ID_ALIAS`에 `"옛번호":"새번호"` 추가 → 읽을 때 `normId`로 변환해 풀이/랭킹/제출현황/성공표시가 계속 매칭됨
  - 적용 위치: judge.js(성공 마커), ranking.html·profile.html(레이팅·풀이목록), submissions.html(문제 필터·코드 게이팅)
  - **현재: `ID_ALIAS = {}` (Firestore를 새 번호로 직접 마이그레이션 완료 → 별칭 불필요)**. 마이그레이션 시 3곳 일관 변경: `users.solvedProblems`, `submissions.problemId`, `submissions/{id}/private/code.problemId`

## 주의사항

- `window.PROBLEMS = {}` 선언이 `problems/*.js`보다 먼저 실행돼야 함 → `judge.html` `<head>` 인라인 스크립트에 있음
- `precompile()` 때문에 `있잖아`(goto)는 컴파일된 줄 번호 기준으로 점프
- 캐시 이슈 잦음 — 변경 확인 시 `Ctrl+Shift+R` 강력 새로고침
- 커밋/푸시는 라이브 사이트에 즉시 반영됨. 사용자가 `cp`/`ㅇ` 하면 확인 없이 바로 `add`→`commit`→`push`
- `memory/`, `.claude/settings.local.json` 은 `.gitignore` 처리됨 (로컬 전용)

## 언어 간 공평성 메모

이 사이트는 그뭐냐 코드만 채점하므로 절대 비교는 의미 없음(내부 지표).
- **메모리**: 그뭐냐가 압도적 유리 — 칸 수×8B만 세고 런타임 오버헤드 0. (Python은 베이스만 수십 MB)
- **시간**: 그뭐냐가 불리 — JS로 한 줄씩 해석 실행이라 TLE가 잘 남. 실질 제약은 메모리가 아니라 시간

## 알려진 이슈

- `problems/9000.js`(한로로와 싸이)가 `judge.html`에 `<script>` 등록 안 됨 — 사이트에 안 보임. 의도된 건지 누락인지 확인 필요.
- 구버전 제출 기록은 코드가 메타 문서에 남아 공개 노출됨. 규칙상 타인 제출의 코드를 서브문서로 일괄 이전할 수 없어 완전 정리는 어려움(콘솔에서 옛 테스트 제출 삭제가 가장 깔끔).
- 코드 열람 차단 후 "푼 문제인데 코드 로드 실패" 시: 해당 유저의 `solvedProblems`에 문제 번호가 **문자열**로 있는지 확인 (매칭은 문자열 기준).
