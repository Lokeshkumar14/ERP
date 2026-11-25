const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = localStorage.getItem('token');
  if (token === 'null' || token === 'undefined') {
    localStorage.removeItem('token');
    token = null;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  getUsers: () => request<any[]>('/auth/users'),

  // Dashboard
  getDashboardOverview: () => request<any>('/dashboard/overview'),

  // Customers
  getCustomers: () => request<any[]>('/customers'),
  createCustomer: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerLedger: (id: string) => request<any>(`/customers/${id}/ledger`),
  getCustomerHistory: (id: string) => request<any>(`/customers/${id}/history`),
  setCustomerPrice: (id: string, data: any) => request<any>(`/customers/${id}/price-list`, { method: 'POST', body: JSON.stringify(data) }),
  getCustomerPriceList: (id: string) => request<any[]>(`/customers/${id}/price-list`),
  deleteCustomerPrice: (customerId: string, priceId: string) => request<any>(`/customers/${customerId}/price-list/${priceId}`, { method: 'DELETE' }),

  // Parties (Suppliers & Job Workers)
  getParties: (type?: string, service?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('party_type', type);
    if (service) params.append('service', service);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/parties${qs}`);
  },
  createParty: (data: any) => request<any>('/parties', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return request<any[]>(`/products${qs}`);
  },
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),

  // Sales Orders
  getSalesOrders: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<any[]>(`/sales-orders${qs}`);
  },
  createSalesOrder: (data: any) => request<any>('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/sales-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancelSalesOrder: (id: string, reason: string) =>
    request<any>(`/sales-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Purchases
  getPurchaseOrders: () => request<any[]>('/purchases/orders'),
  createPurchaseOrder: (data: any) => request<any>('/purchases/orders', { method: 'POST', body: JSON.stringify(data) }),
  getGoodsReceipts: () => request<any[]>('/purchases/receipts'),
  createGoodsReceipt: (data: any) => request<any>('/purchases/receipts', { method: 'POST', body: JSON.stringify(data) }),
  getPurchaseReturns: () => request<any[]>('/purchases/returns'),
  createPurchaseReturn: (data: any) => request<any>('/purchases/returns', { method: 'POST', body: JSON.stringify(data) }),

  // Yarn Inventory
  getYarnLots: () => request<any[]>('/yarn-inventory/lots'),
  getYarnSummary: () => request<any>('/yarn-inventory/summary'),
  reserveYarn: (data: any) => request<any>('/yarn-inventory/reserve', { method: 'POST', body: JSON.stringify(data) }),
  adjustStock: (data: any) => request<any>('/yarn-inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),

  // Job Work & Batches
  getBatches: () => request<any[]>('/job-work/batches'),
  createBatch: (data: any) => request<any>('/job-work/batches', { method: 'POST', body: JSON.stringify(data) }),
  getJobOrders: (processType?: string) => {
    const qs = processType ? `?process_type=${processType}` : '';
    return request<any[]>(`/job-work/orders${qs}`);
  },
  createJobOrder: (data: any) => request<any>('/job-work/orders', { method: 'POST', body: JSON.stringify(data) }),
  receiveJobWork: (data: any) => request<any>('/job-work/receipts', { method: 'POST', body: JSON.stringify(data) }),

  // Fabric Rolls
  getRolls: (params?: { batch_id?: string; process?: string; is_delivered?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.batch_id) query.append('batch_id', params.batch_id);
    if (params?.process) query.append('process', params.process);
    if (params?.is_delivered !== undefined) query.append('is_delivered', String(params.is_delivered));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/rolls${qs}`);
  },
  createRoll: (data: any) => request<any>('/rolls', { method: 'POST', body: JSON.stringify(data) }),
  splitRoll: (data: { roll_id: string; split_weights: number[] }) =>
    request<any>('/rolls/split', { method: 'POST', body: JSON.stringify(data) }),
  mergeRolls: (data: { roll_ids: string[] }) =>
    request<any>('/rolls/merge', { method: 'POST', body: JSON.stringify(data) }),
  adjustRollWeight: (id: string, data: any) =>
    request<any>(`/rolls/${id}/adjust-weight`, { method: 'POST', body: JSON.stringify(data) }),
  allocateRoll: (id: string, data: any) =>
    request<any>(`/rolls/${id}/allocate`, { method: 'POST', body: JSON.stringify(data) }),

  // Quality
  getInspections: () => request<any[]>('/quality/inspections'),
  createInspection: (data: any) => request<any>('/quality/inspections', { method: 'POST', body: JSON.stringify(data) }),

  // Godowns
  getGodowns: () => request<any[]>('/godowns'),
  createGodown: (data: any) => request<any>('/godowns', { method: 'POST', body: JSON.stringify(data) }),
  transferStock: (data: any) => request<any>('/godowns/transfer', { method: 'POST', body: JSON.stringify(data) }),

  // Delivery Challans
  getDeliveryChallans: () => request<any[]>('/delivery-challans'),
  createDeliveryChallan: (data: any) => request<any>('/delivery-challans', { method: 'POST', body: JSON.stringify(data) }),
  cancelChallan: (id: string, reason: string) =>
    request<any>(`/delivery-challans/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Sales Deliveries
  getDeliveries: () => request<any[]>('/deliveries'),
  createDelivery: (data: any) => request<any>('/deliveries', { method: 'POST', body: JSON.stringify(data) }),

  // Invoices
  getInvoices: () => request<any[]>('/invoices'),
  createInvoice: (data: any) => request<any>('/invoices', { method: 'POST', body: JSON.stringify(data) }),

  // Accounts & Payments
  getPayments: () => request<any[]>('/accounts/payments'),
  recordPayment: (data: any) => request<any>('/accounts/payments', { method: 'POST', body: JSON.stringify(data) }),
  getFinancialOverview: () => request<any>('/accounts/financial-overview'),
  getAgingReport: () => request<any>('/accounts/aging-report'),
  getDayBook: (date?: string) => {
    const qs = date ? `?date=${date}` : '';
    return request<any>(`/accounts/day-book${qs}`);
  },

  // Notifications
  getNotifications: () => request<any>('/notifications'),

  // Costing
  getBatchCosting: (batchId: string) => request<any>(`/costing/batches/${batchId}`),
  getOrdersProfitability: () => request<any[]>('/costing/orders-profitability'),

  // Reports
  getInventoryReport: () => request<any>('/reports/inventory'),
  getProductionLossReport: () => request<any[]>('/reports/production-loss'),

  // Audit Logs
  getAuditLogs: (module?: string) => {
    const qs = module ? `?module=${module}` : '';
    return request<any[]>(`/audit${qs}`);
  },
};
