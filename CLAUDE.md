# 그 뭐냐 Judge

"그 뭐냐" 언어 전용 온라인 채점 사이트. GitHub Pages 정적 호스팅 + Firebase.

- 배포: https://swcho927.github.io/what_is_that/ (main 브랜치 루트 자동 배포)
- Firebase 프로젝트: `what-is-that-3cc48`
- 상세 인수인계 문서: [docs/handoff.md](docs/handoff.md) — 티어 점수표, 로드맵, Firebase 구조 등은 여기 참고

## 파일 구조

```
index.html      메인 홈
judge.html      채점 페이지 (메인 기능) — 새 문제 <script> 등록 위치
ranking.html    전체 랭킹
submissions.html 제출 기록 (전체/내 기록 토글, 정렬, 코드 보기 모달)
profile.html    유저 프로필
login/signup.html
navbar.js       상단바 공통 컴포넌트 (data-ranking / data-submissions 로 버튼 노출)
style.css       공통 스타일
judge.js        인터프리터 + 채점 엔진
firestore.rules Firestore 보안 규칙(참고용 — 실제 적용은 콘솔)
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
- 채점: `submitCode(probId)` 루프 + 프로그레스 바, TLE/MLE/RE/AC 판정, specialJudge(오차 허용) 지원
- 관리자 Python 검증 모드(Pyodide) — 암호 입력 시 활성화
- `DOMContentLoaded`에서 `PROBLEMS` 객체를 읽어 사이드바·문제 페이지 자동 생성

## 새 문제 추가 절차

1. `problems/번호.js` 작성 (아래 형식)
2. `judge.html`에 `<script src="problems/번호.js"></script>` 추가
3. 정답은 **하드코딩 금지** — `solve()` 함수로 자동 계산. 시드 고정 랜덤으로 테스트케이스 생성
4. 입력은 **공백 구분** (`"1 2"`), 줄바꿈 구분 아님

```javascript
(function () {
    function solve(input) { /* 정답 계산 */ }
    var testCases = [];
    function add(input) { testCases.push({ in: input, out: solve(input) }); }
    // 고정 케이스 + 경계값 + 시드 고정 랜덤 (브론즈 50 / 실버 50 / 골드+ 60개+)
    window.PROBLEMS['번호'] = {
        id: 번호, title: "...", timeLimit: 1, memoryLimit: 256,
        tier: { name: "Bronze", level: "V" },
        description: "...", inputDesc: "...", outputDesc: "...",
        examples: [{ input: "...", output: "..." }],
        testCases: testCases,
        // specialJudge: function(output, expected) { }  // 필요 시
    };
})();
```

## 현재 문제 목록

| 파일 | 제목 | 티어 |
|---|---|---|
| 0523 | 십자인대 | Gold V |
| 1000 | A+B | Bronze V |
| 1001 | A−B | Bronze V |
| 1002 | A×B | Bronze V |
| 1003 | A÷B | Silver IV |
| 1006 | 피보나치 수 | Silver V |
| 1991 | Stalin Sort | Bronze II |
| 2000 | 정렬 | Silver I |
| 3000 | 정렬 | Platinum V |
| 9000 | 한로로와 싸이 | Silver IV |
| 9001 | 파도의 만가 | Gold II |

## 주의사항

- `window.PROBLEMS = {}` 선언이 `problems/*.js`보다 먼저 실행돼야 함 → `judge.html` `<head>` 인라인 스크립트에 있음
- `precompile()` 때문에 `있잖아`(goto)는 컴파일된 줄 번호 기준으로 점프
- 캐시 이슈 잦음 — 변경 확인 시 `Ctrl+Shift+R` 강력 새로고침
- Firebase API 키는 코드에 노출됨 (GitHub Pages 특성상 불가피, Firestore 보안 규칙으로 관리)
- 커밋/푸시는 라이브 사이트에 즉시 반영되니 중요한 변경은 푸시 전 확인

## 알려진 이슈

- `problems/9000.js`(한로로와 싸이)가 `judge.html`에 `<script>` 등록 안 됨 — 사이트에 안 보임. 의도된 건지 누락인지 확인 필요.
