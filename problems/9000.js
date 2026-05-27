// ════════════════════════════════════════════════
//  problems/9000.js  ─  한로로와 싸이 (그뭐냐 언어)
//
//  부분 수열 판별 문제
//  총 50개
// ════════════════════════════════════════════════
(function () {

    function solve(n, m) {
        var j = 0;
        for (var i = 0; i < n.length && j < m.length; i++) {
            if (n[i] === m[j]) j++;
        }
        return j === m.length ? "1" : "0";
    }

    function makeCase(n, m) {
        return {
            in:  n.length + " " + m.length + "\n" + n + "\n" + m,
            out: solve(n, m)
        };
    }

    var testCases = [];


    testCases.push(makeCase("aabdce", "abc"));
    testCases.push(makeCase("hello", "world"));
    testCases.push(makeCase("난옵널옵버옵리옵옵지옵않옵아옵", "난널버리지않아"));

    // 경계값: 완전 동일
    testCases.push(makeCase("a", "a"));
    testCases.push(makeCase("abc", "abc"));
    testCases.push(makeCase("hello world", "hello world"));

    // 경계값: M이 N의 앞부분
    testCases.push(makeCase("abcdef", "abc"));
    testCases.push(makeCase("hello world", "hello"));

    // 경계값: M이 N의 뒷부분
    testCases.push(makeCase("abcdef", "def"));
    testCases.push(makeCase("hello world", "world"));

    // 경계값: M이 N에서 간격을 두고 존재
    testCases.push(makeCase("aXbXcX", "abc"));
    testCases.push(makeCase("한로로와싸이", "한로로"));
    testCases.push(makeCase("강남스타일abc", "강남abc"));

    // 경계값: 불가능한 케이스
    testCases.push(makeCase("abc", "d"));
    testCases.push(makeCase("abcdef", "fed"));
    testCases.push(makeCase("hello", "world"));
    testCases.push(makeCase("abc", "abcd"));
    testCases.push(makeCase("강남스타일", "스타일강남"));

    // 경계값: 길이 1
    testCases.push(makeCase("a", "a"));
    testCases.push(makeCase("z", "z"));
    testCases.push(makeCase("a", "b"));

    // 경계값: 공백 포함
    testCases.push(makeCase("a b c", "abc"));
    testCases.push(makeCase("a b c", "a b"));
    testCases.push(makeCase("hello world", "hlo ol"));
    testCases.push(makeCase("a b c d e", "ace"));

    // 경계값: 숫자 포함
    testCases.push(makeCase("a1b2c3", "123"));
    testCases.push(makeCase("a1b2c3", "abc"));
    testCases.push(makeCase("1234567890", "13579"));
    testCases.push(makeCase("1234567890", "02468"));

    // 경계값: 대소문자
    testCases.push(makeCase("AaBbCc", "ABC"));
    testCases.push(makeCase("AaBbCc", "abc"));
    testCases.push(makeCase("Hello World", "HW"));
    testCases.push(makeCase("Hello World", "hw"));

    // 경계값: N과 M 길이 최대
    testCases.push(makeCase(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstu",
        "abcdefghijklmnopqrstuvwxyz"
    ));
    testCases.push(makeCase(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstu",
        "zyxwvutsrqponmlkjihgfedcba"
    ));

    // 한글 다양한 케이스
    testCases.push(makeCase("나는야슈퍼스타", "슈퍼스타"));
    testCases.push(makeCase("나는야슈퍼스타", "나는야"));
    testCases.push(makeCase("나는야슈퍼스타", "나스타"));
    testCases.push(makeCase("나는야슈퍼스타", "스나타"));
    testCases.push(makeCase("싸이의강남스타일", "강남스타일"));
    testCases.push(makeCase("싸이의강남스타일", "싸이강스"));
    testCases.push(makeCase("한로로와싸이의콜라보", "한로로콜라보"));
    testCases.push(makeCase("한로로와싸이의콜라보", "싸이한로로"));
    testCases.push(makeCase("인천대학교축제현장", "축제현장"));
    testCases.push(makeCase("인천대학교축제현장", "인천현장"));

    // 혼합 케이스
    testCases.push(makeCase("Hello 한로로 World", "한로로"));
    testCases.push(makeCase("Hello 한로로 World", "Hello World"));
    testCases.push(makeCase("abc한글123", "한글"));
    testCases.push(makeCase("abc한글123", "a한1"));
    testCases.push(makeCase("abc한글123", "한abc"));
    testCases.push(makeCase("강남 Style 1234", "Style"));
    testCases.push(makeCase("강남 Style 1234", "남ty14"));
    testCases.push(makeCase("강남 Style 1234", "Style 5678"));
    

    window.PROBLEMS['9000'] = {

        id:          9000,
        title:       "한로로와 싸이",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Silver", level: "IV" },

        description:
            "인천대학교 축제 현장, 가수 한로로가 무대에서 열정적인 공연을 펼치고 있었다. " + 
            "그런데 갑자기 가수 싸이가 무대 위로 난입하면서 사건이 발생했다. " + 
            "싸이의 엄청난 에너지 때문에 한로로의 곡 가사 중간중간에 싸이의 강렬한 추임새가 무작위로 끼어들어 가게 된 것이다! " + 
            "인천대 축제에 가지 못해 방구석에서 아쉬워하던 얼척이는, 이 상황을 컴퓨터로 분석해 보기로 했다. " + 
            "얼척이의 목표는 원래의 가사 문장과 추임새가 섞인 문장이 주어졌을 때, 섞인 문장에서 불필요한 문자열을 적절히 제거하여 원래의 가사를 복원할 수 있는지 판별하는 프로그램을 만드는 것이다.<br>" + 
            "두 개의 문자열 N과 M이 주어졌을 때, 문자열 N에서 적절히 글자를 제거하여 문자열 M을 만들 수 있는지 판단하는 프로그램을 작성하시오. " + 
            "단, 글자를 제거할 때 남아있는 문자들의 순서는 유지되어야 한다.",

        inputDesc:
            "첫째 줄에 문자열 N의 길이 dₙ, 문자열 M의 길이 dₘ이 주어진다. (1 ≤ dₘ ≤ dₙ ≤ 100)<br>" +
            "둘째 줄에 추임새가 포함된 문자열 N이 주어진다.<br>" +
            "셋째 줄에 원래 가사 문자열 M이 주어진다.<br>" +
            "N과 M은 한글, 영문 대소문자, 숫자, 공백으로만 이루어져 있다.<br>",

        outputDesc:
            "N에서 글자를 적절히 제거하여 M을 만들 수 있다면 1, 만들 수 없다면 0을 출력한다.",

        examples: [
            { input: "6 3\naabdce\nabc",        output: "1" },
            { input: "5 5\nhello\nworld",         output: "0" },
            { input: "7 5\n난옵널옵버옵리옵옵지옵않옵아옵\n난널버리지않아", output: "1" },
        ],

        testCases: testCases,
    };
})();