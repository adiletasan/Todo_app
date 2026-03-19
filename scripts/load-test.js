import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m',  target: 10 },
    { duration: '30s', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'test3@test.com',
    password: '123456',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'login successful': (r) => r.status === 200 });
  const token = loginRes.json('accessToken');
  console.log(`Got token: ${token ? 'yes' : 'no'}`);
  return { token };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Тест 1: Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // Тест 2: Получить задачи
  const tasksRes = http.get(`${BASE_URL}/api/tasks`, { headers });
  check(tasksRes, {
    'tasks status 200': (r) => r.status === 200,
    'tasks response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.5);

  // Тест 3: Создать задачу
  const createRes = http.post(`${BASE_URL}/api/tasks`, JSON.stringify({
    title: `Load test task ${Date.now()}`,
    priority: 'medium',
  }), { headers });
  check(createRes, {
    'create task status 201': (r) => r.status === 201,
  });

  sleep(0.5);

  // Тест 4: Получить профиль
  const profileRes = http.get(`${BASE_URL}/api/users/me`, { headers });
  check(profileRes, {
    'profile status 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed');
}