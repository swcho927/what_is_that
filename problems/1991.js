(function () {

    // solver: 스탈린 정렬
    function solve(input) {
        const lines = input.trim().split('\n');
        const arr = lines[1].trim().split(/\s+/).map(Number);
        const result = [arr[0]];
        let max = arr[0];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] >= max) {
                result.push(arr[i]);
                max = arr[i];
            }
        }
        return result.join(' ');
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

    function randInt(rng, min, max) {
        return min + (rng() % (max - min + 1));
    }

    var testCases = [];

    function add(input) {
        testCases.push({ in: input, out: solve(input) });
    }

    // A. 예제 및 기본 케이스 (8)
    add("5\n3 1 4 1 5");
    add("1\n1");
    add("5\n1 2 3 4 5");
    add("5\n5 4 3 2 1");
    add("5\n1 1 1 1 1");
    add("3\n1000000 1 1000000");
    add("4\n1 3 2 4");
    add("6\n2 2 3 1 3 4");

    // B. 경계값 (10)
    add("1\n1000000");
    add("1\n1");
    add("2\n1 2");
    add("2\n2 1");
    add("2\n1 1");
    add("2\n1000000 1000000");
    add("2\n1 1000000");
    add("2\n1000000 1");
    add("3\n1 2 1");
    add("3\n1 1 2");

    // C. 극단값 (7)
    add("5\n1000000 999999 1000000 1 1000000");
    add("3\n1 1000000 1");
    add("4\n1000000 1000000 1000000 1000000");
    add("5\n1 1 1 1 1000000");
    add("5\n1000000 1 1 1 1");
    add("4\n999999 1000000 999999 1000000");
    add("3\n1 2 3");

    // D. 특수 패턴 (10)
    // 오름차순 N=10000
    var ascArr = [];
    for (var i = 1; i <= 10000; i++) ascArr.push(i);
    add("10000\n" + ascArr.join(' '));

    // 내림차순 N=10000
    var descArr = [];
    for (var i = 10000; i >= 1; i--) descArr.push(i);
    add("10000\n" + descArr.join(' '));

    // 전부 같은 값
    add("10000\n" + Array(10000).fill(500000).join(' '));

    // 첫 번째가 최댓값
    add("10000\n" + [1000000].concat(Array(9999).fill(1)).join(' '));

    // 지그재그
    var zigzag = [];
    for (var i = 0; i < 10000; i++) zigzag.push(i % 2 === 0 ? 1 : 1000000);
    add("10000\n" + zigzag.join(' '));

    // 오름차순 N=100
    var asc100 = [];
    for (var i = 1; i <= 100; i++) asc100.push(i);
    add("100\n" + asc100.join(' '));

    // 내림차순 N=100
    var desc100 = [];
    for (var i = 100; i >= 1; i--) desc100.push(i);
    add("100\n" + desc100.join(' '));

    // 전부 1
    add("10000\n" + Array(10000).fill(1).join(' '));

    // 전부 1000000
    add("10000\n" + Array(10000).fill(1000000).join(' '));

    // 계단식 증가
    var step = [];
    for (var i = 0; i < 10000; i++) step.push(Math.floor(i / 100) + 1);
    add("10000\n" + step.join(' '));

    // E. 랜덤 케이스 (25)
    var configs = [
        [1,  10,    10],
        [2,  10,    100],
        [3,  20,    1000],
        [4,  50,    10000],
        [5,  100,   100000],
        [6,  100,   1000000],
        [7,  500,   1000000],
        [8,  1000,  1000000],
        [9,  5000,  1000000],
        [10, 10000, 1000000],
        [11, 10,    1],
        [12, 100,   2],
        [13, 1000,  100],
        [14, 5000,  500],
        [15, 10000, 999999],
        [16, 10000, 1000000],
        [17, 9999,  1000000],
        [18, 8888,  1000000],
        [19, 7777,  1000000],
        [20, 6543,  1000000],
        [21, 3333,  1000000],
        [22, 2222,  1000000],
        [23, 1111,  1000000],
        [24, 4444,  1000000],
        [25, 5555,  1000000],
    ];

    configs.forEach(function(cfg) {
        var seed = cfg[0], n = cfg[1], maxVal = cfg[2];
        var rng = makeRng(seed);
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(randInt(rng, 1, maxVal));
        add(n + "\n" + arr.join(' '));
    });

    window.PROBLEMS['1991'] = {
        id:          1991,
        title:       "Stalin Sort",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Bronze", level: "II" },

        description: `20세기 초, 소련의 독재자 이오시프 스탈린은 시간 복잡도가 O(N)인 정렬을 찾고자 노력하였다. 스탈린 정렬(Stalin Sort)은 정렬 메커니즘을 어지럽히는 원소를 가차 없이 숙청하는 소련제 독특한 정렬 알고리즘이다. 오름차순 스탈린 정렬의 작동 방식은 다음과 같다.<br>배열의 첫 번째 원소는 무조건 살아남으며, 현재 배열의 '최댓값 기준'이 된다. 두 번째 원소부터 순서대로 앞의 원소(현재까지 살아남은 원소 중 최댓값)와 비교한다. 만약 검사 중인 원소가 현재 최댓값 기준보다 크거나 같다면, 정렬된 상태를 유지하는 올바른 원소로 간주하여 살려두고, 이 원소를 새로운 최댓값 기준으로 갱신한다. 만약 검사 중인 원소가 현재 최댓값 기준보다 작다면, 순서를 어지럽히는 반동 분자 원소로 간주하여 배열에서 완전히 제거한다. 배열의 끝에 도달할 때까지 위 과정을 반복한다.<br><br>길이가 N인 수열이 주어졌을 때, 이 수열에 오름차순 스탈린 정렬을 적용한 후 살아남은 원소들을 정렬된 순서대로 출력하는 프로그램을 작성하시오.`,
        inputDesc:  `첫째 줄에 원본 수열의 길이 N이 주어진다. ( 1 ≤ N ≤ 10,000 )<br>둘째 줄에는 수열을 구성하는 N개의 정수 Aᵢ 가 공백으로 구분되어 주어진다. ( 1 ≤ Aᵢ ≤ 1,000,000)`,
        outputDesc: `스탈린 정렬을 거치고 살아남은 원소들을 첫째 줄에 공백으로 구분하여 순서대로 출력한다.`,

        examples: [
            { input: "5\n3 1 4 1 5", output: "3 4 5" },
        ],

        testCases: testCases,
    };

})();