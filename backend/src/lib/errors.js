// Errors the API answers with. The browser gets { code, error } and the HTTP status; `error` is written for customers.
class HttpError extends Error {
  constructor(status, code, message){ super(message); this.status = status; this.code = code; }
}

const badRequest = (message, code = 'invalid') => new HttpError(400, code, message);
const unauthorized = (message = 'Please log in again.') => new HttpError(401, 'auth', message);
const notFound = (message = 'Not found.') => new HttpError(404, 'not_found', message);
const conflict = (code, message) => new HttpError(409, code, message);
const tooMany = (message = 'Too many attempts. Please wait a minute and try again.') => new HttpError(429, 'busy', message);
const unavailable = message => new HttpError(503, 'unavailable', message);

export { HttpError, badRequest, unauthorized, notFound, conflict, tooMany, unavailable };
