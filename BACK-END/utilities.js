const jwt = require('jsonwebtoken')

function authenticateToken(req,res,next){
    const authHeader = req.headers ["authorization"];
    const token = authHeader && authHeader.split (" ")[1];

    // Jika tidak ada Token maka unauthorized
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=>{
        // Ketika Token Invalid, Maka akan 401
        if(err) return res.sendStatus(401);
        req.user = user;
        next();
    });
}
module.exports = {
    authenticateToken,
};
//const { authenticateToken } = requiere("./utilities");
