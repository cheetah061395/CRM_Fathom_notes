// Auto-integration script for Fathom summaries
class FathomAutoIntegration {
    constructor() {
        this.init();
    }

    init() {
        // Check for new summaries every 30 seconds when CRM is open
        if (typeof localStorage !== 'undefined') {
            this.startAutoCheck();
        }
    }

    startAutoCheck() {
        // Check immediately
        this.checkForNewSummaries();
        
        // Then check every 30 seconds
        setInterval(() => {
            this.checkForNewSummaries();
        }, 30000);
    }

    async checkForNewSummaries() {
        try {
            const response = await fetch('/api/pending-summaries');
            if (!response.ok) return;
            
            const summaries = await response.json();
            if (summaries.length === 0) return;

            const leads = JSON.parse(localStorage.getItem('crmLeads') || '[]');
            let updated = false;

            for (const summary of summaries) {
                const matchedLead = this.findMatchingLead(leads, summary);
                if (matchedLead) {
                    this.addSummaryToLead(matchedLead, summary);
                    await this.markSummaryAsProcessed(summary.id, matchedLead.id);
                    updated = true;
                    console.log(`Auto-added Fathom summary to ${matchedLead.name}`);
                }
            }

            if (updated) {
                localStorage.setItem('crmLeads', JSON.stringify(leads));
                // Refresh the current page if we're on lead details
                if (window.location.pathname.includes('lead-details')) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const leadId = urlParams.get('id');
                    if (leadId && typeof window.loadLeadDetails === 'function') {
                        window.loadLeadDetails(parseInt(leadId));
                    }
                }
            }
        } catch (error) {
            console.error('Error checking for Fathom summaries:', error);
        }
    }

    findMatchingLead(leads, summary) {
        // Try email match first (most reliable)
        if (summary.leadEmail) {
            const emailMatch = leads.find(lead => 
                lead.email.toLowerCase() === summary.leadEmail.toLowerCase()
            );
            if (emailMatch) return emailMatch;
        }

        // Try participant email match
        if (summary.participants && summary.participants.length > 0) {
            for (const participant of summary.participants) {
                if (participant.email) {
                    const participantMatch = leads.find(lead => 
                        lead.email.toLowerCase() === participant.email.toLowerCase()
                    );
                    if (participantMatch) return participantMatch;
                }
            }
        }

        // Try name match
        if (summary.leadName) {
            const nameMatch = leads.find(lead => 
                lead.name.toLowerCase().includes(summary.leadName.toLowerCase()) ||
                summary.leadName.toLowerCase().includes(lead.name.toLowerCase())
            );
            if (nameMatch) return nameMatch;
        }

        // Try company match
        if (summary.leadCompany) {
            const companyMatch = leads.find(lead => 
                lead.company.toLowerCase().includes(summary.leadCompany.toLowerCase()) ||
                summary.leadCompany.toLowerCase().includes(lead.company.toLowerCase())
            );
            if (companyMatch) return companyMatch;
        }

        return null;
    }

    addSummaryToLead(lead, summary) {
        const formattedSummary = this.formatSummary(summary);
        const currentNotes = lead.notes || '';
        const separator = currentNotes.trim() ? '\n\n' : '';
        lead.notes = currentNotes + separator + formattedSummary;
    }

    formatSummary(summary) {
        let formatted = `═══ FATHOM SUMMARY (via Zapier) ═══\n`;
        formatted += `Meeting: ${summary.meetingTitle}\n`;
        
        if (summary.meetingDate) {
            const date = new Date(summary.meetingDate);
            formatted += `Date: ${date.toLocaleDateString()}\n`;
        }
        
        if (summary.duration) {
            const minutes = Math.round(summary.duration / 60);
            formatted += `Duration: ${minutes} minutes\n`;
        }
        
        formatted += `Imported: ${new Date().toLocaleString()}\n\n`;
        formatted += `${summary.summary}\n`;
        
        if (summary.actionItems && summary.actionItems.length > 0) {
            formatted += `\nACTION ITEMS:\n`;
            summary.actionItems.forEach(item => {
                if (item && item.trim()) {
                    formatted += `• ${item}\n`;
                }
            });
        }
        
        if (summary.keyTopics && summary.keyTopics.length > 0) {
            formatted += `\nKEY TOPICS:\n`;
            summary.keyTopics.forEach(topic => {
                if (topic && topic.trim()) {
                    formatted += `• ${topic}\n`;
                }
            });
        }
        
        formatted += `═══ END FATHOM SUMMARY ═══`;
        
        return formatted;
    }

    async markSummaryAsProcessed(summaryId, leadId) {
        try {
            await fetch(`/api/summaries/${summaryId}/processed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ leadId })
            });
        } catch (error) {
            console.error('Error marking summary as processed:', error);
        }
    }
}

// Initialize auto-integration when DOM is loaded
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new FathomAutoIntegration();
        });
    } else {
        new FathomAutoIntegration();
    }
}