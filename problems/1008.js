// ════════════════════════════════════════════════
//  problems/1008.js  ─  +-0 (그뭐냐 언어)
//
//  수 하나를 입력 받아 부호 출력: 양수 +, 음수 -, 0 이면 0
//  Bronze IV → 경계값 + 시드 고정 랜덤, |N| 오름차순 정렬
// ════════════════════════════════════════════════
(function () {

    function solve(input) {
        var n = parseInt(input.trim());
        if (n > 0) return "+";
        if (n < 0) return "-";
        return "0";
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
    [0, 1, -1, 2, -2, 100, -100, 99999, -99999, 100000, -100000,
     7, -7, 50, -50, 12345, -12345].forEach(function (n) {
        testCases.push(add(n));
    });

    // ── 시드 고정 랜덤 (양수/음수 섞임) ──────────
    for (var i = 1; i <= 40; i++) {
        var rng  = makeRng(i);
        var mag  = randRange(rng, 1, 100000);
        var sign = (rng() % 2) === 0 ? 1 : -1;
        testCases.push(add(sign * mag));
    }

    // ── |N| 오름차순 정렬 ────────────────────────
    testCases.sort(function (x, y) {
        return Math.abs(parseInt(x.in)) - Math.abs(parseInt(y.in));
    });

    // 중복 제거
    var seen = new Set();
    testCases = testCases.filter(function (tc) {
        if (seen.has(tc.in)) return false;
        seen.add(tc.in); return true;
    });

    window.PROBLEMS['1008'] = {

        id:          "1008",
        title:       "+-0",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "IV" },

        description: `정수 N이 주어졌을 때, N이 양수면 +, 음수면 -, 0이면 0을 출력하시오.`,
        inputDesc:   `첫째 줄에 정수 N이 주어진다. (-100,000 ≤ N ≤ 100,000)`,
        outputDesc:  `N이 양수면 "+", 음수면 "-", 0이면 "0"을 출력한다.`,

        examples: [
            { input: "5",  output: "+" },
            { input: "-3", output: "-" },
        ],

        testCases: testCases,
    };
})();
