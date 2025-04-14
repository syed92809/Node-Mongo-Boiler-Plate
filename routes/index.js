/** @format */
// eslint-disable-next-line node/no-missing-import
//** You have to define each new route in this file like the example given below **//

import userRoutes from '../src/user/route/user.js';

const routes = {
  userRoutes,
};

export default function (app) {
  for (const route in routes) {
    routes[route](app);
  }
}
