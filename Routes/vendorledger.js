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

    router.get('/getAllVendor', function(req, res, next) {
        db.collection('IMS_VENDOR').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            res.send(data);
            res.end();
        });
    });

    router.get('/getVendorFromVendorLedger', function(req, res, next) {
        db.collection('IMS_VENDORLEDGER').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            res.send(data);
            res.end();
        });
    });

    router.post('/add', function(req, res, next) {
        req.body.Vendor = req.body.Vendor.CompanyName;
        req.body.Amount = parseFloat(req.body.Amount);
        db.collection('IMS_VENDORLEDGER').insertOne(req.body, {}, function(err, doc) {
            if (err) {
                throw err;
            }
            const repsone = JSON.stringify({ data: req.body, status: 200 });
            res.send(repsone);
            res.end();
        });
    });

    router.get('/getVendorLedger/:toDate/:fromDate/:vendor', function(req, res, next) {

        var vendor = req.params.vendor;
        var ledgerData = [];

        var toDate = req.params.toDate + 'T00:00:00.000Z'
        var fromDate = req.params.fromDate + 'T00:00:00.000Z';

        if (vendor == "null") {

            let sumOfDebit = [
                { $match: { DebitCredit: "Debit", Date: { "$lt": toDate } } },
                { $group: { _id: "$DebitCredit", amount: { $sum: "$Amount" } } }
            ];

            let sumOfCredit = [
                { $match: { DebitCredit: "Credit", Date: { "$lt": toDate } } },
                { $group: { _id: "$DebitCredit", amount: { $sum: "$Amount" } } }
            ];

            db.collection("IMS_VENDORLEDGER").aggregate(sumOfDebit, { cursor: {} }, null).toArray(function(err, sum) {
                if (err) {
                    throw err;
                }
                ledgerData.push(sum);

                db.collection("IMS_VENDORLEDGER").aggregate(sumOfCredit, { cursor: {} }, null).toArray(function(err, sum) {
                    if (err) {
                        throw err;
                    }
                    ledgerData.push(sum);

                    db.collection('IMS_VENDORLEDGER').find({ Date: { "$gte": toDate, "$lte": fromDate } }).toArray(function(err, data) {
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

            let sumOfDebit = [
                { $match: { DebitCredit: "Debit", Vendor: vendor, Date: { "$lt": toDate } } },
                { $group: { _id: "$DebitCredit", amount: { $sum: "$Amount" } } }
            ];

            let sumOfCredit = [
                { $match: { DebitCredit: "Credit", Vendor: vendor, Date: { "$lt": toDate } } },
                { $group: { _id: "$DebitCredit", amount: { $sum: "$Amount" } } }
            ];

            db.collection("IMS_VENDORLEDGER").aggregate(sumOfDebit, { cursor: {} }, null).toArray(function(err, sum) {
                if (err) {
                    throw err;
                }
                ledgerData.push(sum);
                db.collection("IMS_VENDORLEDGER").aggregate(sumOfCredit, { cursor: {} }, null).toArray(function(err, sum) {
                    if (err) {
                        throw err;
                    }
                    ledgerData.push(sum);
                    db.collection('IMS_VENDORLEDGER').find({ Vendor: vendor, Date: { "$gte": toDate, "$lte": fromDate } }).toArray(function(err, data) {
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