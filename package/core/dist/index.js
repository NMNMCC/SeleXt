// package/core/src/func/index.ts
var applySelection = (base, select) => {
  if (base === null || base === void 0 || typeof base !== "object") {
    return base;
  }
  if (Array.isArray(base)) {
    const arraySelect = select;
    if (!Array.isArray(arraySelect)) {
      return base;
    }
    const [itemSelect, options] = arraySelect;
    const offset = options?.offset || 0;
    const length = options?.length;
    const slicedArray = length !== void 0 ? base.slice(offset, offset + length) : base.slice(offset);
    return slicedArray.map(
      (item) => applySelection(item, itemSelect)
    );
  }
  if (select === "*") {
    const result = {};
    for (const key in base) {
      if (base.hasOwnProperty(key)) {
        const value = base[key];
        if (value === null || value === void 0 || typeof value !== "object") {
          result[key] = value;
        }
      }
    }
    return result;
  }
  if (select === "**") {
    return base;
  }
  if (typeof select === "object" && !Array.isArray(select)) {
    const result = {};
    const selectObj = select;
    for (const key in selectObj) {
      if (selectObj.hasOwnProperty(key) && key in base) {
        const selectValue = selectObj[key];
        const baseValue = base[key];
        if (selectValue === true) {
          result[key] = baseValue;
        } else {
          result[key] = applySelection(baseValue, selectValue);
        }
      }
    }
    return result;
  }
  return base;
};
var createContract = (contract) => (input) => {
  const term = contract[input[0]];
  if (term === void 0) {
    throw new Error(`Unknown operation: ${input[0]}`);
  }
  return term(...input);
};
export {
  applySelection,
  createContract
};
//# sourceMappingURL=index.js.map