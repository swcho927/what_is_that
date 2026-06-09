// ════════════════════════════════════════════════
//  problems/1012.js  ─  N (그뭐냐 언어)
//
//  N 이 주어지면 1부터 N까지 한 줄에 하나씩 출력
//  Bronze IV → 경계값 + 시드 고정 랜덤, N 오름차순 정렬
// ════════════════════════════════════════════════
(function () {

    function solve(input) {
        var n = parseInt(input.trim());
        var lines = [];
        for (var i = 1; i <= n; i++) lines.push(i);
        return lines.join("\n");
    }

    function makeRng(seed) {
        let s = BigInt(seed);
        return function () {
            s ^= s << 13n; s ^= s >> 7n; s ^= s << 17n;
            s &= 0xFFFFFFFFFFFFFFFFn;
            return Number(s & 0x7FFFFFFFn);
        };
    }
    function randRange(rng, min, max) { return min + (rng() % (max - min + 1)); }

    function add(n) { return { in: String(n), out: solve(String(n)) }; }

    var testCases = [];

    // ── 경계값 ───────────────────────────────────
    [1, 2, 3, 5, 10, 100, 1000, 10000, 50000, 99999, 100000].forEach(function (n) { testCases.push(add(n)); });

    // ── 시드 고정 랜덤 (N=1~100000) 42개 ─────────
    for (var i = 1; i <= 42; i++) {
        var rng = makeRng(i);
        testCases.push(add(randRange(rng, 1, 100000)));
    }

    // ── N 오름차순 정렬 ──────────────────────────
    testCases.sort(function (x, y) { return parseInt(x.in) - parseInt(y.in); });

    // 중복 제거
    var seen = new Set();
    testCases = testCases.filter(function (tc) {
        if (seen.has(tc.in)) return false;
        seen.add(tc.in); return true;
    });

    window.PROBLEMS['1012'] = {

        id:          "1012",
        title:       "N",
        timeLimit:   2,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "IV" },

        description: `정수 N이 주어졌을 때, 1부터 N까지의 수를 한 줄에 하나씩 출력하시오.`,
        inputDesc:   `첫째 줄에 정수 N이 주어진다. (1 ≤ N ≤ 100,000)`,
        outputDesc:  `1부터 N까지의 수를 한 줄에 하나씩 차례대로 출력한다.`,

        examples: [
            { input: "3", output: "1\n2\n3" },
            { input: "1", output: "1"       },
        ],

        testCases: testCases,
    };
})();
