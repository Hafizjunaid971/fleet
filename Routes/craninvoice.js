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

    router.get('/getAllCranInvoice', function(req, res, next) {
        db.collection('CranExpenseInvoice').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            data.forEach(element => {
                element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                element.Date = dateFormat(element.Date, 'dd/mm/yyyy');
                if (element.ModifiedDate)
                    element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
            });
            res.send(data);
            res.end();
        });
    });

    router.get('/getCranExpenseList/:id', function(req, res, next) {
        objectId = req.params.id;
        db.collection('CranExpenseInvoice').find({ "CranExpenseType._id": objectId }).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            data.forEach(element => {
                element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                element.Date = dateFormat(element.Date, 'dd/mm/yyyy');
                if (element.ModifiedDate)
                    element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
            });
            res.send(data);
            res.end();
        });
    });

    router.post('/add', function(req, res, next) {
        req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');
        req.body.Date = DateFormat(req.body.Date);
        req.body.Total = parseFloat(req.body.Total);
        db.collection('CranExpenseInvoice').insertOne(req.body, {}, function(err, doc) {
            if (err) {
                throw err;
            }

            db.collection("CranCashManagement").aggregate([{

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

                var obj = {
                    Date: req.body.Date,
                    CreditAmount: 0,
                    DebitAmount: req.body.Total,
                    Balance: CreditAmount - (DebitAmount + req.body.Total),
                    Type: "Expense",
                    VoucherNo: req.body.InvoiceNumber,
                    Amount: req.body.Total,
                    Remarks: "Cran Expense Invoice Added",
                    CreatedBy: req.body.CreatedBy,
                    CreatedDate: req.body.CreatedDate
                }

                db.collection('CranCashManagement').insertOne(obj, {}, function(err, doc) {
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

    router.post('/update/:id', function(req, res, next) {
        objectId = new ObjectId(req.params.id);
        delete req.body._id;
        req.body.CreatedDate = DateFormat(req.body.CreatedDate);
        if (req.body.ModifiedDate) {
            req.body.ModifiedDate = DateFormat(req.body.ModifiedDate);
        } else {
            req.body.ModifiedDate = dateFormat(new Date(), 'isoDateTime');
        }
        db.collection('CranExpenseInvoice').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
            if (err) {
                throw err;
            }
            const response = JSON.stringify({ data: req.body, status: 200 });

            res.send(response);
            res.end();
        });
    });

    router.post('/delete/:id', function(req, res, next) {
        objectId = new ObjectId(req.params.id);
        db.collection('CranExpenseInvoice').deleteOne({ _id: objectId }, function(err, doc) {
            if (err) {
                throw err;
            }
            const response = JSON.stringify({ data: req.body, status: 200 });
            res.send(response);
            res.end();
        });
    });

    function DateFormat(date) {
        var x = date.split('/');
        var date = x[1] + '/' + x[0] + '/' + x[2];
        date = dateFormat(date, 'isoDateTime');
        return date;
    }

});

module.exports = router;