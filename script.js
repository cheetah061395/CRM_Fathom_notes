class CRM {
    constructor() {
        this.leads = JSON.parse(localStorage.getItem('crmLeads'));
        if (!this.leads) {
            this.leads = this.getExampleLeads();
            this.saveToStorage(); // Save example leads to localStorage
        }
        this.currentEditId = null;
        this.init();
    }

    getExampleLeads() {
        return [
            {
                id: 1001,
                name: "Sarah Johnson",
                email: "sarah.johnson@techstart.com",
                phone: "+1-555-0123",
                company: "TechStart Inc",
                value: 25000,
                stage: "lead",
                notes: "Interested in our enterprise package. Follow up after their Q4 planning meeting.",
                createdAt: "2025-08-01T10:00:00.000Z"
            },
            {
                id: 1002,
                name: "Mike Chen",
                email: "m.chen@globalcorp.com",
                phone: "+1-555-0124",
                company: "Global Corp",
                value: 75000,
                stage: "qualified",
                notes: "Budget approved for cloud migration project. Decision makers: Mike Chen (CTO) and Lisa Wang (CFO).",
                createdAt: "2025-08-02T09:30:00.000Z"
            },
            {
                id: 1003,
                name: "Emma Rodriguez",
                email: "emma.r@innovate.io",
                phone: "+1-555-0125",
                company: "Innovate.io",
                value: 45000,
                stage: "proposal",
                notes: "Sent proposal on 8/3. Competitive with two other vendors. Strong technical fit but price sensitive.",
                createdAt: "2025-08-03T14:15:00.000Z"
            },
            {
                id: 1004,
                name: "David Park",
                email: "david.park@datatech.com",
                phone: "+1-555-0126",
                company: "DataTech Solutions",
                value: 120000,
                stage: "negotiation",
                notes: "Contract terms under review by legal. Main concern is data security compliance. Need SOC2 certification.",
                createdAt: "2025-08-04T11:45:00.000Z"
            },
            {
                id: 1007,
                name: "Jennifer White",
                email: "j.white@enterprise.com",
                phone: "+1-555-0129",
                company: "Enterprise Systems",
                value: 200000,
                stage: "lead",
                notes: "Large enterprise deal. Initial contact through trade show. Needs custom integration with legacy systems.",
                createdAt: "2025-08-07T08:00:00.000Z"
            },
            {
                id: 1008,
                name: "Robert Garcia",
                email: "rob.garcia@medtech.org",
                phone: "+1-555-0130",
                company: "MedTech Solutions",
                value: 95000,
                stage: "qualified",
                notes: "Healthcare compliance requirements. HIPAA certification needed. Demo scheduled for next week.",
                createdAt: "2025-08-07T10:30:00.000Z"
            },
            {
                id: 1009,
                name: "Amanda Foster",
                email: "amanda@retailplus.com",
                phone: "+1-555-0131",
                company: "RetailPlus",
                value: 35000,
                stage: "proposal",
                notes: "Retail analytics solution. Seasonal business - need implementation before holiday season.",
                createdAt: "2025-08-07T12:00:00.000Z"
            },
            {
                id: 1010,
                name: "Kevin Liu",
                email: "kevin.liu@financetech.co",
                phone: "+1-555-0132",
                company: "FinanceTech Co",
                value: 150000,
                stage: "negotiation",
                notes: "Fintech startup scaling rapidly. Need multi-tenant architecture. Equity + cash deal possible.",
                createdAt: "2025-08-07T14:45:00.000Z"
            }
        ];
    }

    init() {
        this.renderLeads();
        this.bindEvents();
        this.updateStats();
    }

    bindEvents() {
        document.getElementById('addLeadBtn').addEventListener('click', () => this.openModal());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('leadForm').addEventListener('submit', (e) => this.saveLead(e));
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('leadModal')) {
                this.closeModal();
            }
        });
    }

    openModal(lead = null) {
        const modal = document.getElementById('leadModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('leadForm');
        
        if (lead) {
            title.textContent = 'Edit Lead';
            this.currentEditId = lead.id;
            document.getElementById('leadName').value = lead.name;
            document.getElementById('leadEmail').value = lead.email;
            document.getElementById('leadPhone').value = lead.phone || '';
            document.getElementById('leadCompany').value = lead.company || '';
            document.getElementById('leadValue').value = lead.value || '';
            document.getElementById('leadStage').value = lead.stage;
        } else {
            title.textContent = 'Add New Lead';
            this.currentEditId = null;
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('leadModal').style.display = 'none';
        this.currentEditId = null;
    }

    saveLead(e) {
        e.preventDefault();
        
        const leadData = {
            id: this.currentEditId || Date.now(),
            name: document.getElementById('leadName').value,
            email: document.getElementById('leadEmail').value,
            phone: document.getElementById('leadPhone').value,
            company: document.getElementById('leadCompany').value,
            value: parseFloat(document.getElementById('leadValue').value) || 0,
            stage: document.getElementById('leadStage').value,
            createdAt: this.currentEditId ? this.leads.find(l => l.id === this.currentEditId).createdAt : new Date().toISOString()
        };

        if (this.currentEditId) {
            const index = this.leads.findIndex(l => l.id === this.currentEditId);
            this.leads[index] = leadData;
        } else {
            this.leads.push(leadData);
        }

        this.saveToStorage();
        this.renderLeads();
        this.updateStats();
        this.closeModal();
    }

    deleteLead(id) {
        if (confirm('Are you sure you want to delete this lead?')) {
            this.leads = this.leads.filter(l => l.id !== id);
            this.saveToStorage();
            this.renderLeads();
            this.updateStats();
        }
    }

    moveLeadToStage(id, newStage) {
        const lead = this.leads.find(l => l.id === id);
        if (lead) {
            lead.stage = newStage;
            this.saveToStorage();
            this.renderLeads();
            this.updateStats();
        }
    }

    renderLeads() {
        const stages = ['lead', 'qualified', 'proposal', 'negotiation'];
        
        stages.forEach(stage => {
            const container = document.querySelector(`[data-stage="${stage}"]`);
            const stageLeads = this.leads.filter(lead => lead.stage === stage);
            
            container.innerHTML = '';
            
            stageLeads.forEach(lead => {
                const leadCard = this.createLeadCard(lead);
                container.appendChild(leadCard);
            });
        });
    }

    createLeadCard(lead) {
        const card = document.createElement('div');
        card.className = 'lead-card';
        card.innerHTML = `
            <div class="lead-name" style="cursor: pointer; color: #3498db; text-decoration: underline;">${lead.name}</div>
            <div class="lead-company">${lead.company || lead.email}</div>
            <div class="lead-value">$${lead.value.toLocaleString()}</div>
            <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
                ${this.createStageButtons(lead)}
                <button onclick="crm.openModal(${JSON.stringify(lead).replace(/"/g, '&quot;')})" 
                        style="padding: 2px 6px; font-size: 10px; background: #f39c12; color: white; border: none; border-radius: 3px; cursor: pointer;">Edit</button>
                <button onclick="crm.deleteLead(${lead.id})" 
                        style="padding: 2px 6px; font-size: 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;">Delete</button>
            </div>
        `;
        
        // Add click event listener to the lead name
        const leadNameElement = card.querySelector('.lead-name');
        leadNameElement.addEventListener('click', () => this.showLeadDetails(lead.id));
        
        return card;
    }

    createStageButtons(lead) {
        const stages = [
            { key: 'lead', label: 'Lead' },
            { key: 'qualified', label: 'Qualified' },
            { key: 'proposal', label: 'Proposal' },
            { key: 'negotiation', label: 'Negotiation' }
        ];
        
        return stages
            .filter(stage => stage.key !== lead.stage)
            .map(stage => `
                <button onclick="crm.moveLeadToStage(${lead.id}, '${stage.key}')" 
                        style="padding: 2px 6px; font-size: 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    → ${stage.label}
                </button>
            `).join('');
    }

    updateStats() {
        const stages = ['lead', 'qualified', 'proposal', 'negotiation'];
        
        stages.forEach(stage => {
            const stageLeads = this.leads.filter(lead => lead.stage === stage);
            const count = stageLeads.length;
            const value = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
            
            const statsElement = document.getElementById(`${stage}-stats`);
            statsElement.textContent = `${count} leads - $${value.toLocaleString()}`;
        });
    }

    showLeadDetails(leadId) {
        // Navigate to the separate lead details page with the lead ID as a URL parameter
        window.location.href = `lead-details.html?id=${leadId}`;
    }

    saveToStorage() {
        localStorage.setItem('crmLeads', JSON.stringify(this.leads));
    }
}

const crm = new CRM();