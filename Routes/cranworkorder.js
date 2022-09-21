const express = require("express");
const router = express.Router({ mergeParams: true });
const mongodb = require("../Utilities/mongodb")
var ObjectId = require('mongodb').ObjectID;
var dateFormat = require('dateformat');
var fd = require('../Routes/workordersummary');

mongodb.connectDB(async err => {
    if (err) {
        logger.setErrorLog(err);
        throw err;                 
    }
    const db = mongodb.getDB();

    router.get('/getUniqueNumber/:sequenceName', function(req, res, next) {
        sequenceName = req.params.sequenceName;
        date = dateFormat(new Date(), 'yyyy-mm-dd') + 'T00:00:00.000Z';
        var sequence_value = 1;

        db.collection('counters').find({ _id: sequenceName, date: date }).toArray((err, doc) => {
            if (doc && doc.length) {
                sequence_value = doc[0].sequence_value + 1;
                db.collection('counters').updateOne({ _id: sequenceName }, { $set: { sequence_value: sequence_value, date: date } }, {}, function(err, counter) {
                    if (err) {
                        console.log(err);
                    }

                    sequence_value = dateFormat(date, 'ddmmyyyy') + '-' + sequence_value;
                    const response = JSON.stringify({ data: sequence_value, status: 200 });
                    res.send(response);
                    res.end();
                });

            } else {

                db.collection('counters').deleteOne({ _id: sequenceName }, {}, function(err, counter) {
                    if (err) {
                        console.log(err);
                    }

                    var obj = {
                        _id: sequenceName,
                        sequence_value: sequence_value,
                        date: date
                    }

                    db.collection('counters').insertOne(obj, {}, function(err, counter) {
                        if (err) {
                            console.log(err);
                        }
                        sequence_value = dateFormat(date, 'ddmmyyyy') + '-' + sequence_value;
                        const response = JSON.stringify({ data: sequence_value, status: 200 });
                        res.send(response);
                        res.end();
                    });
                });

            }
        });

    });


// mene kia ha coomments ku need nhe is ki


    router.get('/ValidateWO/:WorkOrderNo/:Type', function(req, res, next) {

        WorkOrderNo = req.params.WorkOrderNo;
        Type = req.params.Type;

        if (Type === "WO") {
            db.collection('CranWorkOrderInvoice').find({ "WorkOrderList.WorkOrderNo": WorkOrderNo }).toArray(function(err, data) {
                if (data.length > 0) {
                    res.status(403).json({ message: "Work Order Invoice is created" });
                    res.end();
                } else {
                    db.collection('CranJob').find({ WorkOrderNo: WorkOrderNo }).toArray(function(err, data) {
                        if (data.length > 0) {
                            res.status(403).json({ message: "Work Order is Assigned" });
                            res.end();
                        } else {
                            res.send(data);
                            res.end();
                        }
                    });
                }
            });
        } else {
            db.collection('CranWorkOrderInvoice').find({ "WorkOrderList.WorkOrderNo": WorkOrderNo }).toArray(function(err, data) {
                if (data.length > 0) {
                    res.status(403).json({ message: "Work Order Invoice is created" });
                    res.end();
                } else {
                    res.send(data);
                    res.end();
                }
            });
        }
    });

// mene kia ha coomments ku need nhe is ki
 
// router.get('/ValidateWOCharges/:WorkOrderNo', function(req, res, next) {

    //     WorkOrderNo = req.params.WorkOrderNo;
    //     db.collection('Charges').find({ WorkOrderNo: WorkOrderNo }).toArray(function(err, data) {
    //         if (data.length > 0) {
    //             res.send(data);
    //             res.end();
    //         }
    //     });
    // });

    router.get('/getAllCranWorkorder', function(req, res, next) {
        db.collection('CranWorkorder').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            data.forEach(element => {
                element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                element.WorkOrderDate = dateFormat(element.WorkOrderDate, 'dd/mm/yyyy');
                if (element.ModifiedDate)
                    element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
            });
            res.send(data);
            res.end();
        });
    });

    router.post('/add', async(req, res, next) => {
        req.body.WorkOrderDate = DateFormat(req.body.WorkOrderDate);
        req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');
        req.body.Paid = parseFloat(req.body.Paid);
        db.collection('CranWorkorder').insertOne(req.body, {}, function(eSrr, doc) {
            if (err) {
                throw err;
            }
            var list = [];
            var obj = {
                CranInvoiceNumber: req.body.CranWorkOrderNo,
                Date: req.body.CreatedDate,
                Customer: req.body.Customer.Name,
                Particulars: req.body.Particulars,
                Amount: req.body.Payable,
                Type: "Workorder",
                Flag: 'Quantity In',
            }
            list.push(obj);

            if (req.body.Paid > 0) {
                var obj = {
                    CranInvoiceNumber: null,
                    Date: req.body.CreatedDate,
                    Customer: req.body.Customer.Name,
                    Particulars: "Customer Payment against WO: " + req.body.CranWorkOrderNo,
                    Amount: req.body.Paid,
                    Type: "Workorder",
                    Flag: 'Quantity Out',
                }
                list.push(obj);
            }

            db.collection('CustomerLedger').insertMany(list, {}, function(err, doc) {
                if (err) {
                    throw err;
                }

                const response = JSON.stringify({ data: req.body, status: 200 });
                res.send(response);
                res.end();
            });
        });

    });

    router.post('/update/:id', function(req, res, next) {
        objectId = new ObjectId(req.params.id);
        req.body.WorkOrderDate = DateFormat(req.body.WorkOrderDate);
        req.body.CreatedDate = DateFormat(req.body.CreatedDate);
        req.body.CreatedDate = dateFormat(req.body.CreatedDate, 'isoDateTime');
        if (req.body.ModifiedDate) {
            req.body.ModifiedDate = DateFormat(req.body.ModifiedDate);
        } else {
            req.body.ModifiedDate = dateFormat(new Date(), 'isoDateTime');
        }

        req.body.Paid = parseFloat(req.body.Paid);
        delete req.body._id;

        db.collection('CranWorkorder').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
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
        db.collection('CranWorkorder').deleteOne({ _id: objectId }, function(err, doc) {
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