// ════════════════════════════════════════════════
//  problems/1011.js  ─  농구 (그뭐냐 언어)
//
//  2점 슛 개수 A, 3점 슛 개수 B → 총 점수 2A + 3B
//  Bronze V → 경계값 + 시드 고정 랜덤, 입력 크기 오름차순 정렬
// ════════════════════════════════════════════════
(function () {

    function solve(input) {
        var t = input.trim().split(/\s+/);
        return String(2 * parseInt(t[0]) + 3 * parseInt(t[1]));
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

    function add(a, b) { return { in: a + " " + b, out: solve(a + " " + b) }; }

    var testCases = [];

    // ── 경계값 ───────────────────────────────────
    [[0, 0], [1, 0], [0, 1], [1, 1], [1000, 0], [0, 1000],
     [1000, 1000], [1, 1000], [1000, 1], [10, 10], [500, 500]].forEach(function (p) {
        testCases.push(add(p[0], p[1]));
    });

    // ── 시드 고정 랜덤 ───────────────────────────
    for (var i = 1; i <= 39; i++) {
        var rng = makeRng(i);
        var a   = randRange(rng, 0, 1000);
        var b   = randRange(rng, 0, 1000);
        testCases.push(add(a, b));
    }

    // ── 입력 크기(A+B) 오름차순 정렬 ─────────────
    testCases.sort(function (x, y) {
        var pa = x.in.split(' ').map(Number);
        var pb = y.in.split(' ').map(Number);
        return (pa[0] + pa[1]) - (pb[0] + pb[1]);
    });

    // 중복 제거
    var seen = new Set();
    testCases = testCases.filter(function (tc) {
        if (seen.has(tc.in)) return false;
        seen.add(tc.in); return true;
    });

    window.PROBLEMS['1011'] = {

        id:          "1011",
        title:       "농구",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "IV" },

        description: `2점 슛 개수와 3점 슛 개수가 주어졌을 때, 내가 얻은 총 점수를 구하시오.`,
        inputDesc:   `첫째 줄에 2점 슛 개수 A와 3점 슛 개수 B가 공백으로 구분하여 주어진다. (0 ≤ A, B ≤ 1,000)`,
        outputDesc:  `내가 얻은 총 점수를 출력한다.`,

        examples: [
            { input: "3 2", output: "12" },
            { input: "5 0", output: "10" },
        ],

        testCases: testCases,
    };
})();
