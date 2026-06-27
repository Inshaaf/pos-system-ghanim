import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .main-content {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 767px) {
      .app-shell {
        flex-direction: column;
        height: auto;
        min-height: 100vh;
        overflow: visible;
      }
      .main-content {
        overflow-y: visible;
        padding-bottom: 70px;
        flex: none;
        min-height: 0;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  private sessionService = inject(SessionService);

  ngOnInit() {
    this.sessionService.loadCurrent().subscribe();
  }
}
