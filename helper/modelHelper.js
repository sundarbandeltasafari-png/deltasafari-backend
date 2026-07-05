export const buildCondition = (condition, type = true) => {
    return condition ? (type ? "WHERE " : ' ') + Object.entries(condition)
        .map(([key, value]) => value == '' && value != 0 ?
            `${key} IS NULL`
            : (typeof value == 'string' && value.includes('!=') ?
                `${key} != '${value.split('!=')[1].trim()}'` :
                key.trim().split(' ').length > 1 ?
                `${key.trim().split(' ')[0]} ${key.trim().split(' ')[1]} '${value}'` :
                `${key} = '${value}'`)) // custom "=>" separator
        .join(" AND ") : '';
}