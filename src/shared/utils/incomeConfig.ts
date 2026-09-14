export function normalizeIncomeConfig(rawConfig: any = {}) {
  const baseCategories = Array.isArray(rawConfig.finance_income_categories)
    ? rawConfig.finance_income_categories
    : [];
  const netCategories = Array.isArray(rawConfig.finance_income_net_cats)
    ? rawConfig.finance_income_net_cats
    : [];
  const totalCategories = Array.isArray(rawConfig.finance_income_total_cats)
    ? rawConfig.finance_income_total_cats
    : [];
  const grossCategories = Array.isArray(rawConfig.finance_income_gross_cats)
    ? rawConfig.finance_income_gross_cats
    : [];
  const analysisStartMonth = typeof rawConfig.finance_income_analysis_start_month === 'string'
    && /^\d{4}-(0[1-9]|1[0-2])$/.test(rawConfig.finance_income_analysis_start_month)
    ? rawConfig.finance_income_analysis_start_month
    : '';

  const categories = Array.from(
    new Set([
      ...baseCategories,
      ...netCategories,
      ...totalCategories,
      ...grossCategories,
    ].filter(Boolean))
  );

  const assignedCategories = new Set([
    ...netCategories,
    ...totalCategories,
    ...grossCategories,
  ]);

  const normalizedNetCategories = Array.from(
    new Set([
      ...netCategories,
      ...categories.filter((category) => !assignedCategories.has(category)),
    ])
  );

  return {
    finance_income_categories: categories,
    finance_income_net_cats: normalizedNetCategories,
    finance_income_total_cats: Array.from(new Set(totalCategories)),
    finance_income_gross_cats: Array.from(new Set(grossCategories)),
    finance_income_analysis_start_month: analysisStartMonth,
  };
}
