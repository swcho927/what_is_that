// ════════════════════════════════════════════════
//  problems/1009.js  ─  성적 (그뭐냐 언어)
//
//  점수를 입력 받아 학점 출력
//  Bronze III → 모든 등급 경계값 + 시드 고정 랜덤, 점수 오름차순 정렬
// ════════════════════════════════════════════════
(function () {

    function solve(input) {
        var s = parseInt(input.trim());
        if (s >= 90) return "A+";
        if (s >= 85) return "A0";
        if (s >= 80) return "A-";
        if (s >= 75) return "B+";
        if (s >= 70) return "B0";
        if (s >= 65) return "B-";
        if (s >= 60) return "C+";
        if (s >= 55) return "C0";
        if (s >= 50) return "C-";
        if (s >= 45) return "D+";
        if (s >= 40) return "D0";
        if (s >= 35) return "D-";
        return "F";
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

    function add(s) { return { in: String(s), out: solve(String(s)) }; }

    var testCases = [];

    // ── 모든 등급 경계값 (임계값과 그 직전) ──────
    [90, 89, 85, 84, 80, 79, 75, 74, 70, 69, 65, 64,
     60, 59, 55, 54, 50, 49, 45, 44, 40, 39, 35, 34,
     0, 100].forEach(function (s) {
        testCases.push(add(s));
    });

    // ── 시드 고정 랜덤 ───────────────────────────
    for (var i = 1; i <= 40; i++) {
        var rng = makeRng(i);
        testCases.push(add(randRange(rng, 0, 100)));
    }

    // ── 점수 오름차순 정렬 ───────────────────────
    testCases.sort(function (x, y) { return parseInt(x.in) - parseInt(y.in); });

    // 중복 제거
    var seen = new Set();
    testCases = testCases.filter(function (tc) {
        if (seen.has(tc.in)) return false;
        seen.add(tc.in); return true;
    });

    window.PROBLEMS['1009'] = {

        id:          "1009",
        title:       "성적",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "I" },

        description: `인과영에서는 원점수에 따라 학점이 결정된다. 다음은 학점의 경계값과 그에 따른 학점이다.

90점 이상: A+
85점 이상: A0
80점 이상: A-
75점 이상: B+
70점 이상: B0
65점 이상: B-
60점 이상: C+
55점 이상: C0
50점 이상: C-
45점 이상: D+
40점 이상: D0
35점 이상: D-
그 미만: F`,
        inputDesc:   `첫째 줄에 점수 N이 주어진다. (0 ≤ N ≤ 100)`,
        outputDesc:  `학점을 출력한다.`,

        examples: [
            { input: "92", output: "A+" },
            { input: "34", output: "F"  },
        ],

        testCases: testCases,
    };
})();
