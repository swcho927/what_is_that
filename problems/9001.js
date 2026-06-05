(function () {

    function solve(a) {
        const n = a.length;
        if (n === 1) return 1;

        const L = new Array(n).fill(1);
        const R = new Array(n).fill(1);

        for (let i = 1; i < n; i++) {
            if (Math.abs(a[i] - a[i-1]) <= 1) L[i] = L[i-1] + 1;
        }
        for (let i = n-2; i >= 0; i--) {
            if (Math.abs(a[i] - a[i+1]) <= 1) R[i] = R[i+1] + 1;
        }

        let ans = 0;
        for (let i = 0; i < n; i++) ans = Math.max(ans, L[i] + R[i] - 1);

        for (let i = 1; i < n-1; i++) {
            if (Math.abs(a[i+1] - a[i-1]) <= 1) {
                ans = Math.max(ans, L[i-1] + R[i+1]);
            } else {
                ans = Math.max(ans, Math.max(L[i-1], R[i+1]));
            }
        }
        ans = Math.max(ans, R[1]);
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
    testCases.push(makeCase([100000]));

    // ── 경계값: N=2 ──
    testCases.push(makeCase([1, 1]));
    testCases.push(makeCase([1, 2]));
    testCases.push(makeCase([1, 3]));
    testCases.push(makeCase([100000, 999999]));

    // ── 경계값: N=3 ──
    testCases.push(makeCase([1, 3, 2]));
    testCases.push(makeCase([1, 5, 2]));
    testCases.push(makeCase([1, 10, 2]));
    testCases.push(makeCase([3, 1, 3]));

    // ── 특이한 케이스 ──
    testCases.push(makeCase([5, 5, 5, 5, 5]));
    testCases.push(makeCase([1, 2, 3, 5, 4, 3, 2]));
    testCases.push(makeCase([1, 2, 3, 4, 6, 5, 4, 3]));
    testCases.push(makeCase([1, 2, 3, 10, 7, 8, 9]));
    testCases.push(makeCase([3, 3, 4, 4, 3, 2, 2, 3]));
    testCases.push(makeCase([100, 1, 2, 3, 4, 5]));
    testCases.push(makeCase([1, 2, 3, 4, 5, 100]));
    testCases.push(makeCase([1, 2, 3, 100000, 4, 5, 6]));
    testCases.push(makeCase([1, 10, 1, 10, 1, 10]));
    testCases.push(makeCase([1, 100, 200, 300, 400]));

    // ── small 랜덤 (N=3~10) ──
    for (var seed = 1; seed <= 10; seed++) {
        var rng = makeRng(seed);
        var n = randRange(rng, 3, 10);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 20));
        testCases.push(makeCase(arr));
    }

    // ── medium 랜덤 (N=100~1000) ──
    for (var seed = 100; seed <= 119; seed++) {
        var rng = makeRng(seed);
        var n = randRange(rng, 100, 1000);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 100000));
        testCases.push(makeCase(arr));
    }

    // ── large 랜덤 (N=20000~100000) ──
    for (var seed = 200; seed <= 219; seed++) {
        var rng = makeRng(seed);
        var n = randRange(rng, 20000, 100000);
        var arr = [];
        for (var j = 0; j < n; j++) arr.push(randRange(rng, 1, 100000));
        testCases.push(makeCase(arr));
    }

    // ── N=100000 극단값 ──
    testCases.push(makeCase(new Array(100000).fill(1)));
    testCases.push(makeCase(Array.from({length: 100000}, (_, i) => i + 1)));
    testCases.push(makeCase(Array.from({length: 100000}, (_, i) => 100000 - i)));
    testCases.push(makeCase(Array.from({length: 100000}, (_, i) => i % 2 === 0 ? 1 : 2)));
    testCases.push(makeCase(Array.from({length: 100000}, (_, i) => i % 2 === 0 ? 100000 : 1)));
    // 앞부분 긴 만가 + 끊김 + 뒷부분 긴 만가, 가운데 하나 제거로 연결
    (function() {
        var arr = [];
        for (var i = 0; i < 49999; i++) arr.push(i % 2 === 0 ? 1 : 2);
        arr.push(100); // 끊기는 원소
        for (var i = 0; i < 50000; i++) arr.push(i % 2 === 0 ? 1 : 2);
        testCases.push(makeCase(arr));
    })();

    // ── 시간 오래 걸리는 순 정렬 (N 오름차순) ──
    testCases.sort(function(a, b) {
        var nA = parseInt(a.in.split('\n')[0]);
        var nB = parseInt(b.in.split('\n')[0]);
        return nA - nB;
    });


    window.PROBLEMS['9001'] = {
        id:          "9001",
        title:       "파도의 만가",
        timeLimit:   2,
        memoryLimit: 256,

        tier: { name: "Gold", level: "II" },

        description: `폭풍우가 지나간 대호수에는 오래된 노래가 남는다.
항해자들은 이를 "파도의 만가"라고 부른다.
바다는 일정한 리듬으로 출렁이며,
각 파도는 고유한 높이를 가진다.
도시 전설에 따르면,
어떤 연속된 파도들은 서로 완벽하게 이어져 하나의 "만가"를 이룬다고 한다.
심심해서 대호수에 놀러온 얼척이는
주어진 파도 기록에서 가장 긴 만가를 찾아내려고 한다.
"한눈팔지 마세요. 메마른 당신에게… 파도는 반드시 밀려올 테니!"

길이 N의 수열 A가 주어진다.
연속한 구간 Aₗ~Aᵣ이 다음 조건을 만족하면 이를 만가 구간이라고 한다.
|Aᵢ - Aᵢ₋₁| ≤ 1 이 모든 l ≤ i ≤ r에 대해 성립한다.
즉, 인접한 파도의 높이 차이가 모두 1 이하인 구간이다.

당신은 다음 두 작업을 최대 한 번씩 수행할 수 있다.
- 어떤 원소 하나를 제거한다.
- 또는 아무 작업도 하지 않는다.

원소를 제거하지 않거나 하나 제거한 뒤, 남은 수열에서 만들 수 있는 가장 긴 만가 구간의 길이를 구하여라.`,

        inputDesc:  `첫째 줄에 정수 N이 주어진다. (1 ≤ N ≤ 100,000)
둘째 줄에 수열 A₁, A₂, ..., Aₙ이 주어진다. (1 ≤ Aᵢ ≤ 100,000)`,

        outputDesc: `조건을 만족하는 가장 긴 만가 구간의 길이를 출력한다.`,

        examples: [
            { input: "8\n1 2 3 7 4 5 6 7", output: "7" },
            { input: "5\n1 5 9 13 17",     output: "1" },
        ],

        testCases: testCases,
    };

})();