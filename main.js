const express = require('express');
const session = require('express-session');

require('dotenv').config();
const channels = require('./channels.json');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        sameSite: 'lax',
        amxAge: 1000 * 60 * 60 * 24
    }
});
app.use(sessionMiddleware);

app.get('/', (req, res) => {
    if(!req.session.loginUntil || req.session.loginUntil < Date.now())
        return res.redirect('/login');

    res.render('main', {
        channels,
        req
    });
});

app.post('/message', async (req, res) => {
    if(!req.session.loginUntil || req.session.loginUntil < Date.now())
        return res.redirect('/login');

    const channel = channels.find(c => c.id === req.body.channel);
    if(!channel)
        return res.status(400).send('invalid channel');
    if(!req.body.message || req.body.message.length > 4000)
        return res.status(400).send('invalid message');

    await fetch(`https://discord.com/api/v9/channels/${channel.id}/messages`, {
        "headers": {
            "accept": "*/*",
            "accept-language": "ko",
            "authorization": process.env.TOKEN,
            "content-type": "application/json",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not:A-Brand\";v=\"24\", \"Chromium\";v=\"134\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-context-properties": "eyJsb2NhdGlvbiI6ImNoYXRfaW5wdXQifQ==",
            "x-debug-options": "bugReporterEnabled",
            "x-discord-locale": "ko",
            "x-discord-timezone": "Asia/Seoul",
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MjEzIiwib3NfdmVyc2lvbiI6IjEwLjAuMjYyMDAiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJ4NjQiLCJzeXN0ZW1fbG9jYWxlIjoia28iLCJoYXNfY2xpZW50X21vZHMiOmZhbHNlLCJjbGllbnRfbGF1bmNoX2lkIjoiNzU4MjhlOGEtYWM0OS00MTNkLWJhY2UtYTIwYjg2OGMxYzRkIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgZGlzY29yZC8xLjAuOTIxMyBDaHJvbWUvMTM0LjAuNjk5OC4yMDUgRWxlY3Ryb24vMzUuMy4wIFNhZmFyaS81MzcuMzYiLCJicm93c2VyX3ZlcnNpb24iOiIzNS4zLjAiLCJvc19zZGtfdmVyc2lvbiI6IjI2MjAwIiwiY2xpZW50X2J1aWxkX251bWJlciI6NDY2MzY2LCJuYXRpdmVfYnVpbGRfbnVtYmVyIjo3MTA5MCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbCwibGF1bmNoX3NpZ25hdHVyZSI6ImI5NWMwZWE4LTE2OWMtNDUwNi05YjZhLTczMTZjY2NhMTYxZCIsImNsaWVudF9oZWFydGJlYXRfc2Vzc2lvbl9pZCI6Ijk5MTA1YzViLWM1YjYtNGYzNC05NmMxLWI5YTNhYTg2ZjIwNiIsImNsaWVudF9hcHBfc3RhdGUiOiJmb2N1c2VkIn0=",
            "cookie": "__stripe_mid=fdee918a-e268-4671-88e1-574ac965259ed38f80; __dcfduid=24294ee0348f11f08144e17a5da1808c; __sdcfduid=24294ee1348f11f08144e17a5da1808c12937ecf64b1838a8846357b36c6ddaf633e10efd34bd57ee161ed19c88cfdbd; _cfuvid=09uZEljj_o6TfZuo6ArfygftBJ2gZJzrJCPkZCeuomE-1762940146860-0.0.1.1-604800000; cf_clearance=HGze2i6sfwQkDSpad2tz8RIe8yIBOVfZvjZXRKi3Ccs-1762940150-1.2.1.1-BGjM5ZFvxSQifqCRswUlpWL5j.Vgfl3cXEwC85VfyUR0n3Pk.0zp_iXozmGDji7UNnQfq_BpssS.Aims3EbEb_Ak3BeY2O8wOvO6u86_t0OzIr6OQruc.WrxbcEOy2SJ3z5fUwZzJlm8sciyBZ0va.d8Lu51_WFHZiOzorVGR6hJX6NM.tP9fJdX3EXoG_jJWL4ZkZBsqSXydxbujcZmOMDtJ6RwatbPr9FuG8PHf2Q",
            "Referer": `https://discord.com/channels/@favorites/${channel.id}`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body: JSON.stringify({
            mobile_network_type: "unknown",
            content: req.body.message,
            tts: false,
            flags: 0
        }),
        "method": "POST"
    });

    res.redirect(`/?channel=${channel.id}`);
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    setTimeout(() => {
        if(!process.env.PASSWORD) return res.status(403).send('do password config');

        if(req.body?.password === process.env.PASSWORD) {
            req.session.loginUntil = Date.now() + (1000 * 60 * 15);
            return res.redirect('/');
        }

        res.redirect('/login');
    }, 1000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});