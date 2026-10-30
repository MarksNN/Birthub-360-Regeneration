const API_BASE = 'http://localhost:3001/api';

export const api = {
  getToken: () => localStorage.getItem('birthhub_token'),
  setToken: (token: string) => localStorage.setItem('birthhub_token', token),
  clearToken: () => localStorage.removeItem('birthhub_token'),

  getHeaders: () => {
    const token = localStorage.getItem('birthhub_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async getAssignees() {
    const res = await fetch(`${API_BASE}/crm/assignees`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async getDashboardMetrics() {
    const res = await fetch(`${API_BASE}/dashboard/metrics`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  // COMPANIES
  async getCompanies(query?: { search?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    const res = await fetch(`${API_BASE}/crm/companies?${params.toString()}`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async createCompany(data: any) {
    const res = await fetch(`${API_BASE}/crm/companies`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateCompany(id: string, data: any) {
    const res = await fetch(`${API_BASE}/crm/companies/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteCompany(id: string) {
    const res = await fetch(`${API_BASE}/crm/companies/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  },

  // CONTACTS
  async getContacts(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/crm/contacts${params}`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async createContact(data: any) {
    const res = await fetch(`${API_BASE}/crm/contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteContact(id: string) {
    const res = await fetch(`${API_BASE}/crm/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  },

  // LEADS
  async getLeads(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/crm/leads${params}`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async createLead(data: any) {
    const res = await fetch(`${API_BASE}/crm/leads`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteLead(id: string) {
    const res = await fetch(`${API_BASE}/crm/leads/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  },

  // DEALS & PIPELINE KANBAN
  async getDeals(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/crm/deals${params}`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async createDeal(data: any) {
    const res = await fetch(`${API_BASE}/crm/deals`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateDealStage(id: string, stage: string, lostReason?: string, notes?: string) {
    const res = await fetch(`${API_BASE}/crm/deals/${id}/stage`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ stage, lostReason, notes })
    });
    return res.json();
  },

  async deleteDeal(id: string) {
    const res = await fetch(`${API_BASE}/crm/deals/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  },

  async getDealHistory(id: string) {
    const res = await fetch(`${API_BASE}/crm/deals/${id}/history`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  // ACTIVITIES & ACOMPANHAMENTO
  async getActivities() {
    const res = await fetch(`${API_BASE}/crm/activities`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async createActivity(data: any) {
    const res = await fetch(`${API_BASE}/crm/activities`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateActivityStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/crm/activities/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async deleteActivity(id: string) {
    const res = await fetch(`${API_BASE}/crm/activities/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  },

  async getTimeline() {
    const res = await fetch(`${API_BASE}/crm/timeline`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  // AGENTS & SUPERVISOR
  async getAgentsCatalog(query?: Record<string, string>) {
    const params = query ? `?${new URLSearchParams(query).toString()}` : '';
    const res = await fetch(`${API_BASE}/supervisor/agents${params}`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async orchestrateSupervisor(payload: {
    targetModule: string;
    prompt: string;
    agentCode?: string;
    contextData?: Record<string, any>;
  }) {
    const res = await fetch(`${API_BASE}/supervisor/orchestrate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getSupervisorExecutions() {
    const res = await fetch(`${API_BASE}/supervisor/executions`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  // FASE 03 — INTEGRATION FACTORY & UNIVERSAL CONNECTOR HUB
  async getIntegrationCatalog(category?: string) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/integrations/catalog${params}`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async createIntegrationRequest(data: { requestedProviderName?: string; rawRequest: string; channel?: string }) {
    const res = await fetch(`${API_BASE}/integrations/requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getIntegrationProjects() {
    const res = await fetch(`${API_BASE}/integrations/projects`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async getIntegrationProjectById(id: string) {
    const res = await fetch(`${API_BASE}/integrations/projects/${id}`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async updateIntegrationDiscovery(id: string, data: any) {
    const res = await fetch(`${API_BASE}/integrations/projects/${id}/discovery`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async acceptIntegrationProposal(id: string, data: any) {
    const res = await fetch(`${API_BASE}/integrations/projects/${id}/proposals/accept`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async acceptDeliveryByCustomer(id: string, releaseId: string) {
    const res = await fetch(`${API_BASE}/integrations/projects/${id}/delivery/accept`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ releaseId })
    });
    return res.json();
  },

  async getIntegrationConnections() {
    const res = await fetch(`${API_BASE}/integrations/connections`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async reconcileConnection(id: string) {
    const res = await fetch(`${API_BASE}/integrations/connections/${id}/reconcile`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.json();
  },

  async getIntegrationPricingParameters() {
    const res = await fetch(`${API_BASE}/integrations/admin/pricing-parameters`, {
      headers: this.getHeaders()
    });
    return res.json();
  },

  async prepareIntegrationProposal(id: string, data: any) {
    const res = await fetch(API_BASE + '/integrations/admin/projects/' + encodeURIComponent(id) + '/proposal', {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateIntegrationPricingParameter(key: string, value: number) {
    const res = await fetch(API_BASE + '/integrations/admin/pricing-parameters/' + encodeURIComponent(key), {
      method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify({ value })
    });
    return res.json();
  },

  async authorizeIntegrationOrder(orderId: string, paymentStatus?: string) {
    const res = await fetch(`${API_BASE}/integrations/admin/orders/${orderId}/authorize`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ paymentStatus })
    });
    return res.json();
  }
};
