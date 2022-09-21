const config = require("../Utilities/config").config;
const UserDAO = require('../DAO/userDAO');
const MD5 = require('md5');

/* API to register new user */
let register = async(req, res) => {
    console.log("register")
    if (!req.body.userId || !req.body.password) {
        res.status(401).json({ message: 'Parameters are missing' })
    } else {
        console.log("else")
        try {
            let criteria = {
                userId: req.body.userId
            }
            const checkUserId = await UserDAO.getUsers(criteria);
            if (checkUserId && checkUserId.length == 1) {
                res.status(401).json({ message: 'User ID already registered' })
            } else {
                console.log("second else")
                let userData = {
                    Name: req.body.name ? req.body.name : "",
                    UserId: req.body.userId,
                    Email: req.body.email,
                    // Password: MD5(MD5(req.body.password)),
                    Password: req.body.password,
                    Status: true
                };
                const addUser = await UserDAO.createUser(userData);
                // console
                if (addUser) {
                    res.status(200).json({ message: 'User registered successfully!' })
                } else {
                    res.status(403).json({ message: "Something went wrong" });
                }
            }
        } catch (error) {
            console.log("err =>", error)
            res.status(404).json({ message: "Something went wrong", error: error });
        }
    }
};


/* API to login user */
let login = async(req, res) => {
    if (!req.body.userId || !req.body.password) {
        res.status(401).json({ message: 'Parameters are missing' });
    } else {
        try {
            let criteria = {
                UserId: req.body.userId
                    // IsActive: true
            };
            if (req.body.userId === 'superadmin' && req.body.password === 'admin@12345') {
                var obj = {
                    UserId: req.body.userId,
                    Name: "Super Admin",
                    UserRights: ['Add', 'Edit', 'Delete', 'View']
                }
                res.status(200).json({ message: 'Logged in successfully!', result: obj, token: 'dummy-jwt-token-for-now' });
                return;
            }
            const checkUserId = await UserDAO.getUsers(criteria);
            if (checkUserId && checkUserId.length > 0) {
                if (!checkUserId[0].IsActive) {
                    res.status(401).json({ message: 'User ID is deactivated!' });
                    return;
                }
                let criteria = {
                    UserId: req.body.userId,
                    Password: req.body.password
                        // Password: MD5(MD5(req.body.password))
                };
                const checkPassword = await UserDAO.getUsers(criteria);
                if (checkPassword && checkPassword.length == 1) {
                    res.status(200).json({ message: 'Logged in successfully!', result: checkPassword[0], token: 'dummy-jwt-token-for-now' });
                } else {
                    res.status(401).json({ message: 'Incorrect password' });
                }
            } else {
                res.status(401).json({ message: 'User ID not exist!' });
            }
        } catch (error) {
            res.status(401).json({ message: 'Something went wrong', error: error });
        }
    }
};

module.exports = {
    register: register,
    login: login
}