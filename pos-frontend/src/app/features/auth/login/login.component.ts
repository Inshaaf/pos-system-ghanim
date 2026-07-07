import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <div class="logo-area">
          <div class="logo-circle">G</div>
          <h1 class="brand-name">GHANIM ENTERPRISES</h1>
          <p class="subtitle">Point of Sale</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="login()" class="login-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Username</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput formControlName="username" autocomplete="username">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password">
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (error) {
            <div class="error-msg">{{ error }}</div>
          }

          <button mat-flat-button class="login-btn" type="submit" [disabled]="loading || form.invalid">
            @if (loading) {
              <mat-spinner diameter="20" />
            } @else {
              Login
            }
          </button>
        </form>

        <div class="demo-divider">
          <span>or</span>
        </div>

        <button mat-stroked-button class="demo-btn" type="button" (click)="tryDemo()">
          <mat-icon>play_circle_outline</mat-icon>
          Try Demo
        </button>

        <p class="footer-text">(c) {{ year }} Ghanim Enterprises &mdash; Badulla, Sri Lanka</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: #1b3050;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-card {
      width: 380px;
      padding: 40px 32px;
      border-radius: 12px !important;
    }
    .logo-area { text-align: center; margin-bottom: 32px; }
    .logo-circle {
      width: 70px; height: 70px;
      background: #c9a84c;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 700; color: #1b3050;
      margin: 0 auto 14px;
    }
    .brand-name { font-size: 16px; font-weight: 700; color: #1b3050; letter-spacing: 1px; }
    .subtitle { color: #777; font-size: 13px; margin-top: 4px; }
    .login-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .error-msg {
      background: #fdecea; color: #c62828;
      padding: 10px 14px; border-radius: 6px;
      font-size: 13px; margin-bottom: 4px;
    }
    .login-btn {
      width: 100%; height: 46px; margin-top: 8px;
      background: #1b3050 !important; color: #fff !important;
      font-size: 15px; font-weight: 600; border-radius: 8px !important;
      display: flex; align-items: center; justify-content: center;
    }
    .demo-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 20px 0 14px; color: #bbb; font-size: 12px;
    }
    .demo-divider::before, .demo-divider::after {
      content: ''; flex: 1; height: 1px; background: #e0e0e0;
    }
    .demo-btn {
      width: 100%; height: 44px;
      border-color: #c9a84c !important; color: #c9a84c !important;
      font-size: 14px; font-weight: 600; border-radius: 8px !important;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .demo-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .footer-text { text-align: center; color: #aaa; font-size: 11px; margin-top: 24px; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  showPassword = false;
  loading = false;
  error = '';
  year = new Date().getFullYear();

  login() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: () => this.router.navigate([this.auth.defaultRoute()]),
      error: () => { this.error = 'Invalid username or password'; this.loading = false; }
    });
  }

  tryDemo() {
    this.auth.loginDemo();
    this.router.navigate(['/pos']);
  }
}
