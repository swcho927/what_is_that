// 문제 번호 별칭 + 정렬 (공유 모듈)
//
// 번호 체계를 바꿔도(예: 0523 → U0523) 기존 Firestore 기록(solvedProblems,
// submissions.problemId)은 옛 번호 그대로다. 저장된 번호를 "읽을 때" normId로
// 새 번호로 변환해서 풀이 기록·랭킹·제출 현황·성공 표시가 계속 매칭되게 한다.
//
// 번호를 또 바꾸면 ID_ALIAS에 "옛번호": "새번호" 한 줄만 추가하면 된다.

export const ID_ALIAS = {
    "0523": "U0523",
    "1991": "U1991",
};

export function normId(id) {
    return ID_ALIAS[String(id)] ?? String(id);
}

// 문제 번호 정렬: 숫자 전용이 먼저(숫자 오름차순), 그 다음 문자 포함(자연 정렬). 예) 1, 2, A1, A2
export function compareProbId(a, b) {
    const na = /^\d+$/.test(a), nb = /^\d+$/.test(b);
    if (na && nb) return parseInt(a) - parseInt(b);
    if (na !== nb) return na ? -1 : 1;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
}
