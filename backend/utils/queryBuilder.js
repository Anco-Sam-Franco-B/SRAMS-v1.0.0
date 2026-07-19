export function buildPaginatedQuery(baseQuery, baseParams = [], { page = 1, limit = 20, sort, order = 'asc', search, filters = {} } = {}) {
  const conditions = [];
  const params = [...baseParams];
  let idx = baseParams.length + 1;

  if (search) {
    conditions.push(`(${searchFields(search)})`);
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        conditions.push(`${key} = ANY($${idx}::text[])`);
      } else {
        conditions.push(`${key} = $${idx}`);
      }
      params.push(value);
      idx++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = sort ? `ORDER BY ${sort} ${order === 'desc' ? 'DESC' : 'ASC'}` : '';
  const limitClause = `LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, (page - 1) * limit);

  const query = `${baseQuery} ${whereClause} ${orderClause} ${limitClause}`;
  const countQuery = `SELECT COUNT(*) FROM (${baseQuery} ${whereClause}) sub`;

  return { query, countQuery, params, countParams: params.slice(0, -2) };
}

function searchFields(search) {
  return `1=0`;
}

export function paginateResult(rows, total, page, limit) {
  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      pages: Math.ceil(Number(total) / Number(limit)),
    },
  };
}
