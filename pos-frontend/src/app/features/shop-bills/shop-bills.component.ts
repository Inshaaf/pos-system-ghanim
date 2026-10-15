import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { SalespersonService } from '../../core/services/product.service';
import { ShopBillService } from '../../core/services/shop-bill.service';
import { ShopBill, ShopBillActivity } from '../../core/models/shop-bill.model';
import { Salesperson } from '../../core/models/product.model';

@Component({
  selector: 'app-shop-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <main class="page">
      <header class="page-head">
        <div><h1>Shop Bills &amp; Collections</h1><p>Track bills issued to shops, assign collection, record payments and follow-ups.</p></div>
        <div class="head-actions"><button class="secondary" (click)="toggleFollowUps()">{{ showFollowUps ? 'Hide follow-ups' : 'Follow-up schedule' }}</button><button class="primary" (click)="showForm = !showForm">{{ showForm ? 'Close form' : '+ Add shop bill' }}</button></div>
      </header>

      @if (showForm) {
        <section class="panel">
          <h2>{{ auth.isOwner() ? 'Enter bill' : 'Request a bill entry' }}</h2>
          <p class="hint">Cash and credit bills are both tracked as collectible.</p>
          <form class="bill-form" (ngSubmit)="saveBill()">
            <label>Shop / customer name<input name="customerName" [(ngModel)]="draft.customerName" list="known-customers" required placeholder="Shop name" /><datalist id="known-customers">@for (name of customerNames; track name) { <option [value]="name"></option> }</datalist></label>
            <label>Bill number<input name="billNumber" [(ngModel)]="draft.billNumber" required placeholder="Enter bill number" /></label>
            <label>Category<select name="category" [(ngModel)]="draft.category"><option value="RAINCO">Rainco</option><option value="PLASTIC">Plastic</option></select></label>
            <label>Bill type<select name="billType" [(ngModel)]="draft.billType"><option value="CASH">Cash</option><option value="CREDIT">Credit</option></select></label>
            <label>Bill amount<input name="amount" [(ngModel)]="draft.amount" type="number" min="0.01" step="0.01" required placeholder="0.00" /></label>
            <button class="primary" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : (auth.isOwner() ? 'Add bill' : 'Send for approval') }}</button>
          </form>
        </section>
      }

      <section class="panel workers">
        <div class="section-head"><div><h2>Active for collection</h2><p>Collection access is separate from salesperson activity.</p></div></div>
        @if (workers.length) {
          <div class="worker-list">
            @for (worker of workers; track worker.id) {
              <button class="worker-chip" [class.enabled]="worker.activeForCollection" (click)="toggleCollection(worker)">
                <span class="dot"></span><span>{{ worker.name }}</span><small>{{ worker.activeForCollection ? 'Collecting' : 'Off' }}{{ !worker.active ? ' · inactive salesperson' : '' }}</small>
              </button>
            }
          </div>
        } @else { <p class="empty-small">No salespeople have been entered.</p> }
      </section>

      @if (showFollowUps) {
        <section class="panel">
          <div class="section-head"><div><h2>Follow-up schedule</h2><p>Shows the selected date and follow-ups with no date · completed bills are excluded.</p></div><label class="follow-up-date">Follow-up date<input type="date" [(ngModel)]="selectedFollowUpDate" /></label></div>
          @if (followUpsLoading) { <div class="loading"><span class="spinner"></span> Loading follow-ups…</div> }
          @else if (filteredFollowUpEntries.length) {
            <div class="table-wrap"><table><thead><tr><th>Follow-up date</th><th>Shop / bill</th><th>Category</th><th>Collector</th><th>Outstanding</th><th>Reason</th><th>Recorded</th></tr></thead><tbody>
              @for (activity of filteredFollowUpEntries; track activity.id) { <tr><td>{{ activity.followUpAt ? (activity.followUpAt | date:'dd/MM/yyyy HH:mm':'+0530') : 'No date set' }}</td><td>{{ activity.bill.customerName }} · {{ activity.bill.billNumber }}</td><td>{{ categoryName(activity.bill.category) }}</td><td>{{ activity.bill.salesperson?.name || 'Unassigned' }}</td><td>{{ money(activity.bill.remainingAmount) }}</td><td>{{ activity.reason }}</td><td>{{ activity.createdAt | date:'dd/MM/yyyy HH:mm':'+0530' }}</td></tr> }
            </tbody></table></div>
          } @else { <div class="empty-small">No follow-ups for {{ selectedFollowUpDate }} or without a date.</div> }
        </section>
      }

      @if (auth.isOwner() && pending.length) {
        <section class="panel">
          <div class="section-head"><div><h2>Bill requests <span class="count">{{ pending.length }}</span></h2><p>Cashier-entered bills awaiting your approval.</p></div></div>
          <div class="table-wrap"><table><thead><tr><th>Shop</th><th>Bill</th><th>Category</th><th>Type</th><th>Amount</th><th>Requested by</th><th></th></tr></thead><tbody>
            @for (bill of pending; track bill.id) { <tr><td>{{ bill.customerName }}</td><td>{{ bill.billNumber }}</td><td>{{ categoryName(bill.category) }}</td><td>{{ bill.billType }}</td><td>{{ money(bill.amount) }}</td><td>{{ bill.requestedBy }}</td><td class="actions"><button class="approve" (click)="review(bill, true)">Approve</button><button class="reject" (click)="review(bill, false)">Reject</button></td></tr> }
          </tbody></table></div>
        </section>
      }

      @if (auth.isOwner() && pendingPayments.length) {
        <section class="panel">
          <div class="section-head"><div><h2>Payments awaiting confirmation <span class="count">{{ pendingPayments.length }}</span></h2><p>These payments have not reduced bill balances yet.</p></div></div>
          <div class="table-wrap"><table><thead><tr><th>Shop / bill</th><th>Category</th><th>Payment</th><th>Method</th><th>Received by</th><th>Date</th><th></th></tr></thead><tbody>
            @for (payment of pendingPayments; track payment.id) { <tr><td>{{ payment.bill.customerName }} · {{ payment.bill.billNumber }}</td><td>{{ categoryName(payment.bill.category) }}</td><td>{{ money(payment.amount || 0) }}</td><td>{{ payment.paymentMethod }}</td><td>{{ payment.recordedBy }}</td><td>{{ payment.createdAt | date:'dd/MM/yyyy HH:mm':'+0530' }}</td><td class="actions"><button class="approve" (click)="reviewPayment(payment, true)">Confirm</button><button class="reject" (click)="reviewPayment(payment, false)">Reject</button></td></tr> }
          </tbody></table></div>
        </section>
      }

      <section class="panel">
        <div class="section-head"><div><h2>Bill register</h2><p>Payments and follow-up history are available for incomplete bills.</p></div><span class="open-count">{{ filteredBills.length }} bills</span></div>
        <div class="filters">
          <input aria-label="Search bills" [(ngModel)]="search" placeholder="Search shop or bill number" />
          <select aria-label="Filter bills by category" [(ngModel)]="categoryFilter"><option value="ALL">All categories</option><option value="RAINCO">Rainco</option><option value="PLASTIC">Plastic</option></select>
          <select aria-label="Filter bills by status" [(ngModel)]="statusFilter"><option value="OPEN">Incomplete bills</option><option value="ALL">All bills</option><option value="COMPLETED">Completed</option><option value="PENDING_APPROVAL">Awaiting approval</option><option value="REJECTED">Rejected</option></select>
          <select aria-label="Filter by salesperson" [(ngModel)]="workerFilter"><option value="ALL">All collectors</option><option value="UNASSIGNED">Unassigned</option>@for (worker of collectionWorkers; track worker.id) { <option [value]="worker.id">{{ worker.name }}</option> }</select>
        </div>
        @if (loading) { <div class="loading"><span class="spinner"></span> Loading bills…</div> }
        @else if (filteredBills.length) {
          <div class="bill-list">
            @for (bill of filteredBills; track bill.id) {
              <article class="bill-card">
                <div class="bill-main">
                  <div class="bill-heading"><div><h3>{{ bill.customerName }}</h3><span class="bill-number">Bill {{ bill.billNumber }}</span></div><div class="status-stack"><span class="status" [class.complete]="bill.status === 'COMPLETED'" [class.waiting]="bill.status === 'PENDING_APPROVAL'">{{ statusLabel(bill.status) }}</span>@if (bill.paymentAwaitingConfirmation) { <span class="status waiting">PAYMENT AWAITING CONFIRMATION</span> }</div></div>
                  <div class="bill-meta"><span class="category-tag">{{ categoryName(bill.category) }}</span><span>{{ bill.billType }}</span><span>Issued {{ bill.createdAt | date:'dd/MM/yyyy HH:mm':'+0530' }}</span></div>
                  <div class="money-row"><span>Bill <b>{{ money(bill.amount) }}</b></span><span>Received <b>{{ money(bill.paidAmount) }}</b></span><span class="due">Outstanding <b>{{ money(bill.remainingAmount) }}</b></span></div>
                </div>
                @if (bill.status === 'OPEN') {
                  <div class="bill-actions">
                    <label class="assign">Collection salesperson<select [ngModel]="bill.salesperson?.id ?? null" (ngModelChange)="assign(bill, $event)"><option [ngValue]="null" disabled>Select collector</option>@if (bill.salesperson && !isCollectionActive(bill.salesperson.id)) { <option [ngValue]="bill.salesperson.id">{{ bill.salesperson.name }} (inactive)</option> } @for (worker of collectionWorkers; track worker.id) { <option [ngValue]="worker.id">{{ worker.name }}</option> }</select></label>
                    @if (bill.salesperson) { <button class="text-btn" (click)="requestUnassign(bill)">Unassign</button> }
                    <button class="secondary" [disabled]="bill.paymentAwaitingConfirmation" (click)="togglePayment(bill.id)">{{ bill.paymentAwaitingConfirmation ? 'Payment awaiting confirmation' : 'Record payment' }}</button>
                    <button class="secondary" (click)="toggleFollowUp(bill.id)">Add follow-up</button>
                    <button class="text-btn" (click)="toggleHistory(bill.id)">{{ historyOpen === bill.id ? 'Hide history' : 'View history' }}</button>
                  </div>
                  @if (paymentOpen === bill.id) {
                    <div class="action-form"><strong>Receive from {{ bill.customerName }}</strong><div class="inline-fields"><label>Payment amount<div class="amount-input"><input type="number" min="0.01" step="0.01" [(ngModel)]="paymentAmount" /><button type="button" (click)="paymentAmount = bill.remainingAmount">Exact balance</button></div></label><label>Received by<select [(ngModel)]="paymentMethod"><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option></select></label><button class="primary" (click)="recordPayment(bill)">Save payment</button></div></div>
                  }
                  @if (followUpOpen === bill.id) {
                    <div class="action-form"><strong>Schedule follow-up for {{ bill.customerName }}</strong><div class="inline-fields"><label>Reason<input [(ngModel)]="followUpReason" placeholder="e.g. Shop requested another visit" /></label><label>Follow-up date and time<input type="datetime-local" [(ngModel)]="followUpAt" /></label><button class="primary" (click)="saveFollowUp(bill)">Save follow-up</button></div></div>
                  }
                  @if (unassignOpen === bill.id) {
                    <div class="action-form"><strong>Unassign {{ bill.billNumber }} · add either a follow-up or a payment</strong><div class="inline-fields"><label>Follow-up reason<input [(ngModel)]="unassignReason" placeholder="Why is this collection being reassigned?" /></label><label>Follow-up date and time<input type="datetime-local" [(ngModel)]="unassignFollowUpAt" /></label><label>Payment amount (optional)<div class="amount-input"><input type="number" min="0.01" step="0.01" [(ngModel)]="unassignPaymentAmount" placeholder="No payment" /><button type="button" (click)="unassignPaymentAmount = bill.remainingAmount">Exact balance</button></div></label><label>Payment method<select [(ngModel)]="unassignPaymentMethod"><option value="">Select if entering payment</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option></select></label><button class="primary" (click)="submitUnassign(bill)">Save and unassign</button><button class="secondary" (click)="cancelUnassign()">Keep assigned</button></div></div>
                  }
                  @if (historyOpen === bill.id) {
                    <div class="history"><strong>Payment and follow-up history · incomplete bills</strong>@if (activities.length) { @for (item of activities; track item.id) { <div class="history-row"><span>{{ item.createdAt | date:'dd/MM/yyyy HH:mm':'+0530' }}</span>@if (item.type === 'PAYMENT') { <span>Payment · {{ item.paymentMethod }} · {{ money(item.amount || 0) }} · {{ confirmationLabel(item.confirmationStatus) }} @if (item.reviewNote) { · {{ item.reviewNote }} }</span> } @else { <span>Follow-up · {{ item.reason }} @if (item.followUpAt) { · next visit {{ item.followUpAt | date:'dd/MM/yyyy HH:mm':'+0530' }} }</span> }</div> } } @else { <span class="empty-small">No payments or follow-ups yet.</span> }</div>
                  }
                }
              </article>
            }
          </div>
        } @else { <div class="empty"><span>▤</span><strong>No bills match these filters</strong><small>Add a shop bill or adjust the filters.</small></div> }
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; } .page { max-width:1280px; margin:0 auto; padding:24px; color:#24364b; }
    .page-head,.section-head { display:flex; justify-content:space-between; align-items:center; gap:16px; }
    .head-actions { display:flex; gap:8px; }
    .page-head { margin-bottom:20px; } h1 { margin:0; font-size:24px; } h2 { margin:0; font-size:17px; } h3 { margin:0 0 3px; font-size:16px; }
    p { margin:5px 0 0; color:#7b8999; font-size:13px; } .panel { background:#fff; border:1px solid #e8edf2; border-radius:14px; padding:18px; margin-bottom:16px; box-shadow:0 3px 14px #24364b0a; }
    .primary,.secondary,.approve,.reject,.text-btn { border:0; border-radius:8px; padding:10px 14px; cursor:pointer; font-weight:600; white-space:nowrap; }
    .primary { background:#1d4670; color:white; } .primary:disabled { opacity:.6; cursor:wait; } .secondary { background:#edf3f8; color:#345475; } .approve { background:#e4f5ec; color:#157548; } .reject { background:#fff0ef; color:#a23b34; margin-left:6px; } .text-btn { background:transparent; color:#476786; }
    .hint { margin-bottom:14px; } .bill-form { display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr auto; align-items:end; gap:12px; margin-top:15px; }
    label { display:flex; flex-direction:column; gap:6px; color:#586c80; font-size:12px; font-weight:600; }
    input,select { width:100%; min-width:0; box-sizing:border-box; height:40px; border:1px solid #d7e0e8; border-radius:7px; padding:0 10px; color:#293e53; background:#fff; font:inherit; font-size:13px; }
    input:focus,select:focus { outline:2px solid #b9d4ee; border-color:#5f8db6; }
    .worker-list { display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; } .worker-chip { display:flex; align-items:center; gap:8px; padding:8px 11px; border:1px solid #e0e7ed; border-radius:20px; background:#f8fafb; color:#53687b; cursor:pointer; }
    .worker-chip.enabled { border-color:#9dd8b6; background:#eefaf3; color:#206443; } .worker-chip small { color:#83909b; font-size:10px; } .dot { width:8px; height:8px; border-radius:50%; background:#bec8d1; } .enabled .dot { background:#2ba365; }
    .count,.open-count { color:#52708b; background:#eff5fa; padding:4px 9px; border-radius:14px; font-size:12px; margin-left:6px; } .table-wrap { overflow:auto; margin-top:14px; } table { width:100%; border-collapse:collapse; font-size:13px; } th,td { padding:11px 10px; border-bottom:1px solid #edf0f3; text-align:left; white-space:nowrap; } th { color:#8492a0; font-size:11px; text-transform:uppercase; }
    .filters { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:10px; margin:16px 0; } .bill-list { display:grid; gap:10px; } .bill-card { border:1px solid #e9edf1; border-radius:11px; padding:15px; } .bill-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; } .bill-number { font-size:12px; color:#728398; }
    .status { border-radius:12px; background:#e9f2ff; color:#366997; padding:5px 9px; font-size:10px; font-weight:700; } .status.complete { color:#197548; background:#e8f7ef; } .status.waiting { color:#996322; background:#fff4e0; } .status-stack { display:flex; flex-direction:column; align-items:flex-end; gap:5px; }
    .bill-meta { display:flex; gap:12px; align-items:center; color:#8190a0; font-size:11px; margin:12px 0; } .category-tag { background:#f1f5f8; padding:4px 8px; border-radius:10px; color:#536d83; font-weight:600; }
    .money-row { display:flex; flex-wrap:wrap; gap:24px; padding:10px 0 4px; color:#8090a0; font-size:12px; } .money-row b { color:#344b61; margin-left:4px; } .money-row .due b { color:#b45d39; }
    .bill-actions { display:flex; align-items:end; flex-wrap:wrap; gap:8px; border-top:1px solid #eff2f5; margin-top:12px; padding-top:12px; } .assign { min-width:190px; margin-right:auto; }
    .follow-up-date { min-width:180px; }
    .action-form,.history { margin-top:13px; padding:13px; border-radius:9px; background:#f7f9fb; } .action-form strong,.history strong { display:block; margin-bottom:10px; font-size:13px; } .inline-fields { display:grid; grid-template-columns:minmax(200px,1fr) minmax(150px,.7fr) auto; align-items:end; gap:10px; }
    button:disabled { opacity:.58; cursor:not-allowed; }
    .amount-input { display:flex; gap:6px; } .amount-input button { border:0; background:#e8eef4; color:#496983; border-radius:6px; padding:0 8px; font-size:11px; cursor:pointer; white-space:nowrap; }
    .history-row { display:grid; grid-template-columns:145px 1fr; gap:10px; padding:8px 0; border-top:1px solid #e8edf1; font-size:12px; color:#596d80; } .history-row span:first-child { color:#8694a2; }
    .empty,.loading { display:flex; min-height:150px; align-items:center; justify-content:center; flex-direction:column; gap:7px; color:#718296; } .empty>span { font-size:24px; } .empty small,.empty-small { color:#95a1ad; font-size:12px; }
    .loading { flex-direction:row; min-height:110px; } .spinner { width:18px; height:18px; border:2px solid #d9e2e9; border-top-color:#396a94; border-radius:50%; animation:spin .8s linear infinite; } @keyframes spin { to { transform:rotate(360deg); } }
    @media(max-width:1000px) { .bill-form { grid-template-columns:repeat(3,1fr); } .filters { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:650px) { .page { padding:14px; } .page-head { align-items:flex-start; flex-direction:column; } .head-actions { width:100%; } .head-actions button { flex:1; } .bill-form,.filters,.inline-fields { grid-template-columns:1fr; } .bill-form .primary { width:100%; } .money-row { gap:10px 18px; } .worker-chip { max-width:100%; } .section-head { align-items:flex-start; } }
  `]
})
export class ShopBillsComponent implements OnInit {
  auth = inject(AuthService);
  private billService = inject(ShopBillService);
  private salespersonService = inject(SalespersonService);
  private snack = inject(MatSnackBar);
  bills: ShopBill[] = [];
  pending: ShopBill[] = [];
  pendingPayments: ShopBillActivity[] = [];
  workers: Salesperson[] = [];
  activities: ShopBillActivity[] = [];
  followUpEntries: ShopBillActivity[] = [];
  selectedFollowUpDate = this.todayInColombo();
  followUpsLoading = false;
  showFollowUps = false;
  loading = true;
  saving = false;
  showForm = false;
  search = '';
  categoryFilter = 'ALL';
  statusFilter = 'OPEN';
  workerFilter = 'ALL';
  paymentOpen: number | null = null;
  followUpOpen: number | null = null;
  historyOpen: number | null = null;
  unassignOpen: number | null = null;
  paymentAmount = 0;
  paymentMethod: 'CASH' | 'CHEQUE' = 'CASH';
  followUpReason = '';
  followUpAt = '';
  unassignReason = '';
  unassignFollowUpAt = '';
  unassignPaymentAmount: number | null = null;
  unassignPaymentMethod: '' | 'CASH' | 'CHEQUE' = '';
  draft = { customerName: '', billNumber: '', category: 'RAINCO' as 'RAINCO' | 'PLASTIC', billType: 'CASH' as 'CASH' | 'CREDIT', amount: null as number | null };

  get collectionWorkers(): Salesperson[] { return this.workers.filter(w => w.activeForCollection); }
  get customerNames(): string[] { return [...new Set(this.bills.map(b => b.customerName.trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b)); }
  get filteredFollowUpEntries(): ShopBillActivity[] {
    return this.followUpEntries.filter(item => !item.followUpAt || item.followUpAt.slice(0, 10) === this.selectedFollowUpDate);
  }
  get filteredBills(): ShopBill[] {
    const query = this.search.trim().toLowerCase();
    return this.bills.filter(b => {
      const matchText = !query || b.customerName.toLowerCase().includes(query) || b.billNumber.toLowerCase().includes(query);
      const matchCategory = this.categoryFilter === 'ALL' || b.category === this.categoryFilter;
      const matchStatus = this.statusFilter === 'ALL' || b.status === this.statusFilter;
      const workerId = this.workerFilter === 'ALL' ? null : this.workerFilter === 'UNASSIGNED' ? undefined : Number(this.workerFilter);
      const matchWorker = this.workerFilter === 'ALL' || (this.workerFilter === 'UNASSIGNED' ? !b.salesperson : b.salesperson?.id === workerId);
      return matchText && matchCategory && matchStatus && matchWorker;
    });
  }

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.billService.getAll().subscribe({ next: data => { this.bills = data || []; this.loading = false; }, error: () => { this.loading = false; this.snack.open('Could not load shop bills', 'OK', { duration: 3000 }); } });
    this.salespersonService.getAll().subscribe({ next: data => this.workers = data || [], error: () => this.workers = [] });
    if (this.auth.isOwner()) {
      this.billService.getPending().subscribe({ next: data => this.pending = data || [], error: () => this.pending = [] });
      this.billService.getPendingPayments().subscribe({ next: data => this.pendingPayments = data || [], error: () => this.pendingPayments = [] });
    }
  }
  saveBill(): void {
    if (!this.draft.customerName.trim() || !this.draft.billNumber.trim() || !this.draft.amount || this.draft.amount <= 0) return;
    this.saving = true;
    this.billService.create({ ...this.draft, amount: this.draft.amount ?? 0, customerName: this.draft.customerName.trim(), billNumber: this.draft.billNumber.trim() }).subscribe({
      next: () => { this.saving = false; this.showForm = false; this.draft = { customerName: '', billNumber: '', category: 'RAINCO', billType: 'CASH', amount: null }; this.load(); this.snack.open(this.auth.isOwner() ? 'Bill added' : 'Bill request sent to owner', 'OK', { duration: 3000 }); },
      error: e => { this.saving = false; this.snack.open(e.error?.message || 'Could not save bill', 'OK', { duration: 3500 }); }
    });
  }
  toggleCollection(worker: Salesperson): void {
    this.salespersonService.setCollectionActive(worker.id, !worker.activeForCollection).subscribe({ next: updated => { this.workers = this.workers.map(w => w.id === updated.id ? updated : w); }, error: e => this.snack.open(e.error?.message || 'Could not update collection status', 'OK', { duration: 3000 }) });
  }
  review(bill: ShopBill, approve: boolean): void {
    const request = approve ? this.billService.approve(bill.id) : this.billService.reject(bill.id);
    request.subscribe({ next: () => { this.pending = this.pending.filter(b => b.id !== bill.id); this.load(); this.snack.open(approve ? 'Bill approved' : 'Bill rejected', 'OK', { duration: 2500 }); }, error: e => this.snack.open(e.error?.message || 'Could not review bill', 'OK', { duration: 3000 }) });
  }
  assign(bill: ShopBill, value: number | string): void {
    if (value === '' || value == null) return;
    this.unassignOpen = null;
    this.billService.assign(bill.id, Number(value)).subscribe({ next: updated => this.bills = this.bills.map(b => b.id === updated.id ? updated : b), error: e => this.snack.open(e.error?.message || 'Could not assign bill', 'OK', { duration: 3000 }) });
  }
  requestUnassign(bill: ShopBill): void {
    if (this.auth.isOwner()) {
      this.billService.assign(bill.id, null).subscribe({ next: updated => this.bills = this.bills.map(b => b.id === updated.id ? updated : b), error: e => this.snack.open(e.error?.message || 'Could not unassign bill', 'OK', { duration: 3000 }) });
      return;
    }
    this.unassignOpen = bill.id;
    this.unassignReason = '';
    this.unassignFollowUpAt = '';
    this.unassignPaymentAmount = null;
    this.unassignPaymentMethod = '';
  }
  togglePayment(id: number): void { this.paymentOpen = this.paymentOpen === id ? null : id; this.followUpOpen = null; const bill = this.bills.find(b => b.id === id); this.paymentAmount = bill?.remainingAmount || 0; }
  toggleFollowUp(id: number): void { this.followUpOpen = this.followUpOpen === id ? null : id; this.paymentOpen = null; this.followUpReason = ''; this.followUpAt = ''; }
  recordPayment(bill: ShopBill): void {
    if (this.paymentAmount <= 0 || this.paymentAmount > bill.remainingAmount) return;
    this.billService.payment(bill.id, this.paymentAmount, this.paymentMethod).subscribe({ next: () => { this.paymentOpen = null; this.load(); this.snack.open(this.auth.isOwner() ? 'Payment confirmed and recorded' : 'Payment sent to owner for confirmation', 'OK', { duration: 3000 }); }, error: e => this.snack.open(e.error?.message || 'Could not record payment', 'OK', { duration: 3000 }) });
  }
  reviewPayment(payment: ShopBillActivity, approve: boolean): void {
    const action = approve ? this.billService.approvePayment(payment.id) : this.billService.rejectPayment(payment.id);
    action.subscribe({ next: () => { this.load(); this.snack.open(approve ? 'Payment confirmed and applied to bill' : 'Payment rejected', 'OK', { duration: 3000 }); }, error: e => this.snack.open(e.error?.message || 'Could not review payment', 'OK', { duration: 3000 }) });
  }
  submitUnassign(bill: ShopBill): void {
    const reason = this.unassignReason.trim();
    const amount = this.unassignPaymentAmount;
    if (!reason && (!amount || amount <= 0)) { this.snack.open('Add a follow-up reason or enter a payment before unassigning', 'OK', { duration: 3500 }); return; }
    if (amount && !this.unassignPaymentMethod) { this.snack.open('Choose Cash or Cheque for the payment', 'OK', { duration: 3000 }); return; }
    if (amount && amount > bill.remainingAmount) { this.snack.open('Payment cannot exceed the remaining balance', 'OK', { duration: 3000 }); return; }
    this.billService.unassign(bill.id, reason || undefined, this.unassignFollowUpAt || undefined,
      amount && amount > 0 ? amount : undefined, this.unassignPaymentMethod || undefined).subscribe({
      next: () => { this.unassignOpen = null; this.load(); this.snack.open(amount ? 'Payment sent for owner confirmation; bill unassigned' : 'Follow-up saved; bill unassigned', 'OK', { duration: 3500 }); },
      error: e => this.snack.open(e.error?.message || 'Could not unassign bill', 'OK', { duration: 3500 })
    });
  }
  cancelUnassign(): void { this.unassignOpen = null; this.unassignReason = ''; this.unassignPaymentAmount = null; this.unassignPaymentMethod = ''; }
  saveFollowUp(bill: ShopBill): void {
    if (!this.followUpReason.trim()) { this.snack.open('Enter a follow-up reason', 'OK', { duration: 2500 }); return; }
    this.billService.followUp(bill.id, this.followUpReason.trim(), this.followUpAt || undefined).subscribe({ next: () => { this.followUpOpen = null; this.load(); this.snack.open('Follow-up saved', 'OK', { duration: 2500 }); }, error: e => this.snack.open(e.error?.message || 'Could not save follow-up', 'OK', { duration: 3000 }) });
  }
  toggleHistory(id: number): void {
    if (this.historyOpen === id) { this.historyOpen = null; this.activities = []; return; }
    this.historyOpen = id; this.activities = [];
    this.billService.activities(id).subscribe({ next: data => this.activities = data || [], error: () => this.snack.open('Could not load bill history', 'OK', { duration: 2500 }) });
  }
  toggleFollowUps(): void {
    this.showFollowUps = !this.showFollowUps;
    if (!this.showFollowUps) return;
    this.followUpsLoading = true;
    this.billService.followUps().subscribe({
      next: items => { this.followUpEntries = items || []; this.followUpsLoading = false; },
      error: () => { this.followUpsLoading = false; this.snack.open('Could not load follow-ups', 'OK', { duration: 2500 }); }
    });
  }
  categoryName(category: string): string { return category === 'RAINCO' ? 'Rainco' : 'Plastic'; }
  isCollectionActive(id: number): boolean { return this.collectionWorkers.some(worker => worker.id === id); }
  confirmationLabel(status?: string): string { return status === 'PENDING_CONFIRMATION' ? 'Awaiting owner confirmation' : status === 'REJECTED' ? 'Rejected' : 'Confirmed'; }
  private todayInColombo(): string {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type: string) => parts.find(p => p.type === type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  statusLabel(status: string): string { return ({ OPEN: 'IN COLLECTION', COMPLETED: 'COMPLETED', PENDING_APPROVAL: 'AWAITING APPROVAL', REJECTED: 'REJECTED' } as Record<string,string>)[status] || status; }
  money(value: number): string { return `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
}
