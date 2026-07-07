import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { demoHttpInterceptor } from './demo/demo-http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([demoHttpInterceptor, jwtInterceptor, errorInterceptor])),
    provideAnimations(),
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '+0530' } }
  ]
};
