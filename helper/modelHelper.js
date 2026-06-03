export const buildCondition = (condition, type = true) => {
    return condition ? (type ? "WHERE " : ' ') + Object.entries(condition)
        .map(([key, value]) => value == '' && value != 0 ? `${key} IS NULL` : `${key} = '${value}'`) // custom "=>" separator
        .join(" AND ") : '';
}