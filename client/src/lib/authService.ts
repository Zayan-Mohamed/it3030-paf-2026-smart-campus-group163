const API_BASE_URL = 'http://localhost:8080';

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  token?: string;
  message?: string;
  error?: string;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Login failed');
    }
    return data as T;
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || 'Login failed');
  }
  return text as T;
};

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /(failed to fetch|networkerror|network error|connection refused|load failed)/i.test(error.message);
}

export async function loginRequest(payload: LoginPayload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await parseResponse<LoginResponse>(response);
  } catch (error) {
    if (error instanceof TypeError || isNetworkError(error)) {
      throw new Error(`Unable to reach backend at ${API_BASE_URL}.`);
    }

    throw error;
  }
}

export function getGoogleAuthUrl() {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}

export { API_BASE_URL };
