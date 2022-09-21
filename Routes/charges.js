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

    router.get('/getAllCharges', function(req, res, next) {
        db.collection('Charges').aggregate([{
                $project: {
                    AssignJob: 1,
                    WorkOrderNo: 1,
                    Customer: 1,
                    Particulars: 1,
                    ChargesDetail: 1,
                    ChargesTotal: 1,
                    ChargeNo: 1,
                    ChargesDate: 1,
                    CreatedBy: 1,
                    CreatedDate: 1,
                    ModifiedBy: 1,
                    ModifiedDate: 1
                }
            },
            {
                $lookup: {
                    from: 'AssignJob',
                    localField: 'WorkOrderNo',
                    foreignField: 'WorkOrderNo',
                    as: 'AssignJob'
                }
            }
        ]).toArray(function(err, data) {
            if (err) {
                throw err;
            }

            if (data.length > 0) {
                data.forEach(element => {
                    element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                    element.WorkOrderDate = dateFormat(element.WorkOrderDate, 'dd/mm/yyyy');
                    element.ChargesDate = dateFormat(element.ChargesDate, 'dd/mm/yyyy');
                    if (element.ModifiedDate)
                        element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
                });

                data[0].AssignJob.forEach(element => {
                    element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                    element.JobAssignDate = dateFormat(element.JobAssignDate, 'dd/mm/yyyy');
                    if (element.ModifiedDate)
                        element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');

                    element.AssignmentDetails.forEach(element => {
                        if (element.AssignmentDate)
                            element.AssignmentDate = dateFormat(element.AssignmentDate, 'dd/mm/yyyy');
                    });
                });
            }

            res.send(data);
            res.end();
        });
    });

    router.get('/getAllWorkorder', function(req, res, next) {
        db.collection('Workorder').find({ ChargesDefined: false, JobDefined: true }).toArray(function(err, data) {
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

    router.get('/getWorkOrder/:WorkOrderNo', function(req, res, next) {
        WorkOrderNo = req.params.WorkOrderNo;
        db.collection('Charges').find({ WorkOrderNo: WorkOrderNo }).toArray(function(err, data) {
            if (data.length > 0) {
                res.status(403).json({ message: "Selected Work Order Charges already defined" });
                res.end();
            } else {
                db.collection('AssignJob').find({ WorkOrderNo: req.params.WorkOrderNo }).toArray(function(err, data) {
                    if (err) {
                        throw err;
                    }
                    if (data.length > 0) {
                        data.forEach(element => {
                            element.JobAssignDate = dateFormat(element.JobAssignDate, 'dd/mm/yyyy');
                            element.AssignmentDetails.forEach(element => {
                                if (element.AssignmentDate) {
                                    element.AssignmentDate = dateFormat(element.AssignmentDate, 'dd/mm/yyyy');
                                }
                            });
                        });
                        res.send(data);
                        res.end();
                    } else {
                        res.status(403).json({ message: "Selected Work Order Job is not assigned." });
                        res.end();
                    }
                });
            }
        });

    });

    router.post('/add', function(req, res, next) {
        delete req.body.AssignJob;
        req.body.ChargesDate = DateFormat(req.body.ChargesDate);
        req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');

        req.body.WorkOrderNo = req.body.WorkOrderNo.WorkOrderNo;

        db.collection('Charges').insertOne(req.body, {}, function(err, doc) {
            if (err) {
                throw err;
            }
            var myquery = { "WorkOrderNo": req.body.WorkOrderNo };
            var newvalues = { $set: { ChargesDefined: true } };
            db.collection('Workorder').updateOne(myquery, newvalues, {}, function(err, doc) {
                if (err) {
                    throw err;
                }

                var obj = {
                    InvoiceNumber: null,
                    Date: req.body.CreatedDate,
                    Customer: req.body.Customer.Name,
                    Particulars: req.body.Particulars,
                    Amount: req.body.ChargesTotal,
                    Type: "Charges",
                    Flag: 'Quantity In',
                }

                db.collection('CustomerLedger').insertOne(obj, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }

                    const repsone = JSON.stringify({ data: req.body, status: 200 });

                    res.send(repsone);
                    res.end();
                });
            });
        });
    });

    router.post('/update/:id', function(req, res, next) {
        objectId = new ObjectId(req.params.id);

        req.body.ChargesDate = DateFormat(req.body.ChargesDate);
        req.body.CreatedDate = DateFormat(req.body.CreatedDate);
        req.body.CreatedDate = dateFormat(req.body.CreatedDate, 'isoDateTime');
        if (req.body.ModifiedDate) {
            req.body.ModifiedDate = DateFormat(req.body.ModifiedDate);
        } else {
            req.body.ModifiedDate = dateFormat(new Date(), 'isoDateTime');
        }

        delete req.body._id;
        req.body.WorkOrderNo = req.body.WorkOrderNo;
        db.collection('Charges').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
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
        db.collection('Charges').deleteOne({ _id: objectId }, function(err, doc) {
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