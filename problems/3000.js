// ════════════════════════════════════════════════
//  problems/3000.js  ─  정렬 (그뭐냐 언어)
//
//  N ≤ 10,000, 1 ≤ Ai ≤ 1,000,000
//  Platinum V → 80개 (경계값 14 + 랜덤 26 + 최댓값 집중 40)
// ════════════════════════════════════════════════
(function () {

    function solve(arr) {
        return arr.slice().sort(function(a, b) { return a - b; }).join(' ');
    }

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

    function randRange(rng, min, max) {
        return min + (rng() % (max - min + 1));
    }

    function makeCase(arr) {
        return { in: arr.length + '\n' + arr.join(' '), out: solve(arr) };
    }

    var testCases = [];

    // ── 경계값 14개 ──────────────────────────────

    // N=1
    testCases.push(makeCase([1]));
    testCases.push(makeCase([1000000]));

    // N=2
    testCases.push(makeCase([1, 2]));
    testCases.push(makeCase([2, 1]));
    testCases.push(makeCase([1000000, 999999]));
    testCases.push(makeCase([1, 1000000]));

    // N=10000, 이미 정렬됨
    (function() {
        var arr = []; for (var i = 1; i <= 10000; i++) arr.push(i);
        testCases.push(makeCase(arr));
    })();

    // N=10000, 역순
    (function() {
        var arr = []; for (var i = 10000; i >= 1; i--) arr.push(i);
        testCases.push(makeCase(arr));
    })();

    // N=10000, 모두 같은 값
    (function() {
        var arr = []; for (var i = 0; i < 10000; i++) arr.push(42);
        testCases.push(makeCase(arr));
    })();

    // N=10000, 최솟값/최댓값 교차
    (function() {
        var arr = [];
        for (var i = 0; i < 5000; i++) arr.push(1);
        for (var i = 0; i < 5000; i++) arr.push(1000000);
        testCases.push(makeCase(arr));
    })();

    // N=10000, 최솟값만
    (function() {
        var arr = []; for (var i = 0; i < 10000; i++) arr.push(1);
        testCases.push(makeCase(arr));
    })();

    // N=10000, 최댓값만
    (function() {
        var arr = []; for (var i = 0; i < 10000; i++) arr.push(1000000);
        testCases.push(makeCase(arr));
    })();

    // N=10000, 교대 패턴 (1, 1000000, 1, 1000000, ...)
    (function() {
        var arr = [];
        for (var i = 0; i < 10000; i++) arr.push(i % 2 === 0 ? 1 : 1000000);
        testCases.push(makeCase(arr));
    })();

    // N=10000, 중간값 근처 밀집
    (function() {
        var arr = [];
        for (var i = 0; i < 10000; i++) arr.push(1000000 + (i % 3) - 1);
        testCases.push(makeCase(arr));
    })();

    // ── 랜덤 케이스 26개 (중간 크기 검증용, 큰 쪽 위주) ─

    // 소규모 (N=1~50): 6개
    for (var seed = 1; seed <= 6; seed++) {
        var rng = makeRng(seed);
        var n   = randRange(rng, 1, 50);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 1000000));
        testCases.push(makeCase(arr));
    }

    // 중규모 (N=51~2000): 8개
    for (var seed = 21; seed <= 28; seed++) {
        var rng = makeRng(seed);
        var n   = randRange(rng, 51, 2000);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 1000000));
        testCases.push(makeCase(arr));
    }

    // 대규모 (N=2001~10000): 12개
    for (var seed = 46; seed <= 57; seed++) {
        var rng = makeRng(seed);
        var n   = randRange(rng, 2001, 10000);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 1000000));
        testCases.push(makeCase(arr));
    }

    // ── 최댓값 집중 (N=9000~10000): 40개 — 난이도는 여기서 결정 ─
    for (var seed = 1000; seed <= 1039; seed++) {
        var rng = makeRng(seed);
        var n   = randRange(rng, 9000, 10000);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 1000000));
        testCases.push(makeCase(arr));
    }

    window.PROBLEMS['3000'] = {

        id:          "3000",
        title:       "정렬",
        timeLimit:   2,
        memoryLimit: 256,

        tier: { name: "Platinum", level: "V" },

        description: `N개의 정수가 주어졌을 때, 이를 오름차순으로 정렬하여 출력하시오.`,
        inputDesc:   `첫째 줄에 N이 주어진다. (1 ≤ N ≤ 10,000)
둘째 줄에 N개의 정수 Aᵢ가 공백으로 구분하여 주어진다. (1 ≤ Aᵢ ≤ 1,000,000)`,
        outputDesc:  `첫째 줄에 오름차순으로 정렬한 결과를 공백으로 구분하여 출력한다.`,

        examples: [
            { input: "5\n3 1 4 1 5", output: "1 1 3 4 5" },
        ],

        testCases: testCases,
    };
})();