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

    router.get('/getAllExpense', function(req, res, next) {
        db.collection('ExpenseType').find({}).toArray(function(err, data) {
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
        var expense = req.body.Expense;

        db.collection('ExpenseType').find({ Expense: expense }).toArray(function(err, data) {
            if (err) {
                throw err;
            }

            if (data && data.length > 0) {
                return res.status(400).send({
                    message: "Expense already inputted"
                });

            } else {
                req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');
                db.collection('ExpenseType').insertOne(req.body, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }
                    const response = JSON.stringify({ data: req.body, status: 200 });
                    res.send(response);
                    res.end();

                });
            }

        });
    });

    router.post('/update/:_id', function(req, res, next) {
        objectId = new ObjectId(req.params._id);
        delete req.body._id;
        req.body.CreatedDate = DateFormat(req.body.CreatedDate);
        if (req.body.ModifiedDate) {
            req.body.ModifiedDate = DateFormat(req.body.ModifiedDate);
        } else {
            req.body.ModifiedDate = dateFormat(new Date(), 'isoDateTime');
        }
        db.collection('ExpenseType').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
            if (err) {
                throw err;
            }

            const response = JSON.stringify({ data: req.body, status: 200 });
            res.send(response);
            res.end();
        });
    });

    router.post('/delete/:_id', function(req, res, next) {
        objectId = new ObjectId(req.params._id);
        db.collection('ExpenseType').deleteOne({ _id: objectId }, function(err, doc) {
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