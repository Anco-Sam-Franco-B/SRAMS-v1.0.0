export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const paginatedResponse = (res, data, meta, message = 'Success') => {
  return res.status(200).json({
    success: true,
    data,
    message,
    meta: {
      page: meta.page || 1,
      limit: meta.limit || 10,
      total: meta.total || 0,
      totalPages: meta.totalPages || 0,
    },
  });
};

export const errorResponse = (res, error, statusCode = 500, code = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : error.message || 'An error occurred',
    code,
  });
};
