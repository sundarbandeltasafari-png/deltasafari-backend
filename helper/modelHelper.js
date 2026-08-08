function buildCondition(condition, type = true) {
    if (!condition || typeof condition !== 'object' || Object.keys(condition).length === 0) {
        return '';
    }
    const clauses = Object.entries(condition).map(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
            return `${key} IS NULL`;
        }
        if (typeof value === 'string' && value.includes('!=')) {
            return `${key} != '${value.split('!=')[1].trim()}'`;
        }
        if (typeof key === 'string' && key.trim().split(' ').length > 1) {
            const parts = key.trim().split(' ');
            return `${parts[0]} ${parts[1]} '${value}'`;
        }
        return `${key} = '${value}'`;
    });
    return (type ? "WHERE " : " ") + clauses.join(" AND ");
}

module.exports = { buildCondition };