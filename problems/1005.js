// ════════════════════════════════════════════════
//  problems/1005.js  ─  (A+B)×C (그뭐냐 언어)
//
//  Bronze V → 50개 (작은값 + 경계 + 극단 + 시드 고정 랜덤)
//  걸리는 시간(입력값 크기) 오름차순 정렬
// ════════════════════════════════════════════════
(function () {

    function solve(input) {
        const t = input.trim().split(/\s+/);
        return String((parseInt(t[0]) + parseInt(t[1])) * parseInt(t[2]));
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

    function add(a, b, c) { return { in: `${a} ${b} ${c}`, out: solve(`${a} ${b} ${c}`) }; }

    var testCases = [];

    // ── 작은 값 ──────────────────────────────────
    testCases.push(add(1, 1, 1));   // 2
    testCases.push(add(1, 2, 3));   // 9
    testCases.push(add(2, 3, 4));   // 20
    testCases.push(add(1, 1, 2));   // 4
    testCases.push(add(3, 5, 2));   // 16
    testCases.push(add(1, 9, 5));   // 50
    testCases.push(add(7, 3, 7));   // 70

    // ── C=1 (결과 = A+B) ────────────────────────
    testCases.push(add(1, 1, 1));
    testCases.push(add(100, 200, 1));
    testCases.push(add(9999, 10000, 1));

    // ── A=B (대칭) ───────────────────────────────
    testCases.push(add(5, 5, 3));
    testCases.push(add(100, 100, 100));
    testCases.push(add(1000, 1000, 1000));

    // ── 극단값 ───────────────────────────────────
    testCases.push(add(10000, 10000, 10000));  // 최대 (200,000,000)
    testCases.push(add(1, 1, 10000));          // 20,000
    testCases.push(add(10000, 10000, 1));      // 20,000
    testCases.push(add(1, 10000, 10000));      // 100,010,000
    testCases.push(add(10000, 1, 1));          // 10,001
    testCases.push(add(9999, 9999, 9999));

    // ── 시드 고정 랜덤 31개 ──────────────────────
    for (var i = 1; i <= 32; i++) {
        var rng = makeRng(i);
        var a   = randRange(rng, 1, 10000);
        var b   = randRange(rng, 1, 10000);
        var c   = randRange(rng, 1, 10000);
        testCases.push(add(a, b, c));
    }

    // ── 걸리는 시간(입력값 합) 오름차순 정렬 ─────
    testCases.sort(function (x, y) {
        const [a1,b1,c1] = x.in.split(' ').map(Number);
        const [a2,b2,c2] = y.in.split(' ').map(Number);
        return (a1+b1+c1) - (a2+b2+c2);
    });

    // 중복 제거
    var seen = new Set();
    testCases = testCases.filter(function (tc) {
        if (seen.has(tc.in)) return false;
        seen.add(tc.in); return true;
    });

    window.PROBLEMS['1005'] = {

        id:          "1005",
        title:       "(A+B)×C",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "V" },

        description: `세 정수를 입력 받아 (A+B)×C의 값을 출력하시오.`,
        inputDesc:   `첫째 줄에 A, B, C가 공백으로 구분하여 주어진다. (1 ≤ A, B, C ≤ 10,000)`,
        outputDesc:  `첫째 줄에 (A+B)×C의 값을 출력한다.`,

        examples: [
            { input: "1 2 3",   output: "9"   },
            { input: "2 3 4",   output: "20"  },
        ],

        testCases: testCases,
    };
})();
