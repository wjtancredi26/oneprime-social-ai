export const sendSuccess = (res, statusCode = 200, data = null, message = 'Success') => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res, statusCode = 500, message = 'Internal server error', details = null) => {
  return res.status(statusCode).json({ success: false, message, details });
};
