const express = require("express");
const router = express.Router({ mergeParams: true });
const mongodb = require("../Utilities/mongodb")
var ObjectId = require('mongodb').ObjectID;

mongodb.connectDB(async err => {
    if (err) {
        logger.setErrorLog(err);
        throw err;
    }
    const db = mongodb.getDB();

    router.get('/getCustomerFromInvoice', function(req, res, next) {
        db.collection('Workorder').find({}).project({ Customer: 1, _id: 0 }).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            res.send(data);
            res.end();
        });
    });

    router.get('/getAccountLedger/:toDate/:fromDate/:customer', function(req, res, next) {

        var customer = req.params.customer;

        if (customer == "null") {
            var ledgerData = [];

            var toDate = new Date(new Date(req.params.toDate).setHours(00, 00, 00)).toISOString();
            var fromDate = new Date(new Date(req.params.fromDate).setHours(23, 59, 59, 999)).toISOString();

            let sumOfDebit = [
                { $match: { Flag: "Quantity In", Date: { "$lt": toDate } } },
                { $group: { _id: "$Flag", amount: { $sum: "$Amount" } } }
            ];

            let sumOfCredit = [
                { $match: { Flag: "Quantity Out", Date: { "$lt": toDate } } },
                { $group: { _id: "$Flag", amount: { $sum: "$Amount" } } }
            ];

            db.collection("CustomerLedger").aggregate(sumOfDebit, { cursor: {} }, null).toArray(function(err, sum) {
                if (err) {
                    throw err;
                }
                ledgerData.push(sum);

                db.collection("CustomerLedger").aggregate(sumOfCredit, { cursor: {} }, null).toArray(function(err, sum) {
                    if (err) {
                        throw err;
                    }
                    ledgerData.push(sum);

                    db.collection('CustomerLedger').find({ Date: { "$gte": toDate, "$lte": fromDate } }).toArray(function(err, data) {
                        if (err) {
                            throw err;
                        }
                        ledgerData.push(data);
                        res.send(ledgerData);
                        res.end();
                    });
                });
            });
        } else {
            var ledgerData = [];

            var toDate = new Date(new Date(req.params.toDate).setHours(00, 00, 00)).toISOString();
            var fromDate = new Date(new Date(req.params.fromDate).setHours(23, 59, 59, 999)).toISOString();

            let sumOfDebit = [
                { $match: { Flag: "Quantity In", Customer: customer, Date: { "$lt": toDate } } },
                { $group: { _id: "$Flag", amount: { $sum: "$Amount" } } }
            ];

            let sumOfCredit = [
                { $match: { Flag: "Quantity Out", Customer: customer, Date: { "$lt": toDate } } },
                { $group: { _id: "$Flag", amount: { $sum: "$Amount" } } }
            ];

            db.collection("CustomerLedger").aggregate(sumOfDebit, { cursor: {} }, null).toArray(function(err, sum) {
                if (err) {
                    throw err;
                }
                ledgerData.push(sum);
                db.collection("CustomerLedger").aggregate(sumOfCredit, { cursor: {} }, null).toArray(function(err, sum) {
                    if (err) {
                        throw err;
                    }
                    ledgerData.push(sum);
                    db.collection('CustomerLedger').find({ Customer: customer, Date: { "$gte": toDate, "$lte": fromDate } }).toArray(function(err, data) {
                        if (err) {
                            throw err;
                        }
                        ledgerData.push(data);
                        res.send(ledgerData);
                        res.end();
                    });
                });
            });

        }

    });

});

module.exports = router;