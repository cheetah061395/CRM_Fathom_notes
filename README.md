# Simple CRM with Fathom AI Integration

A lightweight CRM system with direct integration for Fathom AI meeting summaries via Zapier webhooks.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Your CRM will be available at: http://localhost:3001/crm.html
Webhook endpoint: http://localhost:3001/api/webhook/fathom-summary

## 📥 Zapier Integration Setup

### Step 1: Set up your Zapier Webhook

1. **Create a new Zap in Zapier**
2. **Trigger**: Choose "Fathom" → "New Meeting Summary"
3. **Action**: Choose "Webhooks by Zapier" → "POST"
4. **Configure the webhook**:
   - URL: `http://your-server.com/api/webhook/fathom-summary`
   - Method: `POST`
   - Data Format: `JSON`

### Step 2: Configure the webhook payload

Map the following Fathom fields to JSON keys:

```json
{
  "meeting_title": "{{title}}",
  "summary": "{{summary}}",
  "action_items": ["{{action_item_1}}", "{{action_item_2}}"],
  "key_topics": ["{{topic_1}}", "{{topic_2}}"],
  "participants": [
    {"name": "{{participant_1_name}}", "email": "{{participant_1_email}}"}
  ],
  "duration": "{{duration_seconds}}",
  "meeting_date": "{{start_time}}",
  "lead_email": "{{lead_email}}",
  "lead_name": "{{lead_name}}",
  "lead_company": "{{lead_company}}"
}
```

### Step 3: Lead Matching

The system automatically matches incoming summaries to leads using:

- **Email matching**: `lead_email` matches the lead's email
- **Name matching**: `lead_name` contains part of the lead's name
- **Company matching**: `lead_company` matches the lead's company
- **Participant matching**: Any participant email matches the lead's email

## 🎯 How It Works

### Automatic Processing
1. **Fathom** records and processes your meeting
2. **Zapier** sends the summary to your webhook endpoint
3. **CRM** stores the summary and attempts to match it to existing leads
4. **Users** see a notification when viewing matching lead details

### Manual Processing
1. Click **"📥 Check Incoming"** on any lead details page
2. View summaries that match the current lead
3. Select and import the relevant summary
4. Summary gets added to the lead's notes with proper formatting

### Features
- ✅ **Auto-matching** - Summaries automatically match to leads
- ✅ **Real-time checking** - Auto-checks every 30 seconds
- ✅ **Rich formatting** - Professional summary formatting
- ✅ **Action items** - Extracts and formats action items
- ✅ **Key topics** - Highlights important discussion points
- ✅ **Duplicate prevention** - Marks summaries as processed
- ✅ **Manual override** - Manually check and import summaries

## 🔧 API Endpoints

### Webhook Endpoint
```
POST /api/webhook/fathom-summary
Content-Type: application/json

{
  "meeting_title": "Sales Call - TechStart",
  "summary": "Discussed enterprise package requirements...",
  "action_items": ["Send proposal", "Schedule demo"],
  "key_topics": ["Pricing", "Implementation"],
  "participants": [{"name": "John Doe", "email": "john@techstart.com"}],
  "duration": 2700,
  "meeting_date": "2025-01-15T10:00:00Z",
  "lead_email": "john@techstart.com"
}
```

### Check Pending Summaries
```
GET /api/pending-summaries
```

### Mark Summary as Processed
```
POST /api/summaries/{id}/processed
Content-Type: application/json

{
  "leadId": 1001
}
```

## 📁 File Structure

```
├── crm.html              # Main dashboard
├── lead-details.html     # Lead details page  
├── shared.css           # Common styles
├── dashboard.css        # Dashboard styles
├── details.css          # Details page styles
├── script.js            # Dashboard JavaScript
├── lead-details.js      # Details page JavaScript
├── webhook-server.js    # Express server for webhooks
├── package.json         # Node.js dependencies
└── pending-summaries.json # Webhook data storage
```

## 🌐 Deployment Options

### Option 1: Local Development
```bash
npm start
# Use ngrok for webhook testing
npx ngrok http 3001
```

### Option 2: Cloud Deployment
Deploy to platforms like:
- **Vercel** (recommended for serverless)
- **Railway** 
- **Render**
- **Digital Ocean**
- **AWS/GCP/Azure**

### Option 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔒 Security Notes

- API endpoint is open by default for webhook access
- Consider adding webhook signature verification
- Store sensitive data in environment variables
- Use HTTPS in production
- Implement rate limiting for production use

## 🎨 Summary Format

Imported summaries are formatted as:

```
═══ FATHOM SUMMARY (via Zapier) ═══
Meeting: Sales Call - TechStart Inc  
Date: 1/15/2025
Duration: 45 minutes
Imported: 1/15/2025, 2:30:00 PM

[Meeting summary content here]

ACTION ITEMS:
• Send enterprise pricing proposal
• Schedule technical demo
• Connect with procurement team

KEY TOPICS:
• Budget approval process
• Technical requirements
• Implementation timeline
═══ END FATHOM SUMMARY ═══
```

## 🤝 Support

For questions or issues:
1. Check the browser console for errors
2. Verify webhook payload format
3. Test endpoints manually with curl/Postman
4. Check server logs for debugging

Happy CRM-ing! 🎉