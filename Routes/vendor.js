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

    router.get('/getAllVendor', function(req, res, next) {
        db.collection('IMS_VENDOR').find({}).toArray(function(err, data) {
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
        var CompanyName = req.body.CompanyName;
        db.collection('IMS_VENDOR').find({ Name: Name }).toArray(function(err, data) {
            if (err) {
                throw err;
            }

            if (data.length > 0) {
                res.status(403).json({ message: "Vendor Name already registered" });
                res.end();
            } else {
                db.collection('IMS_VENDOR').insertOne(req.body, {}, function(err, doc) {
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
        db.collection('IMS_VENDOR').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
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
        db.collection('IMS_VENDOR').deleteOne({ _id: objectId }, function(err, doc) {
            if (err) {
                throw err;
            }
            const repsone = JSON.stringify({ data: req.body, status: 200 });
            res.send(repsone);
            res.end();
        });
    });

});



module.exports = router;