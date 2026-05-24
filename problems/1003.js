// ════════════════════════════════════════════════
//  problems/1003.js  ─  A÷B (그뭐냐 언어)
//
//  범위: 1 ≤ A, B ≤ 10,000
//  출력: 소수점 9자리까지 내림 (floor)
//  총 50개 (경계값 8 + 랜덤 42)
//  specialJudge: 소수점 10자리에서 비교 (반올림 허용)
// ════════════════════════════════════════════════
(function () {

    function solve(a, b) {
        const integer = Math.floor(a / b);
        let remainder = a % b;
        let decimal = "";
        for (let i = 0; i < 9; i++) {
            remainder *= 10;
            decimal += Math.floor(remainder / b);
            remainder = remainder % b;
        }
        return integer + "." + decimal;
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

    var testCases = [];

    [
        [1,     1    ],
        [1,     2    ],
        [1,     3    ],
        [2,     3    ],
        [1,     10000],
        [10000, 1    ],
        [10000, 10000],
        [10000, 3    ],
    ].forEach(function (p) {
        testCases.push({ in: p[0] + " " + p[1], out: solve(p[0], p[1]) });
    });

    for (var seed = 1; seed <= 42; seed++) {
        var rng = makeRng(seed);
        var a = randRange(rng, 1, 10000);
        var b = randRange(rng, 1, 10000);
        testCases.push({ in: a + " " + b, out: solve(a, b) });
    }

    window.PROBLEMS['1003'] = {

        id:          1003,
        title:       "A÷B",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Silver", level: "V" },

        description: "두 정수를 입력 받아 두 수의 나눗셈 결과를 출력하시오.",
        inputDesc:   "첫째 줄에 A, B가 공백으로 구분하여 주어진다. (1 ≤ A, B ≤ 10,000)",
        outputDesc:  "첫째 줄에 A ÷ B의 값을 소수점 9자리까지 출력한다.<br>정답과의 오차가 10⁻⁷ 이하이면 정답으로 인정한다.",

        examples: [
            { input: "1 2", output: "0.500000000" },
            { input: "1 3", output: "0.333333333" },
        ],

        specialJudge: function(output, expected) {
            var userVal     = parseFloat(output);
            var expectedVal = parseFloat(expected);
            if (isNaN(userVal)) return false;
            return Math.abs(userVal - expectedVal) < 1e-7;
        },

        testCases: testCases,
    };
})();