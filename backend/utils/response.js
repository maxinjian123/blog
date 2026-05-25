function success(res, data = null, message = 'success', statusCode = 200) {
  const response = {
    code: statusCode,
    message,
    data
  };
  return res.status(statusCode).json(response);
}

function error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const response = {
    code: statusCode,
    message,
    data: null
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}

function paginated(res, { list, total, page = 1, pageSize = 10 }, message = 'success') {
  const response = {
    code: 200,
    message,
    data: {
      list,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  };
  return res.status(200).json(response);
}

module.exports = { success, error, paginated };