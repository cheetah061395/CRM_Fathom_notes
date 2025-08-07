// Vercel serverless function for Fathom webhook
import fs from 'fs/promises';
import path from 'path';

const SUMMARIES_FILE = '/tmp/pending-summaries.json';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        res.status(200).json({ success: true, id: summary.id });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
}