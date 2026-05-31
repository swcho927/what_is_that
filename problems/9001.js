(function () {

    function solve(a) {
        const n = a.length;
        if (n === 1) return 1;

        // L[i]: i에서 왼쪽으로 만가 구간 길이
        // R[i]: i에서 오른쪽으로 만가 구간 길이
        const L = new Array(n).fill(1);
        const R = new Array(n).fill(1);

        for (let i = 1; i < n; i++) {
            if (Math.abs(a[i] - a[i-1]) <= 1) L[i] = L[i-1] + 1;
        }
        for (let i = n-2; i >= 0; i--) {
            if (Math.abs(a[i] - a[i+1]) <= 1) R[i] = R[i+1] + 1;
        }

        // 제거 안 하는 경우
        let ans = 0;
        for (let i = 0; i < n; i++) ans = Math.max(ans, L[i] + R[i] - 1);

        // i번 원소 제거하는 경우
        for (let i = 1; i < n-1; i++) {
            if (Math.abs(a[i+1] - a[i-1]) <= 1) {
                ans = Math.max(ans, L[i-1] + R[i+1]);
            } else {
                ans = Math.max(ans, Math.max(L[i-1], R[i+1]));
            }
        }
        // 첫 번째 원소 제거
        ans = Math.max(ans, R[1]);
        // 마지막 원소 제거
        ans = Math.max(ans, L[n-2]);

        return ans;
    }

    function makeCase(a) {
        return {
            in:  a.length + '\n' + a.join(' '),
            out: String(solve(a))
        };
    }

    function makeRng(seed) {
        let s = BigInt(seed);
        return function() {
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

    // ── 경계값: N=1 ──
    testCases.push(makeCase([1]));
    testCases.push(makeCase([1000000]));

    // ── 경계값: N=2 ──
    testCases.push(makeCase([1, 1]));
    testCases.push(makeCase([1, 2]));
    testCases.push(makeCase([1, 3]));
    testCases.push(makeCase([1000000, 999999]));

    // ── 경계값: N=3 ──
    testCases.push(makeCase([1, 3, 2]));   // 가운데 제거하면 |2-1|=1 OK → 3
    testCases.push(makeCase([1, 5, 2]));   // 가운데 제거해도 |2-1|=1 OK → 2? no 3
    testCases.push(makeCase([1, 10, 2]));  // 가운데 제거, |2-1|=1 → 2
    testCases.push(makeCase([3, 1, 3]));   // 가운데 제거, |3-3|=0 → 2

    // ── 특이한 케이스 ──
    // 모두 같은 값
    testCases.push(makeCase([5, 5, 5, 5, 5]));
    testCases.push(makeCase(new Array(100).fill(7)));

    // 오름차순 연속
    testCases.push(makeCase([1, 2, 3, 4, 5]));
    testCases.push(makeCase(Array.from({length: 100}, (_, i) => i + 1)));

    // 내림차순 연속
    testCases.push(makeCase([5, 4, 3, 2, 1]));
    testCases.push(makeCase(Array.from({length: 100}, (_, i) => 100 - i)));

    // 지그재그 (차이 항상 1)
    testCases.push(makeCase([1, 2, 1, 2, 1, 2, 1]));
    testCases.push(makeCase(Array.from({length: 100}, (_, i) => i % 2 === 0 ? 1 : 2)));

    // 차이가 딱 1인 구간 두 개, 가운데 하나 제거하면 연결
    testCases.push(makeCase([1, 2, 3, 5, 4, 3, 2]));  // 3→5 끊김, 5 제거하면 |4-3|=1
    testCases.push(makeCase([1, 2, 3, 4, 6, 5, 4, 3]));

    // 제거해도 안 이어지는 케이스
    testCases.push(makeCase([1, 2, 3, 10, 7, 8, 9]));

    // 전체가 만가 (제거 불필요)
    testCases.push(makeCase([3, 3, 4, 4, 3, 2, 2, 3]));

    // 첫 원소 제거가 최적
    testCases.push(makeCase([100, 1, 2, 3, 4, 5]));
    testCases.push(makeCase([50, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

    // 마지막 원소 제거가 최적
    testCases.push(makeCase([1, 2, 3, 4, 5, 100]));
    testCases.push(makeCase([1, 2, 3, 4, 5, 6, 7, 8, 9, 50]));

    // 극단값 포함
    testCases.push(makeCase([1, 2, 3, 1000000, 4, 5, 6]));
    testCases.push(makeCase([1000000, 1, 2, 3, 4, 5]));
    testCases.push(makeCase([1, 2, 3, 4, 5, 1000000]));

    // 답이 1인 케이스
    testCases.push(makeCase([1, 10, 1, 10, 1, 10]));
    testCases.push(makeCase([1, 100, 200, 300, 400]));

    // ── small 랜덤 (N=3~10) ──
    for (var seed = 1; seed <= 15; seed++) {
        var rng = makeRng(seed);
        var n = randRange(rng, 3, 10);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 20));
        testCases.push(makeCase(arr));
    }

    // ── medium 랜덤 (N=20~50) ──
    for (var seed = 100; seed <= 114; seed++) {
        var rng = makeRng(seed);
        var n = randRange(rng, 20, 50);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 100));
        testCases.push(makeCase(arr));
    }

    // ── large 랜덤 (N=80~100) ──
    for (var seed = 200; seed <= 214; seed++) {
        var rng = makeRng(seed);
        var n = randRange(rng, 80, 100);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 1000000));
        testCases.push(makeCase(arr));
    }

    // ── N=100 극단값 ──
    testCases.push(makeCase(new Array(100).fill(1)));
    testCases.push(makeCase(Array.from({length: 100}, (_, i) => i % 2 === 0 ? 1000000 : 1)));
    testCases.push(makeCase(Array.from({length: 100}, (_, i) => i % 2 === 0 ? 1 : 1000000)));

    // ── 시간 오래 걸리는 순 정렬 (N 오름차순 → 작은 게 먼저) ──
    testCases.sort(function(a, b) {
        var nA = parseInt(a.in.split('\n')[0]);
        var nB = parseInt(b.in.split('\n')[0]);
        return nA - nB;
    });


    window.PROBLEMS['9001'] = {
        id:          9001,
        title:       "파도의 만가",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Gold", level: "IV" },

        description: `폭풍우가 지나간 대호수에는 오래된 노래가 남는다.<br>
항해자들은 이를 "파도의 만가"라고 부른다.<br>
바다는 일정한 리듬으로 출렁이며,<br>
각 파도는 고유한 높이를 가진다.<br>
도시 전설에 따르면,<br>
어떤 연속된 파도들은 서로 완벽하게 이어져 하나의 "만가"를 이룬다고 한다.<br>
심심해서 대호수에 놀러온 얼척이는<br>
주어진 파도 기록에서 가장 긴 만가를 찾아내려고 한다.<br>
"한눈팔지 마세요. 메마른 당신에게… 파도는 반드시 밀려올 테니!"<br><br>
길이 N의 수열 A가 주어진다.<br>
연속한 구간 Aₗ~Aᵣ이 다음 조건을 만족하면 이를 만가 구간이라고 한다.<br>
|Aᵢ - Aᵢ₋₁| ≤ 1 이 모든 l ≤ i ≤ r에 대해 성립한다.<br>
즉, 인접한 파도의 높이 차이가 모두 1 이하인 구간이다.<br><br>
당신은 다음 두 작업을 최대 한 번씩 수행할 수 있다.<br>
- 어떤 원소 하나를 제거한다.<br>
- 또는 아무 작업도 하지 않는다.<br><br>
원소를 제거하지 않거나 하나 제거한 뒤, 남은 수열에서 만들 수 있는 가장 긴 만가 구간의 길이를 구하여라.`,

        inputDesc:  `첫째 줄에 정수 N이 주어진다.<br>둘째 줄에 수열 A₁, A₂, ..., Aₙ이 주어진다.`,

        outputDesc: `조건을 만족하는 가장 긴 만가 구간의 길이를 출력한다.`,

        examples: [
            { input: "8\n1 2 3 7 4 5 6 7", output: "7" },
            { input: "5\n1 5 9 13 17",     output: "1" },
        ],

        testCases: testCases,
    };

})();