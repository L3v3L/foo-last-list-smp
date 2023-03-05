class LastListFoobar {
    static getMetaValues(fileInfo, tagIds) {
        let values = [];

        tagIds.every((tagId) => {
            const idx = fileInfo.MetaFind(tagId);
            if (idx === -1) {
                return true;
            }

            let count = fileInfo.MetaValueCount(idx);
            for (let i = 0; i < count; i++) {
                let value = fileInfo.MetaValue(idx, i).trim();
                if (value) {
                    values.push(value);
                }
            }
            return true;
        });
        // Remove duplicates
        values = [...new Set(values)];
        return values;
    }
}