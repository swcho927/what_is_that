// ════════════════════════════════════════════════
//  problems/1004.js  ─  A%B (그뭐냐 언어)
//
//  Bronze V → 50개 (작은값 + 경계 + 극단 + 시드 고정 랜덤)
//  걸리는 시간(입력 크기) 오름차순 정렬
// ════════════════════════════════════════════════
(function () {

    function solve(input) {
        const t = input.trim().split(/\s+/);
        return String(parseInt(t[0]) % parseInt(t[1]));
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

    function add(a, b) { return { in: `${a} ${b}`, out: solve(`${a} ${b}`) }; }

    var testCases = [];

    // ── 작은 값 ──────────────────────────────────
    testCases.push(add(1, 1));          // 0
    testCases.push(add(1, 2));          // 1 (a < b)
    testCases.push(add(2, 2));          // 0
    testCases.push(add(3, 2));          // 1
    testCases.push(add(5, 3));          // 2
    testCases.push(add(7, 3));          // 1
    testCases.push(add(10, 3));         // 1
    testCases.push(add(10, 10));        // 0

    // ── 경계값 ───────────────────────────────────
    testCases.push(add(1, 10000));      // 1 (a < b → 결과는 a)
    testCases.push(add(10000, 1));      // 0 (b=1이면 항상 0)
    testCases.push(add(10000, 10000));  // 0 (a == b)
    testCases.push(add(9999, 10000));   // 9999 (a < b)
    testCases.push(add(10000, 9999));   // 1
    testCases.push(add(10000, 2));      // 0 (짝수)
    testCases.push(add(9999, 2));       // 1 (홀수)
    testCases.push(add(10000, 3));      // 1

    // ── b=1 (항상 0) ─────────────────────────────
    testCases.push(add(100, 1));
    testCases.push(add(9999, 1));

    // ── a가 b의 배수 (결과 0) ────────────────────
    testCases.push(add(6, 3));
    testCases.push(add(100, 10));
    testCases.push(add(10000, 100));
    testCases.push(add(10000, 25));
    testCases.push(add(9996, 4));

    // ── 시드 고정 랜덤 25개 ──────────────────────
    for (var i = 1; i <= 27; i++) {
        var rng = makeRng(i);
        var a   = randRange(rng, 1, 10000);
        var b   = randRange(rng, 1, 10000);
        testCases.push(add(a, b));
    }

    // ── 걸리는 시간(≈ 입력값 크기) 오름차순 정렬 ─
    testCases.sort(function (x, y) {
        const [a1, b1] = x.in.split(' ').map(Number);
        const [a2, b2] = y.in.split(' ').map(Number);
        return (a1 + b1) - (a2 + b2);
    });

    // 중복 제거
    var seen = new Set();
    testCases = testCases.filter(function (tc) {
        if (seen.has(tc.in)) return false;
        seen.add(tc.in); return true;
    });

    window.PROBLEMS['1004'] = {

        id:          "1004",
        title:       "A%B",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "V" },

        description: `두 정수를 입력 받아 두 수의 나머지를 출력하시오.`,
        inputDesc:   `첫째 줄에 A, B가 공백으로 구분하여 주어진다. (1 ≤ A, B ≤ 10,000)`,
        outputDesc:  `첫째 줄에 A % B의 값을 출력한다.`,

        examples: [
            { input: "8 3",     output: "2" },
            { input: "1 10000", output: "1" },
        ],

        testCases: testCases,
    };
})();
