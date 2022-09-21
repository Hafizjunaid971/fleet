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

    router.get('/getAllVehicle', function(req, res, next) {
        db.collection('Vehicle').find({}).toArray(function(err, data) {
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
        var VehicleRegNo = req.body.VehicleRegNo;
        db.collection('Vehicle').find({ VehicleRegNo: VehicleRegNo }).toArray(function(err, data) {
            if (err) {
                throw err;
            }

            if (data.length > 0) {
                res.status(403).json({ message: "Vehicle Registration No. already registered" });
                res.end();
            } else {
                req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');
                db.collection('Vehicle').insertOne(req.body, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }
                    const repsone = JSON.stringify({ data: req.body, status: 200 });
                    res.send(repsone);
                    res.end();
                });
            }
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
        db.collection('Vehicle').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
            if (err) {
                throw err;
            }
            const repsone = JSON.stringify({ data: req.body, status: 200 });

            res.send(repsone);
            res.end();
        });
    });

    router.post('/delete/:id', function(req, res, next) {
        objectId = new ObjectId(req.params.id);
        db.collection('Vehicle').deleteOne({ _id: objectId }, function(err, doc) {
            if (err) {
                throw err;
            }
            const repsone = JSON.stringify({ data: req.body, status: 200 });
            res.send(repsone);
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