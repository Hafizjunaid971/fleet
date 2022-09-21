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

    router.get('/getUniqueNumber/:sequenceName', function(req, res, next) {
        sequenceName = req.params.sequenceName;
        var sequence_value = 1;

        db.collection('counters').find({ _id: sequenceName }).toArray((err, doc) => {
            if (doc && doc.length) {
                sequence_value = doc[0].sequence_value + 1;
                db.collection('counters').updateOne({ _id: sequenceName }, { $set: { sequence_value: sequence_value } }, {}, function(err, counter) {
                    if (err) {
                        console.log(err);
                    }

                    const response = JSON.stringify({ data: sequence_value, status: 200 });
                    res.send(response);
                    res.end();
                });

            } else {

                var obj = {
                    _id: sequenceName,
                    sequence_value: sequence_value
                }

                db.collection('counters').insertOne(obj, {}, function(err, counter) {
                    if (err) {
                        console.log(err);
                    }
                    const response = JSON.stringify({ data: sequence_value, status: 200 });
                    res.send(response);
                    res.end();
                });
            }
        });

    });

    router.get('/getAllCustomer', function(req, res, next) {
        db.collection('customersetup').find({}).toArray(function(err, data) {
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
        var Name = req.body.Name;
        db.collection('customersetup').find({ Name: Name }).toArray(function(err, data) {
            if (err) {
                throw err;
            }

            if (data.length > 0) {
                res.status(403).json({ message: "Customer already registered" });
                res.end();
            } else {
                req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');
                db.collection('customersetup').insertOne(req.body, {}, function(err, doc) {
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

    router.post('/update/:id', function(req, res, next) {
        objectId = new ObjectId(req.params.id);
        req.body.CreatedDate = DateFormat(req.body.CreatedDate);
        if (req.body.ModifiedDate) {
            req.body.ModifiedDate = DateFormat(req.body.ModifiedDate);
        } else {
            req.body.ModifiedDate = dateFormat(new Date(), 'isoDateTime');
        }
        delete req.body._id;
        db.collection('customersetup').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
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
        
        db.collection('customersetup').deleteOne({ _id: objectId }, function(err, doc) {
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