// ════════════════════════════════════════════════
//  problems/1002.js  ─  A×B (그뭐냐 언어)
//
//  범위: 1 ≤ A, B ≤ 10,000
//  총 50개 (경계값 6 + 랜덤 44)
// ════════════════════════════════════════════════
(function () {

    // 정답 계산
    function solve(a, b) {
        return String(a * b);
    }

    // mt19937_64 시뮬레이션
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

    var testCases = [];

    // 경계값 6개
    [
        [1,     1    ],  // 최솟값 * 최솟값 = 1
        [10000, 10000],  // 최댓값 * 최댓값 = 100,000,000
        [1,     10000],  // 최솟값 * 최댓값
        [10000, 1    ],  // 최댓값 * 최솟값
        [1,     2    ],  // 작은 값
        [100,   100  ],  // 중간 제곱
    ].forEach(function (p) {
        testCases.push({ in: p[0] + " " + p[1], out: solve(p[0], p[1]) });
    });

    // 랜덤 케이스 44개
    for (var seed = 1; seed <= 44; seed++) {
        var rng = makeRng(seed);
        var a = randRange(rng, 1, 10000);
        var b = randRange(rng, 1, 10000);
        testCases.push({ in: a + " " + b, out: solve(a, b) });
    }

    window.PROBLEMS['1002'] = {

        id:          "1002",
        title:       "A×B",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "V" },

        description: `두 정수를 입력 받아 두 수의 곱을 출력하시오.`,
        inputDesc:   `첫째 줄에 A, B가 공백으로 구분하여 주어진다. (1 ≤ A, B ≤ 10,000)`,
        outputDesc:  `첫째 줄에 A × B의 값을 출력한다.`,

        examples: [
            { input: "3 4", output: "12" },
            { input: "10000 10000", output: "100000000" },
        ],

        testCases: testCases,
    };
})();