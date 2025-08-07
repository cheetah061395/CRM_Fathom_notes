// Simple Express server to receive Zapier webhooks
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const SUMMARIES_FILE = path.join(__dirname, 'pending-summaries.json');

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files (your CRM)
app.use(express.static(__dirname));

// Webhook endpoint for Zapier
app.post('/api/webhook/fathom-summary', async (req, res) => {
    try {
        console.log('Received Fathom summary:', req.body);
        
        const summary = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            meetingTitle: req.body.meeting_title || 'Untitled Meeting',
            summary: req.body.summary || req.body.content,
            actionItems: req.body.action_items || [],
            keyTopics: req.body.key_topics || [],
            participants: req.body.participants || [],
            duration: req.body.duration,
            meetingDate: req.body.meeting_date,
            // Fields for lead matching
            leadEmail: req.body.lead_email,
            leadName: req.body.lead_name,
            leadCompany: req.body.lead_company,
            processed: false
        };

        // Read existing summaries
        let summaries = [];
        try {
            const data = await fs.readFile(SUMMARIES_FILE, 'utf8');
            summaries = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet, start with empty array
        }

        // Add new summary
        summaries.push(summary);

        // Keep only last 50 summaries
        if (summaries.length > 50) {
            summaries = summaries.slice(-50);
        }

        // Save back to file
        await fs.writeFile(SUMMARIES_FILE, JSON.stringify(summaries, null, 2));

        res.json({ success: true, id: summary.id });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

// API endpoint for CRM to fetch pending summaries
app.get('/api/pending-summaries', async (req, res) => {
    try {
        let summaries = [];
        try {
            const data = await fs.readFile(SUMMARIES_FILE, 'utf8');
            summaries = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
        }

        // Return only unprocessed summaries
        const pending = summaries.filter(s => !s.processed);
        res.json(pending);
    } catch (error) {
        console.error('Error fetching summaries:', error);
        res.status(500).json({ error: 'Failed to fetch summaries' });
    }
});

// API endpoint to mark summary as processed
app.post('/api/summaries/:id/processed', async (req, res) => {
    try {
        const summaryId = parseInt(req.params.id);
        
        let summaries = [];
        try {
            const data = await fs.readFile(SUMMARIES_FILE, 'utf8');
            summaries = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ error: 'No summaries found' });
        }

        // Find and mark as processed
        const summary = summaries.find(s => s.id === summaryId);
        if (!summary) {
            return res.status(404).json({ error: 'Summary not found' });
        }

        summary.processed = true;
        summary.leadId = req.body.leadId; // Track which lead it was assigned to

        await fs.writeFile(SUMMARIES_FILE, JSON.stringify(summaries, null, 2));

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking summary as processed:', error);
        res.status(500).json({ error: 'Failed to mark as processed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/api/webhook/fathom-summary`);
    console.log(`CRM available at: http://localhost:${PORT}/crm.html`);
});

module.exports = app;