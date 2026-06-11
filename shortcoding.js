// ════════════════════════════════════════════════════════
//  숏코딩 랭킹 계산 (공유 모듈)
//  각 문제에서 "가장 짧은 코드 길이(byte)로 정답(AC)"인 사람에게 1점.
//  동점(같은 최단 길이)이면 해당 유저들 모두 1점.
//  점수 합산 순으로 랭킹.
//  - shortcoding.html(랭킹 페이지)·profile.html(숏코더 업적)이 공용으로 사용
// ════════════════════════════════════════════════════════
import { normId } from './idalias.js';

// subs: submissions 메타 배열 [{ problemId, codeLength, success, uid, nickname }]
// 반환: [{ uid, nickname, points }] (points 내림차순 정렬)
export function computeShortcoding(subs) {
    const perProblem = {};   // pid -> { minLen, winners: Set<uid> }
    const nickByUid  = {};

    for (const s of subs) {
        if (!s.success) continue;
        const len = s.codeLength;
        if (typeof len !== 'number' || len <= 0) continue;
        const pid = normId(s.problemId);
        if (s.uid) nickByUid[s.uid] = s.nickname || nickByUid[s.uid] || '익명';

        const pp = perProblem[pid];
        if (!pp || len < pp.minLen)      perProblem[pid] = { minLen: len, winners: new Set([s.uid]) };
        else if (len === pp.minLen)      pp.winners.add(s.uid);
    }

    const points = {};   // uid -> 점수
    for (const pid in perProblem)
        for (const uid of perProblem[pid].winners)
            points[uid] = (points[uid] || 0) + 1;

    return Object.keys(points)
        .map(uid => ({ uid, nickname: nickByUid[uid] || '익명', points: points[uid] }))
        .sort((a, b) => b.points - a.points);
}

// 특정 유저의 숏코딩 순위 (동점은 공동 순위). 점수 0이면 Infinity.
export function shortcodingRankOf(board, uid) {
    const me = board.find(u => u.uid === uid);
    if (!me || me.points <= 0) return Infinity;
    return board.filter(u => u.points > me.points).length + 1;
}
