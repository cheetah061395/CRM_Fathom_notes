// Test endpoint that returns the integration script directly
export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head><title>Test Fathom Integration</title></head>
    <body>
        <h1>Testing Fathom Integration</h1>
        <p>Check console for results</p>
        
        <script>
        console.log('Starting integration test...');
        
        // Simulate a Fathom summary
        const testSummary = {
            id: Date.now(),
            meetingTitle: 'Test Meeting with Shirley',
            summary: 'This is a test summary',
            actionItems: ['Follow up on project'],
            keyTopics: ['Integration'],
            leadEmail: 'shirley@test.com',
            leadName: 'Shirley Jiang',
            processed: false
        };
        
        // Get current leads from localStorage
        const leads = JSON.parse(localStorage.getItem('crmLeads') || '[]');
        console.log('Current leads:', leads);
        
        // Try to find matching lead
        let matchedLead = leads.find(lead => 
            lead.email && lead.email.toLowerCase().includes('shirley') ||
            lead.name && lead.name.toLowerCase().includes('shirley')
        );
        
        if (!matchedLead) {
            matchedLead = leads.find(lead => 
                lead.name && lead.name.toLowerCase() === 'shirley jiang'
            );
        }
        
        console.log('Matched lead:', matchedLead);
        
        if (matchedLead) {
            const formattedSummary = \`═══ FATHOM SUMMARY (TEST) ═══
Meeting: \${testSummary.meetingTitle}
Date: \${new Date().toLocaleDateString()}
Imported: \${new Date().toLocaleString()}

\${testSummary.summary}

ACTION ITEMS:
• \${testSummary.actionItems[0]}

KEY TOPICS:
• \${testSummary.keyTopics[0]}
═══ END FATHOM SUMMARY ═══\`;

            const currentNotes = matchedLead.notes || '';
            const separator = currentNotes.trim() ? '\\n\\n' : '';
            matchedLead.notes = currentNotes + separator + formattedSummary;
            
            localStorage.setItem('crmLeads', JSON.stringify(leads));
            console.log('✅ Test summary added to lead notes!');
            console.log('Updated lead:', matchedLead);
        } else {
            console.log('❌ No matching lead found');
            console.log('Available leads:', leads.map(l => ({ name: l.name, email: l.email })));
        }
        </script>
    </body>
    </html>
    `);
}