class LeadDetails {
    constructor() {
        this.currentLead = null;
        this.init();
    }

    init() {
        this.loadLeadFromURL();
        this.bindEvents();
    }

    loadLeadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const leadId = urlParams.get('id');
        
        if (!leadId) {
            alert('No lead ID provided');
            window.location.href = 'crm.html';
            return;
        }

        const leads = JSON.parse(localStorage.getItem('crmLeads')) || [];
        this.currentLead = leads.find(l => l.id == parseInt(leadId));
        
        if (!this.currentLead) {
            alert('Lead not found');
            window.location.href = 'crm.html';
            return;
        }

        this.displayLeadDetails();
    }

    displayLeadDetails() {
        const lead = this.currentLead;
        
        document.getElementById('leadDetailsTitle').textContent = `${lead.name} - Details`;
        document.getElementById('detailName').value = lead.name;
        document.getElementById('detailEmail').value = lead.email;
        document.getElementById('detailPhone').value = lead.phone || '';
        document.getElementById('detailCompany').value = lead.company || '';
        document.getElementById('detailValue').value = lead.value;
        document.getElementById('detailStage').value = lead.stage;
        document.getElementById('detailNotes').value = lead.notes || '';
        document.getElementById('detailCreated').textContent = new Date(lead.createdAt).toLocaleDateString();
        
        this.updateActionButtons(lead.stage);
    }

    updateActionButtons(currentStage) {
        const buttons = {
            'moveToLead': document.getElementById('moveToLead'),
            'moveToQualified': document.getElementById('moveToQualified'),
            'moveToProposal': document.getElementById('moveToProposal'),
            'moveToNegotiation': document.getElementById('moveToNegotiation')
        };
        
        // Show all buttons first
        Object.values(buttons).forEach(btn => btn.style.display = 'inline-block');
        
        // Hide current stage button
        if (buttons[`moveTo${currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}`]) {
            buttons[`moveTo${currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}`].style.display = 'none';
        }
    }

    bindEvents() {
        document.getElementById('backToMainBtn').addEventListener('click', () => {
            window.location.href = 'crm.html';
        });

        // Fathom integration button
        document.getElementById('fathomBtn').addEventListener('click', () => this.importFathomSummary());
        
        // Webhook check button
        document.getElementById('checkWebhooksBtn').addEventListener('click', () => this.checkIncomingSummaries());
        
        // Clear notes button
        document.getElementById('clearNotesBtn').addEventListener('click', () => this.clearNotes());
        
        // Auto-check for incoming summaries every 30 seconds
        setInterval(() => this.checkIncomingSummaries(true), 30000);

        // Add event listeners to editable fields for auto-save
        document.getElementById('detailName').addEventListener('blur', () => this.saveField());
        document.getElementById('detailEmail').addEventListener('blur', () => this.saveField());
        document.getElementById('detailPhone').addEventListener('blur', () => this.saveField());
        document.getElementById('detailCompany').addEventListener('blur', () => this.saveField());
        document.getElementById('detailValue').addEventListener('blur', () => this.saveField());
        document.getElementById('detailStage').addEventListener('change', () => this.saveField());
        document.getElementById('detailNotes').addEventListener('blur', () => this.saveField());
        
        // Also save on Enter key for text inputs (but not for notes textarea)
        const textInputs = ['detailName', 'detailEmail', 'detailPhone', 'detailCompany', 'detailValue'];
        textInputs.forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.target.blur(); // This will trigger the blur event and save
                }
            });
        });
        
        // For notes textarea, save on Ctrl+Enter or when user stops typing for 2 seconds
        let notesTimeout;
        document.getElementById('detailNotes').addEventListener('input', () => {
            clearTimeout(notesTimeout);
            notesTimeout = setTimeout(() => this.saveField(), 2000);
        });
        
        document.getElementById('detailNotes').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.saveField();
            }
        });
    }

    saveField() {
        const updatedLead = {
            ...this.currentLead,
            name: document.getElementById('detailName').value,
            email: document.getElementById('detailEmail').value,
            phone: document.getElementById('detailPhone').value,
            company: document.getElementById('detailCompany').value,
            value: parseFloat(document.getElementById('detailValue').value) || 0,
            stage: document.getElementById('detailStage').value,
            notes: document.getElementById('detailNotes').value
        };

        // Update in localStorage
        const leads = JSON.parse(localStorage.getItem('crmLeads')) || [];
        const index = leads.findIndex(l => l.id === this.currentLead.id);
        if (index !== -1) {
            leads[index] = updatedLead;
            localStorage.setItem('crmLeads', JSON.stringify(leads));
        }

        this.currentLead = updatedLead;
        
        // Update the page title if name changed
        document.getElementById('leadDetailsTitle').textContent = `${updatedLead.name} - Details`;
        
        // Update action buttons if stage changed
        this.updateActionButtons(updatedLead.stage);
        
        // Visual feedback that save occurred
        this.showSaveIndicator();
    }

    showSaveIndicator() {
        // Create a small save indicator
        const indicator = document.createElement('div');
        indicator.textContent = '✓ Saved';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // Fade in
        setTimeout(() => indicator.style.opacity = '1', 10);
        
        // Fade out and remove
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

    moveLeadToStage(newStage) {
        const updatedLead = {
            ...this.currentLead,
            stage: newStage
        };

        // Update in localStorage
        const leads = JSON.parse(localStorage.getItem('crmLeads')) || [];
        const index = leads.findIndex(l => l.id === this.currentLead.id);
        if (index !== -1) {
            leads[index] = updatedLead;
            localStorage.setItem('crmLeads', JSON.stringify(leads));
        }

        this.currentLead = updatedLead;
        this.displayLeadDetails();
    }

    async importFathomSummary() {
        const fathomBtn = document.getElementById('fathomBtn');
        const originalText = fathomBtn.textContent;
        
        // Check if API key is configured
        const apiKey = this.getFathomApiKey();
        if (!apiKey) {
            this.showFathomSetup();
            return;
        }

        try {
            // Disable button and show loading
            fathomBtn.disabled = true;
            fathomBtn.textContent = '🔄 Loading...';

            // Get meetings from Fathom
            const meetings = await this.fetchFathomMeetings(apiKey);
            
            if (meetings.length === 0) {
                alert('No recent meetings found in your Fathom account.');
                return;
            }

            // Show meeting selector
            const selectedMeeting = await this.showMeetingSelector(meetings);
            if (!selectedMeeting) return;

            // Get the summary for the selected meeting
            const summary = await this.fetchFathomSummary(apiKey, selectedMeeting.id);
            
            // Format and insert the summary
            this.insertFathomSummary(summary, selectedMeeting);
            
        } catch (error) {
            console.error('Fathom import error:', error);
            alert('Error importing Fathom summary: ' + error.message);
        } finally {
            // Re-enable button
            fathomBtn.disabled = false;
            fathomBtn.textContent = originalText;
        }
    }

    getFathomApiKey() {
        // Check localStorage for saved API key
        let apiKey = localStorage.getItem('fathomApiKey');
        
        if (!apiKey) {
            // Prompt user for API key
            apiKey = prompt('Enter your Fathom API key:\n\nYou can find this in your Fathom settings under "API Access"');
            if (apiKey) {
                localStorage.setItem('fathomApiKey', apiKey);
            }
        }
        
        return apiKey;
    }

    showFathomSetup() {
        alert(`To import Fathom summaries, you need to:\n\n1. Get your Fathom API key from fathom.video/settings\n2. Click the import button again\n3. Enter your API key when prompted\n\nYour API key will be saved locally for future use.`);
    }

    async fetchFathomMeetings(apiKey) {
        const response = await fetch('https://api.fathom.video/v1/meetings?limit=20', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch meetings: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.meetings || [];
    }

    async fetchFathomSummary(apiKey, meetingId) {
        const response = await fetch(`https://api.fathom.video/v1/meetings/${meetingId}/summary`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async showMeetingSelector(meetings) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="this.closest('.modal').remove(); resolve(null);">&times;</span>
                    <h2>Select Fathom Meeting</h2>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${meetings.map(meeting => `
                            <div class="meeting-item" onclick="selectMeeting('${meeting.id}')" 
                                 style="padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 5px; cursor: pointer; border: 2px solid transparent;">
                                <div style="font-weight: bold; margin-bottom: 5px;">${meeting.title || 'Untitled Meeting'}</div>
                                <div style="color: #7f8c8d; font-size: 14px;">
                                    ${new Date(meeting.start_time).toLocaleString()} • ${Math.round(meeting.duration / 60)} min
                                </div>
                                <div style="color: #555; font-size: 13px; margin-top: 5px;">
                                    ${meeting.participants?.map(p => p.name).join(', ') || 'No participants listed'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="form-actions">
                        <button onclick="this.closest('.modal').remove(); resolve(null);" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add click handlers
            window.selectMeeting = (meetingId) => {
                const selectedMeeting = meetings.find(m => m.id === meetingId);
                modal.remove();
                resolve(selectedMeeting);
            };

            // Style hover effects
            const meetingItems = modal.querySelectorAll('.meeting-item');
            meetingItems.forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.borderColor = '#3498db';
                    item.style.backgroundColor = '#e3f2fd';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.borderColor = 'transparent';
                    item.style.backgroundColor = '#f8f9fa';
                });
            });
        });
    }

    insertFathomSummary(summary, meeting) {
        const notesField = document.getElementById('detailNotes');
        const currentNotes = notesField.value;
        
        const timestamp = new Date().toLocaleString();
        const meetingDate = new Date(meeting.start_time).toLocaleDateString();
        
        const fathomSummary = `
═══ FATHOM SUMMARY ═══
Meeting: ${meeting.title || 'Untitled Meeting'}
Date: ${meetingDate}
Duration: ${Math.round(meeting.duration / 60)} minutes
Imported: ${timestamp}

${summary.summary || summary.content || 'No summary available'}

${summary.action_items && summary.action_items.length > 0 ? `
ACTION ITEMS:
${summary.action_items.map(item => `• ${item}`).join('\n')}
` : ''}

${summary.key_topics && summary.key_topics.length > 0 ? `
KEY TOPICS:
${summary.key_topics.map(topic => `• ${topic}`).join('\n')}
` : ''}
═══ END FATHOM SUMMARY ═══
        `.trim();

        // Add to existing notes or replace
        const separator = currentNotes.trim() ? '\n\n' : '';
        notesField.value = currentNotes + separator + fathomSummary;
        
        // Auto-save the updated notes
        this.saveField();
        
        // Show success message
        this.showSaveIndicator('📝 Fathom summary imported!');
    }

    async checkIncomingSummaries(silent = false) {
        const webhookBtn = document.getElementById('checkWebhooksBtn');
        const originalText = webhookBtn.textContent;

        try {
            if (!silent) {
                webhookBtn.disabled = true;
                webhookBtn.textContent = '🔄 Checking...';
            }

            const response = await fetch('/api/pending-summaries');
            if (!response.ok) {
                throw new Error('Failed to fetch pending summaries');
            }

            const summaries = await response.json();
            
            if (summaries.length === 0) {
                if (!silent) {
                    this.showSaveIndicator('📥 No new summaries');
                }
                return;
            }

            // Try to match summaries to current lead
            const matchingSummaries = this.findMatchingSummaries(summaries);
            
            if (matchingSummaries.length > 0) {
                await this.showSummarySelector(matchingSummaries);
            } else if (!silent) {
                this.showSaveIndicator(`📥 ${summaries.length} summaries found (no matches)`);
            }

        } catch (error) {
            console.error('Error checking webhooks:', error);
            if (!silent) {
                this.showSaveIndicator('❌ Error checking summaries');
            }
        } finally {
            if (!silent) {
                webhookBtn.disabled = false;
                webhookBtn.textContent = originalText;
            }
        }
    }

    findMatchingSummaries(summaries) {
        const currentLead = this.currentLead;
        return summaries.filter(summary => {
            // Match by email
            if (summary.leadEmail && currentLead.email.toLowerCase() === summary.leadEmail.toLowerCase()) {
                return true;
            }
            
            // Match by name
            if (summary.leadName && currentLead.name.toLowerCase().includes(summary.leadName.toLowerCase())) {
                return true;
            }
            
            // Match by company
            if (summary.leadCompany && currentLead.company && 
                currentLead.company.toLowerCase().includes(summary.leadCompany.toLowerCase())) {
                return true;
            }
            
            // Match by participants email
            if (summary.participants) {
                const participantEmails = summary.participants.map(p => p.email || '').filter(e => e);
                if (participantEmails.some(email => email.toLowerCase() === currentLead.email.toLowerCase())) {
                    return true;
                }
            }
            
            return false;
        });
    }

    async showSummarySelector(summaries) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="this.closest('.modal').remove(); resolve(null);">&times;</span>
                    <h2>📥 Incoming Meeting Summaries</h2>
                    <p style="margin-bottom: 20px; color: #7f8c8d;">Found ${summaries.length} summary(ies) that might match this lead:</p>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${summaries.map(summary => `
                            <div class="summary-item" onclick="selectSummary(${summary.id})" 
                                 style="padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 5px; cursor: pointer; border: 2px solid transparent;">
                                <div style="font-weight: bold; margin-bottom: 5px;">${summary.meetingTitle}</div>
                                <div style="color: #7f8c8d; font-size: 14px; margin-bottom: 8px;">
                                    ${new Date(summary.timestamp).toLocaleString()}
                                    ${summary.duration ? ` • ${Math.round(summary.duration / 60)} min` : ''}
                                </div>
                                <div style="color: #555; font-size: 13px; max-height: 60px; overflow: hidden;">
                                    ${(summary.summary || '').substring(0, 150)}${(summary.summary || '').length > 150 ? '...' : ''}
                                </div>
                                ${summary.participants && summary.participants.length > 0 ? `
                                    <div style="color: #3498db; font-size: 12px; margin-top: 5px;">
                                        👥 ${summary.participants.map(p => p.name || p.email).join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="form-actions">
                        <button onclick="this.closest('.modal').remove(); resolve(null);" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add click handlers
            window.selectSummary = async (summaryId) => {
                const selectedSummary = summaries.find(s => s.id === summaryId);
                modal.remove();
                
                if (selectedSummary) {
                    await this.importWebhookSummary(selectedSummary);
                }
                resolve(selectedSummary);
            };

            // Style hover effects
            const summaryItems = modal.querySelectorAll('.summary-item');
            summaryItems.forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.borderColor = '#3498db';
                    item.style.backgroundColor = '#e3f2fd';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.borderColor = 'transparent';
                    item.style.backgroundColor = '#f8f9fa';
                });
            });
        });
    }

    async importWebhookSummary(summary) {
        const notesField = document.getElementById('detailNotes');
        const currentNotes = notesField.value;
        
        const timestamp = new Date().toLocaleString();
        const meetingDate = summary.meetingDate ? new Date(summary.meetingDate).toLocaleDateString() : 'Unknown';
        
        const webhookSummary = `
═══ FATHOM SUMMARY (via Zapier) ═══
Meeting: ${summary.meetingTitle}
Date: ${meetingDate}
${summary.duration ? `Duration: ${Math.round(summary.duration / 60)} minutes` : ''}
Imported: ${timestamp}

${summary.summary || 'No summary available'}

${summary.actionItems && summary.actionItems.length > 0 ? `
ACTION ITEMS:
${summary.actionItems.map(item => `• ${item}`).join('\n')}
` : ''}

${summary.keyTopics && summary.keyTopics.length > 0 ? `
KEY TOPICS:
${summary.keyTopics.map(topic => `• ${topic}`).join('\n')}
` : ''}
═══ END FATHOM SUMMARY ═══
        `.trim();

        // Add to existing notes
        const separator = currentNotes.trim() ? '\n\n' : '';
        notesField.value = currentNotes + separator + webhookSummary;
        
        // Auto-save the updated notes
        this.saveField();
        
        // Mark as processed on server
        try {
            await fetch(`/api/summaries/${summary.id}/processed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ leadId: this.currentLead.id })
            });
        } catch (error) {
            console.error('Error marking summary as processed:', error);
        }
        
        // Show success message
        this.showSaveIndicator('📥 Webhook summary imported!');
    }

    clearNotes() {
        if (confirm('Are you sure you want to clear all notes?')) {
            document.getElementById('detailNotes').value = '';
            this.saveField();
        }
    }

    showSaveIndicator(message = '✓ Saved') {
        // Create a small save indicator
        const indicator = document.createElement('div');
        indicator.textContent = message;
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // Fade in
        setTimeout(() => indicator.style.opacity = '1', 10);
        
        // Fade out and remove
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 3000);
    }
}

const leadDetails = new LeadDetails();