import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LoginForm } from './login-form';

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: vi.fn().mockImplementation((param: string) => {
      if (param === 'from') return '/admin/jobs';
      return null;
    }),
  }),
}));

const fetchMock = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('renders login form elements with accessible selectors', () => {
    render(<LoginForm />);

    expect(screen.getByText('Youten AI Console')).toBeDefined();
    expect(screen.getByLabelText(/Administrator Username/i)).toBeDefined();
    expect(screen.getByLabelText(/Security Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In to Console/i })).toBeDefined();
  });

  it('populates credentials when clicking Fill Default Admin Credentials', () => {
    render(<LoginForm />);

    const fillButton = screen.getByRole('button', { name: /Fill Default Admin Credentials/i });
    fireEvent.click(fillButton);

    const usernameInput = screen.getByLabelText(/Administrator Username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Security Password/i) as HTMLInputElement;

    expect(usernameInput.value).toBe('admin');
    expect(passwordInput.value).toBe('Admin123!');
  });

  it('displays error alert on 401 unauthorized response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        code: 'UNAUTHORIZED',
        error: 'Invalid email or password',
      }),
    } as unknown as Response);

    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/Administrator Username/i);
    const passwordInput = screen.getByLabelText(/Security Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Console/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/Invalid email or password/i)).toBeDefined();
    });
  });

  it('redirects to return URL on successful login', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: {
          admin: { username: 'admin', role_name: 'Super Admin' },
        },
      }),
    } as unknown as Response);

    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/Administrator Username/i);
    const passwordInput = screen.getByLabelText(/Security Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Console/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/admin/jobs');
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
