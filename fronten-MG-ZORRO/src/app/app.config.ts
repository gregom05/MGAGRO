import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { ca_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import ca from '@angular/common/locales/ca';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/http.interceptor';

registerLocaleData(ca);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    provideNzIcons(icons), 
    provideNzI18n(ca_ES), 
    importProvidersFrom(FormsModule), 
    provideAnimationsAsync(), 
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
