import { http, HttpResponse } from 'msw';
import { mockTodo, mockProject, mockUser } from '../index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const handlers = [
  // Auth endpoints
  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Todo endpoints
  http.get(`${API_BASE_URL}/todos`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      items: [mockTodo],
      total: 1,
      page,
      limit,
      pages: 1,
    });
  }),

  http.post(`${API_BASE_URL}/todos`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        ...mockTodo,
        ...body,
        id: 'new_todo_id',
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/todos/:id`, async ({ params, request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      ...mockTodo,
      ...body,
      id: params.id,
    });
  }),

  http.delete(`${API_BASE_URL}/todos/:id`, ({ params }) => {
    return HttpResponse.json({ message: 'Todo deleted successfully' });
  }),

  // Project endpoints
  http.get(`${API_BASE_URL}/projects`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      items: [mockProject],
      total: 1,
      page,
      limit,
      pages: 1,
    });
  }),

  http.post(`${API_BASE_URL}/projects`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        ...mockProject,
        ...body,
        id: 'new_project_id',
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE_URL}/projects/:id`, async ({ params, request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      ...mockProject,
      ...body,
      id: params.id,
    });
  }),

  http.delete(`${API_BASE_URL}/projects/:id`, ({ params }) => {
    return HttpResponse.json({ message: 'Project deleted successfully' });
  }),

  // AI endpoints
  http.post(`${API_BASE_URL}/ai/generate-subtasks`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      subtasks: [
        {
          title: 'Generated Subtask 1',
          description: 'AI generated subtask description',
          priority: 3,
          estimated_time: '30 minutes',
          order: 1,
        },
        {
          title: 'Generated Subtask 2',
          description: 'Another AI generated subtask',
          priority: 2,
          estimated_time: '45 minutes',
          order: 2,
        },
      ],
    });
  }),

  http.post(`${API_BASE_URL}/ai/analyze-file`, async ({ request }) => {
    return HttpResponse.json({
      analysis:
        'This file contains important information about the project structure.',
      suggestions: [
        'Consider adding more documentation',
        'Review the error handling patterns',
      ],
    });
  }),

  // Error scenarios for testing
  http.get(`${API_BASE_URL}/todos/error`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${API_BASE_URL}/todos/unauthorized`, () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),
];
