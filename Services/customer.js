const customerDAO = require('../DAO/customerDAO');
var dateFormat = require('dateformat');

/* API to register new customer */
let add = async(req, res) => {
    try {
        let criteria = {
            Name: req.body.Name
        }
        const checkCustomer = await customerDAO.getCustomer(criteria);
        if (checkCustomer && checkCustomer.length == 1) {
            res.status(401).json({ message: 'customer already registered' })
        } else {
            const add = await customerDAO.createCustomer(req.body);
            if (add) {
                res.status(200).json({ message: 'Customer created successfully!' })
            } else {
                res.status(403).json({ message: "Something went wrong" });
            }
        }
    } catch (error) {
        res.status(404).json({ message: "Something went wrong", error: error });
    }
};

/* API to update customer */
let update = async(req, res) => {
    try {

        const update = await customerDAO.updateCustomer(req.body._id, req.body);
        if (update) {
            res.status(200).json({ message: 'Customer update successfully!' })
        } else {
            res.status(403).json({ message: "Something went wrong" });
        }

    } catch (error) {
        res.status(404).json({ message: "Something went wrong", error: error });
    }
};

/* API to delete customer */
let deleted = async(req, res) => {
    try {

        const deleted = await customerDAO.deleteCustomer(req.body._id);
        if (deleted) {
            res.status(200).json({ message: 'Customer deleted successfully!' })
        } else {
            res.status(403).json({ message: "Something went wrong" });
        }

    } catch (error) {
        res.status(404).json({ message: "Something went wrong", error: error });
    }
};

/* API to fetch all customer */
let getAllCustomer = async(req, res) => {
    try {
        const item = await customerDAO.getAllCustomer();
        item.forEach(element => {
            element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
            if (element.ModifiedDate)
                element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
        });
        res.send(item);
        res.end();
    } catch (error) {
        res.status(404).json({ message: "Something went wrong", error: error });
    }
};

module.exports = {
    add: add,
    getAllCustomer: getAllCustomer,
    update: update,
    deleted: deleted
}