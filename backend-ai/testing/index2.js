const msal = require('@azure/msal-node');
const axios = require('axios');
const express = require('express');

// ⚠️ PASTE YOUR AZURE DETAILS HERE ⚠️
const dont_tell_id = 'zyz';
const dont_tell= 'xyz';
const REDIRECT_URI = 'http://localhost:3000'; 

const config = {
    auth: {
        clientId: dont_tell_id,
        authority: "https://login.microsoftonline.com/common",
        clientSecret: CLIENT_SECRET
    }
};ṭ

const pca = new msal.ConfidentialClientApplication(config);
const app = express();

app.get('/', async (req, res) => {
    const authCode = req.query.code;

    // SCENARIO 1: We have a code! (Microsoft sent us back)
    if (authCode) {
        const tokenRequest = {
            code: authCode,
            scopes: ["user.read", "mail.read"],
            redirectUri: REDIRECT_URI,
        };

        try {
            const response = await pca.acquireTokenByCode(tokenRequest);
            console.log("\n✅ Login Successful!");
            
            // Fetch Emails
            await fetchEmails(response.accessToken);

            res.send("<h1>Login Successful!</h1><p>Check your terminal for your emails.</p>");
            
            // Clean exit after 5 seconds
            setTimeout(() => {
                console.log("Stopping server...");
                process.exit(0);
            }, 5000);

        } catch (error) {
            console.log(error);
            res.status(500).send("Error signing in.");
        }

    // SCENARIO 2: No code yet? Start the login.
    } else {
        const authCodeUrlParameters = {
            scopes: ["user.read", "mail.read"],
            redirectUri: REDIRECT_URI,
        };

        const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
        res.redirect(authUrl);
    }
});

async function fetchEmails(accessToken) {
    try {
        console.log("\n📩 Fetching last 5 emails from Outlook...");
        const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { '$top': 5, '$select': 'subject,from,receivedDateTime' }
        });

        const emails = graphResponse.data.value;
        if (emails.length === 0) console.log("No emails found.");
        else {
            console.log("------------------------------------------------");
            emails.forEach(email => {
                console.log(`FROM:    ${email.from.emailAddress.name} <${email.from.emailAddress.address}>`);
                console.log(`SUBJECT: ${email.subject}`);
                console.log(`DATE:    ${email.receivedDateTime}`);
                console.log("------------------------------------------------");
            });
        }
    } catch (error) {
        console.error("❌ Error fetching emails:", error.message);
    }
}

// Start Server
const server = app.listen(3000, async () => {
    console.log('🚀 Server started on http://localhost:3000');
    console.log('Opening browser...');
    const { default: open } = await import('open');
    open('http://localhost:3000');
});