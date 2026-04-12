const allRoles = {
  user: ['common', 'user'],
  vendor: ['common', 'vendor'],
  admin: ['common', 'admin', 'user', 'vendor'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

export { roles, roleRights };
