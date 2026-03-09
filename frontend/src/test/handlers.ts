import { http, HttpResponse } from 'msw';

const API_BASE = '/api';

export const handlers = [
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      token: 'test-access-token',
      email: 'user@amalitech.com',
      name: 'Test User',
      role: 'USER',
    });
  }),
  http.post(`${API_BASE}/auth/register`, () => {
    return HttpResponse.json({
      token: 'test-access-token',
      email: 'user@amalitech.com',
      name: 'Test User',
      role: 'USER',
    });
  }),
];
