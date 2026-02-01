const users = new Map();

export function createUser(email, password) {
  users.set(email, { email, password });
}

export function getUser(email) {
  return users.get(email);
}

