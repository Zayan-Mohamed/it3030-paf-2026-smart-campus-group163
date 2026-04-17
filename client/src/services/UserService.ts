const API_BASE_URL = 'http://localhost:8080/api/v1/users';

const getHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const UserService = {
  async getAllUsers() {
    const response = await fetch(API_BASE_URL, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getUserById(id: number) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async updateUser(id: number, data: { name?: string; pictureUrl?: string; studentRegistrationNumber?: string; faculty?: string; major?: string; phoneNumber?: string; employeeId?: string; department?: string }) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async deleteUser(id: number) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    // might be 204 No Content
    if (response.status !== 204) {
      return response.json().catch(() => ({}));
    }
  },
};
