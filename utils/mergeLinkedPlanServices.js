function isObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
}

function deepMerge(target, source) {
    for (const key in source) {
        if (isObject(source[key]) && isObject(target[key])) {
            target[key] = deepMerge({ ...target[key] }, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

function mergeLinkedPlanServices(existing, updates) {
    if (!Array.isArray(existing) || !Array.isArray(updates)) return updates;

    const merged = [...existing];

    for (const updateItem of updates) {
        const matchIndex = merged.findIndex(
            item => item.objectId === updateItem.objectId
        );

        if (matchIndex !== -1) {
            merged[matchIndex] = deepMerge(merged[matchIndex], updateItem);
        } else {
            merged.push(updateItem); // new item
        }
    }

    return merged;
}

module.exports = mergeLinkedPlanServices;