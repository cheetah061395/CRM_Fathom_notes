// Vercel serverless function to mark summary as processed
import fs from 'fs/promises';

const SUMMARIES_FILE = '/tmp/pending-summaries.json';

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
        const { id } = req.query;
        const summaryId = parseInt(id);
        
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

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error marking summary as processed:', error);
        res.status(500).json({ error: 'Failed to mark as processed' });
    }
}