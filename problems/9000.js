// ════════════════════════════════════════════════
//  problems/9000.js  ─  한로로와 싸이 (그뭐냐 언어)
//
//  부분 수열 판별 (N에서 글자를 지워 M을 만들 수 있는가)
//  제약: 1 ≤ dₘ ≤ dₙ ≤ 10,000, 한글/영문/숫자/공백
//  Silver IV → 60개 (작은값 + 경계 + 극단 + 특이 + 시드 고정 랜덤)
//  마지막에 걸리는 시간(≈ N 길이) 오름차순 정렬
// ════════════════════════════════════════════════
(function () {

    // ── 정답 (부분 수열 그리디) ──
    function solve(n, m) {
        var j = 0;
        for (var i = 0; i < n.length && j < m.length; i++) {
            if (n[i] === m[j]) j++;
        }
        return j === m.length ? "1" : "0";
    }

    function makeCase(n, m) {
        return {
            in:  n.length + " " + m.length + "\n" + n + "\n" + m,
            out: solve(n, m)
        };
    }

    // ── 시드 고정 난수 ──
    function makeRng(seed) {
        let s = BigInt(seed);
        return function () {
            s ^= s << 13n;
            s ^= s >> 7n;
            s ^= s << 17n;
            s &= 0xFFFFFFFFFFFFFFFFn;
            return Number(s & 0x7FFFFFFFn);
        };
    }
    function randRange(rng, min, max) { return min + (rng() % (max - min + 1)); }

    // 허용 문자 집합 (한글/영문 대소문자/숫자/공백). 공백 빈도 약간 ↑
    var POOL = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789  가나다라마바사아자차카타파하노래";
    function randChar(rng) { return POOL[rng() % POOL.length]; }
    function rep(s, k) { var r = ""; for (var i = 0; i < k; i++) r += s; return r; }

    // M을 부분 수열로 반드시 포함하는 N 생성 → 정답 "1"
    function makeYes(rng, lm, ln) {
        var chars = [];
        for (var i = 0; i < lm; i++) chars.push(randChar(rng));   // M
        var m = chars.join("");
        var extra = ln - lm;
        for (var k = 0; k < extra; k++) {                          // 랜덤 위치에 글자 삽입
            var pos = randRange(rng, 0, chars.length);
            chars.splice(pos, 0, randChar(rng));
        }
        return [chars.join(""), m];
    }

    // N, M 독립 생성 → 대부분 "0", 가끔 "1" (정답은 solve가 계산)
    function makeRandPair(rng, ln, lm) {
        var n = "", m = "";
        for (var i = 0; i < ln; i++) n += randChar(rng);
        for (var j = 0; j < lm; j++) m += randChar(rng);
        return [n, m];
    }

    var pairs = [];

    // ── 작은 값 / 길이 1~3 ──────────────────────────
    pairs.push(["a", "a"]);            // yes
    pairs.push(["a", "b"]);            // no
    pairs.push(["z", "z"]);            // yes
    pairs.push(["ab", "a"]);
    pairs.push(["ab", "b"]);
    pairs.push(["ab", "ab"]);          // dₘ=dₙ
    pairs.push(["ab", "ba"]);          // no (순서)
    pairs.push(["abc", "abc"]);        // 완전 동일
    pairs.push(["abc", "d"]);          // no
    pairs.push(["abc", "cba"]);        // no (역순)

    // ── 부분 위치 (앞/뒤/간격) ──────────────────────
    pairs.push(["aabdce", "abc"]);     // 예제1
    pairs.push(["abcdef", "abc"]);     // 앞부분
    pairs.push(["abcdef", "def"]);     // 뒷부분
    pairs.push(["aXbXcX", "abc"]);     // 간격

    // ── 문자열 / 공백 포함 (특이) ───────────────────
    pairs.push(["hello", "world"]);                 // 예제2 (no)
    pairs.push(["hello world", "hlo ol"]);
    pairs.push(["hello world", "hello world"]);     // 공백 포함 동일
    pairs.push(["a b c", "abc"]);                   // 공백 건너뛰기
    pairs.push(["a b c", "a b"]);                   // 공백 유지
    pairs.push(["a b c d e", "ace"]);

    // ── 숫자 포함 ──────────────────────────────────
    pairs.push(["a1b2c3", "123"]);
    pairs.push(["a1b2c3", "abc"]);
    pairs.push(["1234567890", "13579"]);
    pairs.push(["1234567890", "02468"]);            // no

    // ── 대소문자 구분 ──────────────────────────────
    pairs.push(["AaBbCc", "ABC"]);
    pairs.push(["AaBbCc", "abc"]);
    pairs.push(["Hello World", "HW"]);
    pairs.push(["Hello World", "hw"]);              // no

    // ── 한글 / 혼합 ────────────────────────────────
    pairs.push(["난옵널옵버옵리옵옵지옵않옵아옵", "난널버리지않아"]);  // 예제3
    pairs.push(["한로로와싸이", "한로로"]);
    pairs.push(["강남스타일", "스타일강남"]);        // no
    pairs.push(["나는야슈퍼스타", "스나타"]);        // no (순서)
    pairs.push(["싸이의강남스타일", "싸이강스"]);
    pairs.push(["abc한글123", "한abc"]);             // no
    pairs.push(["Hello 한로로 World", "Hello World"]);
    pairs.push(["강남 Style 1234", "Style"]);

    // ── 극단값 (dₙ=10000, dₘ 경계) ──────────────────
    pairs.push([rep("a", 10000), rep("a", 10000)]);             // 최대 동일 (yes)
    pairs.push([rep("a", 10000), rep("a", 9999)]);              // 하나 제거 (yes)
    pairs.push([rep("a", 10000), "b"]);                         // dₘ=1 불가 (no)
    pairs.push([rep("a", 10000), "a"]);                         // dₘ=1 가능 (yes)
    pairs.push([rep("ab", 5000), rep("b", 5000)]);              // 격자 (yes)
    pairs.push([rep("ab", 5000), rep("a", 5001)]);              // 개수 부족 (no)
    pairs.push([rep(" ", 10000), rep(" ", 5000)]);              // 공백만 (yes)
    pairs.push([rep(" ", 10000), "a"]);                         // 공백만 (no)
    pairs.push([rep("abcdefghij", 1000), "abcdefghij"]);        // 반복 속 부분 (yes)
    pairs.push([rep("abcdefghij", 1000), rep("a", 1001)]);      // 개수 부족 (no)

    // ── 시드 고정 랜덤 (yes 7 + 혼합 7) ─────────────
    for (var i = 1; i <= 7; i++) {
        var rngY = makeRng(1000 + i);
        var lm = randRange(rngY, 1, 4000);
        var ln = randRange(rngY, lm, 10000);
        pairs.push(makeYes(rngY, lm, ln));
    }
    for (var k = 1; k <= 7; k++) {
        var rngR = makeRng(2000 + k);
        var ln2 = randRange(rngR, 1, 10000);
        var lm2 = randRange(rngR, 1, ln2);
        pairs.push(makeRandPair(rngR, ln2, lm2));
    }

    // ── 최댓값 집중 (dₙ≈9000~10000): yes 10 + 혼합 10 ──
    for (var i = 1; i <= 10; i++) {
        var rngYM = makeRng(3000 + i);
        var lnM = randRange(rngYM, 9000, 10000);
        var lmM = randRange(rngYM, lnM - 500, lnM);
        pairs.push(makeYes(rngYM, lmM, lnM));
    }
    for (var k = 1; k <= 10; k++) {
        var rngRM = makeRng(4000 + k);
        var ln2M = randRange(rngRM, 9000, 10000);
        var lm2M = randRange(rngRM, 1, ln2M);
        pairs.push(makeRandPair(rngRM, ln2M, lm2M));
    }

    // ── 걸리는 시간(≈ N 길이) 오름차순 정렬 ─────────
    pairs.sort(function (a, b) {
        return (a[0].length - b[0].length) || (a[1].length - b[1].length);
    });

    var testCases = pairs.map(function (p) { return makeCase(p[0], p[1]); });

    // 예제 (길이/정답 자동 계산 → 표기 오류 방지)
    var examples = [["aabdce", "abc"], ["hello", "world"], ["난옵널옵버옵리옵옵지옵않옵아옵", "난널버리지않아"]]
        .map(function (p) { return { input: p[0].length + " " + p[1].length + "\n" + p[0] + "\n" + p[1], output: solve(p[0], p[1]) }; });

    window.PROBLEMS['9000'] = {

        id:          "9000",
        title:       "한로로와 싸이",
        timeLimit:   2,
        memoryLimit: 256,

        tier: { name: "Silver", level: "IV" },

        description: `인천대학교 축제 현장, 가수 한로로가 무대에서 열정적인 공연을 펼치고 있었다. 그런데 갑자기 가수 싸이가 무대 위로 난입하면서 사건이 발생했다. 싸이의 엄청난 에너지 때문에 한로로의 곡 가사 중간중간에 싸이의 강렬한 추임새가 무작위로 끼어들어 가게 된 것이다! 인천대 축제에 가지 못해 방구석에서 아쉬워하던 얼척이는, 이 상황을 컴퓨터로 분석해 보기로 했다. 얼척이의 목표는 원래의 가사 문장과 추임새가 섞인 문장이 주어졌을 때, 섞인 문장에서 불필요한 문자열을 적절히 제거하여 원래의 가사를 복원할 수 있는지 판별하는 프로그램을 만드는 것이다.
두 개의 문자열 N과 M이 주어졌을 때, 문자열 N에서 적절히 글자를 제거하여 문자열 M을 만들 수 있는지 판단하는 프로그램을 작성하시오. 단, 글자를 제거할 때 남아있는 문자들의 순서는 유지되어야 한다.`,

        inputDesc: `첫째 줄에 문자열 N의 길이 dₙ, 문자열 M의 길이 dₘ이 주어진다. (1 ≤ dₘ ≤ dₙ ≤ 10,000)
둘째 줄에 추임새가 포함된 문자열 N이 주어진다.
셋째 줄에 원래 가사 문자열 M이 주어진다.
N과 M은 한글, 영문 대소문자, 숫자, 공백으로만 이루어져 있다.`,

        outputDesc: `N에서 글자를 적절히 제거하여 M을 만들 수 있다면 1, 만들 수 없다면 0을 출력한다.`,

        examples: examples,

        testCases: testCases,
    };
})();
