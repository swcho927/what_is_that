// ════════════════════════════════════════════════
//  problems/1001.js  ─  A-B (그뭐냐 언어)
//
//  correct_basic.cpp JS 변환 → solver
//  generator_random.cpp JS 변환 → 랜덤 케이스
//  범위: 1 ≤ A, B ≤ 10,000 (음수 결과 허용)
//  총 50개 (경계값 6 + 랜덤 44)
// ════════════════════════════════════════════════
(function () {

    // correct_basic 변환: 정답 계산
    function solve(a, b) {
        return String(a - b);
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

    // 경계값 6개
    // 결과: 0, 양수 최대, 음수 최소, 경계 조합
    [
        [1,     1    ],  // 결과 0
        [10000, 10000],  // 결과 0
        [10000, 1    ],  // 결과 최대 양수 (9999)
        [1,     10000],  // 결과 최소 음수 (-9999)
        [1,     2    ],  // 결과 -1
        [2,     1    ],  // 결과 1
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

    window.PROBLEMS['1001'] = {

        id:          1001,
        title:       "A-B",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "V" },

        description: "두 정수를 입력 받아 두 수의 차를 출력하시오.",
        inputDesc:   "첫째 줄에 A, B가 공백으로 구분하여 주어진다. (1 ≤ A, B ≤ 10,000)",
        outputDesc:  "첫째 줄에 A - B의 값을 출력한다.",

        examples: [
            { input: "3 2", output: "1" },
            { input: "2 3", output: "-1" },
        ],

        testCases: testCases,
    };
})();