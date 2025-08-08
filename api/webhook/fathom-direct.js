// Vercel serverless function for direct Fathom to CRM notes integration
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Received Fathom summary for direct integration:', req.body);
        
        const {
            meeting_title,
            summary,
            action_items = [],
            key_topics = [],
            participants = [],
            duration,
            meeting_date,
            lead_email,
            lead_name,
            lead_company
        } = req.body;

        // Format the summary for notes
        const formattedSummary = formatFathomSummary({
            meetingTitle: meeting_title || 'Untitled Meeting',
            summary: summary || 'No summary provided',
            actionItems: Array.isArray(action_items) ? action_items : (action_items ? [action_items] : []),
            keyTopics: Array.isArray(key_topics) ? key_topics : (key_topics ? [key_topics] : []),
            participants: Array.isArray(participants) ? participants : [],
            duration,
            meetingDate: meeting_date,
            timestamp: new Date().toISOString()
        });

        // Create response with formatted summary and matching info
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            formattedSummary,
            leadMatching: {
                email: lead_email,
                name: lead_name,
                company: lead_company
            },
            // Include script to automatically add to CRM if accessed from browser
            autoScript: `
                // Auto-add to CRM notes if localStorage available
                if (typeof localStorage !== 'undefined') {
                    const leads = JSON.parse(localStorage.getItem('crmLeads') || '[]');
                    let targetLead = null;
                    
                    // Find matching lead by email, name, or company
                    if ('${lead_email}') {
                        targetLead = leads.find(lead => 
                            lead.email.toLowerCase() === '${lead_email}'.toLowerCase()
                        );
                    }
                    
                    if (!targetLead && '${lead_name}') {
                        targetLead = leads.find(lead => 
                            lead.name.toLowerCase().includes('${lead_name}'.toLowerCase()) ||
                            '${lead_name}'.toLowerCase().includes(lead.name.toLowerCase())
                        );
                    }
                    
                    if (!targetLead && '${lead_company}') {
                        targetLead = leads.find(lead => 
                            lead.company.toLowerCase().includes('${lead_company}'.toLowerCase()) ||
                            '${lead_company}'.toLowerCase().includes(lead.company.toLowerCase())
                        );
                    }
                    
                    if (targetLead) {
                        const currentNotes = targetLead.notes || '';
                        const separator = currentNotes.trim() ? '\\n\\n' : '';
                        targetLead.notes = currentNotes + separator + \`${formattedSummary.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                        localStorage.setItem('crmLeads', JSON.stringify(leads));
                        console.log('Fathom summary added to lead:', targetLead.name);
                    } else {
                        console.log('No matching lead found for Fathom summary');
                    }
                }
            `
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error processing Fathom webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
}

function formatFathomSummary({ meetingTitle, summary, actionItems, keyTopics, participants, duration, meetingDate, timestamp }) {
    let formatted = `═══ FATHOM SUMMARY (via Zapier) ═══\n`;
    formatted += `Meeting: ${meetingTitle}\n`;
    
    if (meetingDate) {
        const date = new Date(meetingDate);
        formatted += `Date: ${date.toLocaleDateString()}\n`;
    }
    
    if (duration) {
        const minutes = Math.round(duration / 60);
        formatted += `Duration: ${minutes} minutes\n`;
    }
    
    formatted += `Imported: ${new Date(timestamp).toLocaleString()}\n\n`;
    formatted += `${summary}\n`;
    
    if (actionItems && actionItems.length > 0) {
        formatted += `\nACTION ITEMS:\n`;
        actionItems.forEach(item => {
            if (item && item.trim()) {
                formatted += `• ${item}\n`;
            }
        });
    }
    
    if (keyTopics && keyTopics.length > 0) {
        formatted += `\nKEY TOPICS:\n`;
        keyTopics.forEach(topic => {
            if (topic && topic.trim()) {
                formatted += `• ${topic}\n`;
            }
        });
    }
    
    formatted += `═══ END FATHOM SUMMARY ═══`;
    
    return formatted;
}