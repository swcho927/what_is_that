// ════════════════════════════════════════════════
//  problems/1000.js  ─  A+B (그뭐냐 언어)
//
//  correct_basic.cpp JS 변환 → solver
//  generator_random.cpp JS 변환 → 랜덤 케이스
//  범위: 1 ≤ A, B ≤ 10,000
//  총 50개 (경계값 4 + 랜덤 46)
// ════════════════════════════════════════════════
(function () {

    // correct_basic 변환: 정답 계산
    function solve(a, b) {
        return String(a + b);
    }

    // generator_random 변환: mt19937_64 시뮬레이션
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

    // 경계값 4개
    [
        [1, 1], [1, 10000], [10000, 1], [10000, 10000],
    ].forEach(function (p) {
        testCases.push({ in: p[0] + " " + p[1], out: solve(p[0], p[1]) });
    });

    // 랜덤 케이스 46개
    for (var seed = 1; seed <= 46; seed++) {
        var rng = makeRng(seed);
        var a = randRange(rng, 1, 10000);
        var b = randRange(rng, 1, 10000);
        testCases.push({ in: a + " " + b, out: solve(a, b) });
    }

    window.PROBLEMS['1000'] = {

        id:          1000,
        title:       "A+B",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "V" },

        description: `두 정수를 입력 받아 두 수의 합을 출력하시오.`,
        inputDesc:   `첫째 줄에 A, B가 공백으로 구분하여 주어진다. (1 ≤ A, B ≤ 10,000)`,
        outputDesc:  `첫째 줄에 A + B의 값을 출력한다.`,

        examples: [
            { input: "1 2", output: "3" },
            { input: "100 200", output: "300" },
        ],

        testCases: testCases,
    };
})();


// 그거 뭐지
// 그그거 뭐지
// 그거,그그거 뭐냐