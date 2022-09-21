const express = require("express");
const router = express.Router({ mergeParams: true });
const mongodb = require("../Utilities/mongodb")
var ObjectId = require('mongodb').ObjectID;
var dateFormat = require('dateformat');
const MD5 = require('md5');

mongodb.connectDB(async err => {
    if (err) {
        logger.setErrorLog(err);
        throw err;
    }
    const db = mongodb.getDB();

    router.get('/getAll', function(req, res, next) {
        db.collection('CashManagement').find({}).toArray(function(err, data) {
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

    router.get('/getFilteredRecord/:toDate/:fromDate', function(req, res, next) {

        var toDate = new Date(new Date(req.params.toDate).setHours(00, 00, 00)).toISOString();
        var fromDate = new Date(new Date(req.params.fromDate).setHours(23, 59, 59, 999)).toISOString();

        db.collection('CashManagement').find({
            Date: {
                $gte: toDate,
                $lt: fromDate
            }
        }).toArray(function(err, data) {
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

            var obj = {
                Date: req.body.Date,
                CreditAmount: parseFloat(req.body.Amount),
                DebitAmount: 0,
                Balance: (CreditAmount + parseFloat(req.body.Amount)) - DebitAmount,
                Type: req.body.Type,
                ReceivedBy: req.body.ReceivedBy,
                SubmittedBy: req.body.SubmittedBy,
                VoucherNo: req.body.VoucherNo,
                Amount: req.body.Amount,
                Remarks: req.body.Remarks,
                CreatedBy: req.body.CreatedBy,
                CreatedDate: req.body.CreatedDate
            }

            db.collection('CashManagement').insertOne(obj, {}, function(err, doc) {
                if (err) {
                    throw err;
                }
                const response = JSON.stringify({ data: req.body, status: 200 });
                res.send(response);
                res.end();
            });

        });

        // db.collection('CashManagement').insertOne(req.body, {}, function(err, doc) {
        //     if (err) {
        //         throw err;
        //     }
        //     const repsone = JSON.stringify({ data: req.body, status: 200 });
        //     res.send(repsone);
        //     res.end();
        // });
    });

    function DateFormat(date) {
        var x = date.split('/');
        var date = x[1] + '/' + x[0] + '/' + x[2];
        date = dateFormat(date, 'isoDateTime');
        return date;
    }

});

module.exports = router;