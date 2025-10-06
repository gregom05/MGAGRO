import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${API_BASE_URL}/auth/login`;

  constructor(private http: HttpClient) {}
 
  login(email: string, password: string): Observable<any> {
    console.log('Login URL:', this.apiUrl);
    console.log('Credentials:', { email, password });
    
    return this.http.post<any>(this.apiUrl, { email, password }).pipe(
      tap((response) => {
        // Guardar token y usuario en localStorage
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          console.log('✅ Token guardado:', response.token);
          console.log('✅ Usuario guardado:', response.user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
