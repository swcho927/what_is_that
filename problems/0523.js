//  problems/0523.js  ─  얼척이를 잡아라 (그뭐냐 언어)
//
//  BFS + 점프 조건
//  1 ≤ N, M ≤ 100
//  Silver I → 67개
//  정렬: N*M 오름차순 (실행 시간 오름차순)
// ════════════════════════════════════════════════
(function () {

    // ── solver ───────────────────────────────────
    function solve(input) {
        const lines = input.trim().split('\n');
        const [N, M] = lines[0].trim().split(/\s+/).map(Number);
        const grid = [];
        let startR = -1, startC = -1;

        for (let i = 0; i < N; i++) {
            const row = lines[i+1].trim().split(/\s+/).map(Number);
            grid.push(row);
            for (let j = 0; j < M; j++) {
                if (row[j] === 3) { startR = i; startC = j; }
            }
        }

        const visited = Array.from({length: N}, () => Array(M).fill(false));
        const queue   = [[startR, startC]];
        visited[startR][startC] = true;
        const dr = [-1,1,0,0], dc = [0,0,-1,1];

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            for (let d = 0; d < 4; d++) {
                const nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= N || nc < 0 || nc >= M) continue;

                // 일반 이동: 땅(0) 또는 얼척이(2)
                if (grid[nr][nc] === 0 || grid[nr][nc] === 2) {
                    if (grid[nr][nc] === 2) return "1";
                    if (!visited[nr][nc]) {
                        visited[nr][nc] = true;
                        queue.push([nr, nc]);
                    }
                }

                // 점프: 바위(1) 너머 얼척이(2)만 있을 때
                if (grid[nr][nc] === 1) {
                    const jr = nr + dr[d], jc = nc + dc[d];
                    if (jr < 0 || jr >= N || jc < 0 || jc >= M) continue;
                    if (grid[jr][jc] === 2) return "1";
                }
            }
        }
        return "0";
    }

    // ── 유틸 ─────────────────────────────────────
    function makeInput(grid) {
        const N = grid.length, M = grid[0].length;
        return N + ' ' + M + '\n' + grid.map(r => r.join(' ')).join('\n');
    }

    function makeCase(grid) {
        const inp = makeInput(grid);
        return { in: inp, out: solve(inp) };
    }

    function makeRng(seed) {
        let s = BigInt(seed);
        return function() {
            s ^= s << 13n; s ^= s >> 7n; s ^= s << 17n;
            s &= 0xFFFFFFFFFFFFFFFFn;
            return Number(s & 0x7FFFFFFFn);
        };
    }

    function randInt(rng, min, max) { return min + (rng() % (max - min + 1)); }

    function randGrid(rng, N, M, rockRatio) {
        const grid = Array.from({length: N}, () => Array(M).fill(0));
        for (let i = 0; i < N; i++)
            for (let j = 0; j < M; j++)
                if (rng() % 100 < rockRatio) grid[i][j] = 1;

        const empties = [];
        for (let i = 0; i < N; i++)
            for (let j = 0; j < M; j++)
                if (grid[i][j] === 0) empties.push([i,j]);

        if (empties.length < 2) {
            grid[0][0] = 0; grid[N-1][M-1] = 0;
            empties.push([0,0], [N-1,M-1]);
        }

        const i1 = randInt(rng, 0, empties.length-1);
        let i2 = randInt(rng, 0, empties.length-1);
        while (i2 === i1) i2 = randInt(rng, 0, empties.length-1);

        grid[empties[i1][0]][empties[i1][1]] = 3;
        grid[empties[i2][0]][empties[i2][1]] = 2;
        return grid;
    }

    const cases = [];
    const add = (grid) => cases.push(makeCase(grid));

    // ── 작은 값 / 경계값 ─────────────────────────

    // 1×2: 바로 옆
    add([[3,2]]);
    add([[2,3]]);

    // 1×3
    add([[3,0,2]]);   // 일반 이동
    add([[3,1,2]]);   // 점프로 잡기
    add([[2,1,3]]);   // 점프 반대

    // 2×2
    add([[3,0],[0,2]]);
    add([[3,1],[0,2]]);
    add([[3,1],[1,2]]);  // 막힘

    // 3×1
    add([[3],[0],[2]]);
    add([[3],[1],[2]]);  // 점프
    add([[2],[1],[3]]);  // 점프 반대

    // ── 예제 ─────────────────────────────────────
    add([[0,0,0,1,0],[3,0,0,1,2],[0,0,0,0,1]]);
    add([[0,0,0,1,0],[3,0,1,1,0],[0,1,1,2,0],[0,0,0,1,0],[0,1,1,0,1]]);

    // ── 특이 케이스 ──────────────────────────────

    // 우진이가 바위로 완전히 둘러싸임
    add([[1,1,1],[1,3,1],[1,1,1],[0,2,0]]);

    // 얼척이가 바위로 완전히 둘러싸임 (점프 불가)
    add([[3,0,0],[0,1,1],[0,1,2]]);

    // 점프만으로 잡을 수 있는 경우
    add([[1,1,1],[1,3,1],[1,1,1],[1,1,2]]);

    // 전체가 땅
    add([[3,0,0,0],[0,0,0,0],[0,0,0,2]]);

    // 전체가 바위 (얼척이/우진이 제외)
    add([[3,1,1],[1,1,1],[1,1,2]]);

    // 미로형 (돌아가야 함)
    (function() {
        const g = Array.from({length:5}, () => Array(5).fill(0));
        g[0][0] = 3;
        g[0][1] = 1; g[1][1] = 1; g[2][1] = 1; g[3][1] = 1;
        g[4][4] = 2;
        add(g);
    })();

    // 가장자리 바위 (점프 시 범위 밖)
    add([[3,0,1],[0,0,0],[0,0,2]]);
    add([[1,3,0],[0,0,0],[0,2,0]]);

    // N=1, M=100 긴 행
    (function() {
        const row = Array(100).fill(0);
        row[0] = 3; row[99] = 2;
        add([row]);
    })();

    // N=100, M=1 긴 열
    (function() {
        const g = Array.from({length:100}, () => [0]);
        g[0][0] = 3; g[99][0] = 2;
        add(g);
    })();

    // ── 극단값 ───────────────────────────────────

    // N=100, M=100 바위 없음
    (function() {
        const g = Array.from({length:100}, () => Array(100).fill(0));
        g[0][0] = 3; g[99][99] = 2;
        add(g);
    })();

    // N=100, M=100 바위 20%
    (function() {
        add(randGrid(makeRng(1), 100, 100, 20));
    })();

    // N=100, M=100 바위 50%
    (function() {
        add(randGrid(makeRng(2), 100, 100, 50));
    })();

    // ── 랜덤 소규모 (3×3 ~ 5×5): 15개 ──────────
    for (let seed = 10; seed < 25; seed++) {
        const rng = makeRng(seed);
        const N = randInt(rng, 3, 5), M = randInt(rng, 3, 5);
        add(randGrid(rng, N, M, randInt(rng, 10, 40)));
    }

    // ── 랜덤 중규모 (10×10 ~ 30×30): 15개 ──────
    for (let seed = 25; seed < 40; seed++) {
        const rng = makeRng(seed);
        const N = randInt(rng, 10, 30), M = randInt(rng, 10, 30);
        add(randGrid(rng, N, M, randInt(rng, 15, 45)));
    }

    // ── 랜덤 대규모 (50×50 ~ 100×100): 10개 ────
    for (let seed = 40; seed < 50; seed++) {
        const rng = makeRng(seed);
        const N = randInt(rng, 50, 100), M = randInt(rng, 50, 100);
        add(randGrid(rng, N, M, randInt(rng, 20, 50)));
    }

    // ── 실행 시간 오름차순 정렬 (N*M 기준) ───────
    cases.sort(function(a, b) {
        const pa = a.in.split('\n')[0].split(' ');
        const pb = b.in.split('\n')[0].split(' ');
        return parseInt(pa[0]) * parseInt(pa[1]) - parseInt(pb[0]) * parseInt(pb[1]);
    });

    window.PROBLEMS['0523'] = {

        id:          "0523",
        title:       "십자인대",
        timeLimit:   1,
        memoryLimit: 256,

        tier: { name: "Gold", level: "IV" },

        description: `얼척이는 우진이의 비타민을 빼앗아서 도망갔다. 이거 어디서 많이 본 그림인데? 우진이는 열심히 화단을 질주하여 쫓아갔으나, 익숙한 장소에 도달했다. 그때의 트라우마로 인해 우진이는 바위가 있는 곳을 지나가지 않지만, 얼척이는 자유롭게 뛰어 넘어 다닌다. 한차례 추격전 후, 바위를 겁내는 우진이 때문에 도망치는 것 마저 심심해진 얼척이는 그냥 바위 아래에서 뻐기기로 했다. 그러나 우진이는 바위를 넘어서 얼척이를 잡을 수 있다면 이번에는 오른쪽 십자인대를 잃는 것을 감수하더라도 바위에서 뛰어내리고자 한다. 그러나 십자인대가 깨지면 다시는 못 움직이므로, 도착 지점에 반드시 얼척이가 있지 않은 한 뛰어내리지 않는다.

현재 우진이와 얼척이의 위치와 화단의 지형이 주어질 때 우진이가 얼척이를 잡을 수 있는지 판정하는 프로그램을 만들어라.
모든 위치는 사각형 모양의 화단에 있는 격자점이다. 우진이는 인접한 땅을 따라 움직일 수 있다.
“바위를 뛰어넘는다”는 현재 위치에 인접한 바위 방향으로 두 칸 이동했을 때 얼척이가 있는 경우를 뜻한다.`,

        inputDesc: `화단의 크기 N과 M이 주어진다. (1 ≤ N, M ≤ 100)
그 이후 N*M 만큼의 숫자로 지형이 주어진다.
0: 지나갈 수 있는 땅
1: 바위
2: 얼척이
3: 우진이`,

        outputDesc: `우진이가 얼척이를 잡을 수 있다면 1, 그렇지 않다면 0을 출력한다.`,

        examples: [
            {
                input:  "3 5\n0 0 0 1 0\n3 0 0 1 2\n0 0 0 0 1",
                output: "1"
            },
            {
                input:  "5 5\n0 0 0 1 0\n3 0 1 1 0\n0 1 1 2 0\n0 0 0 1 0\n0 1 1 0 1",
                output: "0"
            },
        ],

        testCases: cases,
    };

})();