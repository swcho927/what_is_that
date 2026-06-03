// 문제 번호 정렬 + (과거 호환용) 별칭 (공유 모듈)
//
// compareProbId: 사이드바/목록 정렬 — 숫자 먼저, 문자 포함 나중. (항상 필요)
//
// normId / ID_ALIAS: 번호 체계를 바꿨을 때, DB에 남은 "옛 번호"를 읽으며 새 번호로
//   변환하는 호환 장치. Firestore를 새 번호로 직접 마이그레이션했다면 비워둬도 된다.
//   다시 번호를 바꿀 땐 ID_ALIAS에 "옛번호": "새번호" 한 줄만 추가하면 된다.
//   (현재: Firestore 마이그레이션 완료 → 별칭 없음)

export const ID_ALIAS = {};

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
