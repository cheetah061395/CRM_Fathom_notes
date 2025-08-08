// Debug endpoint to see received summaries
import fs from 'fs/promises';

const SUMMARIES_FILE = '/tmp/pending-summaries.json';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let summaries = [];
        try {
            const data = await fs.readFile(SUMMARIES_FILE, 'utf8');
            summaries = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
        }

        // Return all summaries (processed and unprocessed) for debugging
        res.status(200).json({
            total: summaries.length,
            summaries: summaries,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching debug summaries:', error);
        res.status(500).json({ error: 'Failed to fetch summaries' });
    }
}