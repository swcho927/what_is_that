// ════════════════════════════════════════════════
//  problems/2000.js  ─  정렬 (그뭐냐 언어)
//
//  correct: 버블/삽입/선택 등 N² 정렬로 통과
//  N ≤ 100, 1 ≤ Ai ≤ 1,000,000
//  총 50개 (경계값 + 랜덤)
// ════════════════════════════════════════════════
(function () {

    function solve(arr) {
        var sorted = arr.slice().sort(function(a, b) { return a - b; });
        return sorted.join(' ');
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
        return {
            in:  arr.length + '\n' + arr.join(' '),
            out: solve(arr)
        };
    }

    var testCases = [];

    // 경계값: N=1
    testCases.push(makeCase([1]));
    testCases.push(makeCase([1000000]));

    // 경계값: N=2
    testCases.push(makeCase([1, 2]));
    testCases.push(makeCase([2, 1]));
    testCases.push(makeCase([1000000, 999999]));

    // 경계값: N=100, 이미 정렬됨
    (function() {
        var arr = [];
        for (var i = 1; i <= 100; i++) arr.push(i);
        testCases.push(makeCase(arr));
    })();

    // 경계값: N=100, 역순
    (function() {
        var arr = [];
        for (var i = 100; i >= 1; i--) arr.push(i);
        testCases.push(makeCase(arr));
    })();

    // 경계값: N=100, 모두 같은 값
    (function() {
        var arr = [];
        for (var i = 0; i < 100; i++) arr.push(42);
        testCases.push(makeCase(arr));
    })();

    // 경계값: N=100, 최솟값/최댓값
    (function() {
        var arr = [];
        for (var i = 0; i < 50; i++) arr.push(1);
        for (var i = 0; i < 50; i++) arr.push(1000000);
        testCases.push(makeCase(arr));
    })();

    // 랜덤 케이스 41개
    for (var seed = 1; seed <= 41; seed++) {
        var rng = makeRng(seed);
        var n   = randRange(rng, 1, 100);
        var arr = [];
        for (var j = 0; j < n; j++) {
            arr.push(randRange(rng, 1, 1000000));
        }
        testCases.push(makeCase(arr));
    }

    window.PROBLEMS['2000'] = {

        id:          2000,
        title:       "정렬",
        timeLimit:   2,
        memoryLimit: 256,

        tier: { name: "Silver", level: "I" },

        description: "N개의 정수가 주어졌을 때, 이를 오름차순으로 정렬하여 출력하시오.",
        inputDesc:   "첫째 줄에 N이 주어진다. (1 ≤ N ≤ 100)<br>둘째 줄부터 N개의 줄에 정수 Aᵢ가 주어진다. (1 ≤ Aᵢ ≤ 1,000,000)",
        outputDesc:  "N개의 줄에 오름차순으로 정렬한 결과를 출력한다.",

        examples: [
            { input: "5\n3 1 4 1 5", output: "1 1 3 4 5" },
        ],

        testCases: testCases,
    };
})();