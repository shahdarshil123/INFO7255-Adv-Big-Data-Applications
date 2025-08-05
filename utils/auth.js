// require('dotenv').config({ path: '../.env' });
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

const authenticateGoogle = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // console.log(authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error: "true", message: "No token provided"});
    }

    const token = authHeader.split(' ')[1];
    // console.log(token);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });

        const payload = ticket.getPayload();
        req.user = payload;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = authenticateGoogle;
