const express = require("express");
const router = express.Router({ mergeParams: true });
const mongodb = require("../Utilities/mongodb")
var ObjectId = require('mongodb').ObjectID;
var dateFormat = require('dateformat');

mongodb.connectDB(async err => {
    if (err) {
        logger.setErrorLog(err);
        throw err;
    }
    const db = mongodb.getDB();

    router.get('/getAllTransportPayment', function(req, res, next) {
        db.collection('TransportPayment').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            data.forEach(element => {
                element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                if (element.ModifiedDate)
                    element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
            });
            res.send(data);
            res.end();
        });
    });

    router.post('/add', function(req, res, next) {
        req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');
        req.body.PaymentDate = DateFormat(req.body.PaymentDate);

        req.body.TransportPaymentDetails.forEach(element => {
            element.Transporter = element.Transporter.Name;
            element.VehicleNo = element.VehicleNo.VehicleRegNo;
        });

        db.collection('TransportPayment').insertOne(req.body, {}, function(err, doc) {
            if (err) {
                throw err;
            }

            var ledgerList = [];
            var cashMList = [];

            req.body.TransportPaymentDetails.forEach(element => {
                var obj = {
                    PaymentNo: req.body.PaymentNo,
                    Date: req.body.PaymentDate,
                    Transporter: element.Transporter,
                    VehicleNo: element.VehicleNo,
                    Particulars: element.Particulars,
                    Amount: parseFloat(element.Amount),
                    Flag: element.PaymentType == 'Sent' ? 'Quantity Out' : 'Quantity In',
                }
                ledgerList.push(obj)
            });


            db.collection('TransporterLedger').insertMany(ledgerList, {}, function(err, doc) {
                if (err) {
                    throw err;
                }

                db.collection("CashManagement").aggregate([{

                    $group: {
                        _id: 1,
                        CreditAmount: { $sum: "$CreditAmount" },
                        DebitAmount: { $sum: "$DebitAmount" }
                    }


                }], { cursor: {} }, null).toArray(function(err, sum) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }

                    var CreditAmount = 0;
                    var DebitAmount = 0;

                    if (sum.length > 0) {
                        CreditAmount = sum[0].CreditAmount;
                        DebitAmount = sum[0].DebitAmount;
                    }

                    req.body.TransportPaymentDetails.forEach(element => {
                        if (element.PaymentType === "Sent") {
                            var obj = {
                                Date: req.body.PaymentDate,
                                CreditAmount: 0,
                                DebitAmount: parseFloat(element.Amount),
                                Balance: CreditAmount - (DebitAmount + parseFloat(element.Amount)),
                                Type: "Transporter Payment Sent",
                                VoucherNo: element.PaymentNo,
                                Amount: parseFloat(element.Amount),
                                Remarks: "Transporter Payment Sent",
                                CreatedBy: req.body.CreatedBy,
                                CreatedDate: req.body.CreatedDate
                            }
                            DebitAmount += obj.DebitAmount;
                            CreditAmount += obj.CreditAmount;
                            if (DebitAmount < 0)
                                DebitAmount *= -1;
                            if (CreditAmount < 0)
                                CreditAmount *= -1;
                        } else {
                            var obj = {
                                Date: req.body.PaymentDate,
                                CreditAmount: parseFloat(element.Amount),
                                DebitAmount: 0,
                                Balance: (CreditAmount + parseFloat(element.Amount)) - DebitAmount,
                                Type: "Transporter Payment Received",
                                VoucherNo: element.PaymentNo,
                                Amount: parseFloat(element.Amount),
                                Remarks: "Transporter Payment Received",
                                CreatedBy: req.body.CreatedBy,
                                CreatedDate: req.body.CreatedDate
                            }
                            DebitAmount += obj.DebitAmount;
                            CreditAmount += obj.CreditAmount;
                            if (DebitAmount < 0)
                                DebitAmount *= -1;
                            if (CreditAmount < 0)
                                CreditAmount *= -1;
                        }
                        cashMList.push(obj);
                    });

                    db.collection('CashManagement').insertMany(cashMList, {}, function(err, doc) {
                        if (err) {
                            throw err;
                        }
                        const response = JSON.stringify({ data: req.body, status: 200 });
                        res.send(response);
                        res.end();
                    });

                });

            });
        });
    });

    router.get('/getTransporter', function(req, res, next) {
        db.collection('TransporterLedger').find({}).project({ Transporter: 1, _id: 0 }).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            res.send(data);
            res.end();
        });
    });

    router.get('/getTransporterLedger/:toDate/:fromDate/:transporter', function(req, res, next) {

        var transporter = req.params.transporter;

        if (transporter == "null") {
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

            db.collection("TransporterLedger").aggregate(sumOfDebit, { cursor: {} }, null).toArray(function(err, sum) {
                if (err) {
                    throw err;
                }
                ledgerData.push(sum);

                db.collection("TransporterLedger").aggregate(sumOfCredit, { cursor: {} }, null).toArray(function(err, sum) {
                    if (err) {
                        throw err;
                    }
                    ledgerData.push(sum);

                    db.collection('TransporterLedger').find({ Date: { "$gte": toDate, "$lte": fromDate } }).toArray(function(err, data) {
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
                { $match: { Flag: "Quantity In", Transporter: transporter, Date: { "$lt": toDate } } },
                { $group: { _id: "$Flag", amount: { $sum: "$Amount" } } }
            ];

            let sumOfCredit = [
                { $match: { Flag: "Quantity Out", Transporter: transporter, Date: { "$lt": toDate } } },
                { $group: { _id: "$Flag", amount: { $sum: "$Amount" } } }
            ];

            db.collection("TransporterLedger").aggregate(sumOfDebit, { cursor: {} }, null).toArray(function(err, sum) {
                if (err) {
                    throw err;
                }
                ledgerData.push(sum);
                db.collection("TransporterLedger").aggregate(sumOfCredit, { cursor: {} }, null).toArray(function(err, sum) {
                    if (err) {
                        throw err;
                    }
                    ledgerData.push(sum);
                    db.collection('TransporterLedger').find({ Transporter: transporter, Date: { "$gte": toDate, "$lte": fromDate } }).toArray(function(err, data) {
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

    function DateFormat(date) {
        var x = date.split('/');
        var date = x[1] + '/' + x[0] + '/' + x[2];
        date = dateFormat(date, 'isoDateTime');
        return date;
    }

});



module.exports = router;