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

    router.get('/getAllCranJob', function(req, res, next) {
        db.collection('CranJob').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            data.forEach(element => {
                element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                element.JobAssignDate = dateFormat(element.JobAssignDate, 'dd/mm/yyyy');
                if (element.ModifiedDate)
                    element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');

                element.AssignmentDetails.forEach(element => {
                    if (element.AssignmentDate)
                        element.AssignmentDate = dateFormat(element.AssignmentDate, 'dd/mm/yyyy');
                });
            });
            res.send(data);
            res.end();
        });
    });

    router.get('/getAllCranWorkorder', function(req, res, next) {

        db.collection('CranWorkorder').find({ JobDefined: false }).toArray(function(err, data) {
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

    router.get('/getCranWorkorder/:WorkOrderNo', function(req, res, next) {
        WorkOrderNo = req.params.WorkOrderNo;

        db.collection('CranJob').find({ WorkOrderNo: WorkOrderNo }).toArray(function(err, data) {
            if (data.length > 0) {
                res.status(403).json({ message: "Selected Work Order is Assigned already" });
                res.end();
            } else {
                db.collection('CranWorkorder').find({ WorkOrderNo: WorkOrderNo }).toArray(function(err, data) {
                    if (err) {
                        throw err;
                    }
                    data.forEach(element => {
                        element.WorkOrderDate = dateFormat(element.WorkOrderDate, 'dd/mm/yyyy');
                    });
                    res.send(data);
                    res.end();
                });
            }
        });
    });

    function CheckAssignmentDetails(array) {
        var x = true;
        array.forEach(element => {
            if (!element.ContainerNo) {
                x = false;
            }
        });
        return x;
    }

    function SetAssignedTrue(array) {
        array.forEach(element => {
            if (element.ContainerNo) {
                element.IsAssigned = true;
            }
            if (element.AssignmentDate) {
                element.AssignmentDate = DateFormat(element.AssignmentDate);
            }

            if (element.VehicleNo)
                if (element.VehicleNo.VehicleRegNo)
                    element.VehicleNo = element.VehicleNo.VehicleRegNo;
                else
                    element.VehicleNo = element.VehicleNo;
        });
    }

    router.post('/add', async(req, res, next) => {

        req.body.WorkOrderNo = req.body.WorkOrderNo.WorkOrderNo;
        req.body.JobAssignDate = DateFormat(req.body.JobAssignDate);
        req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');
        SetAssignedTrue(req.body.AssignmentDetails);

        req.body.AssignmentDetails.forEach(element => {
            element.HistoryMaintained = false;
        });

        var xAssignList = [];
        req.body.AssignmentDetails.forEach((element, i) => {
            if (element.IsAssigned && !element.HistoryMaintained) {
                var dto = {
                    WorkOrderNo: req.body.WorkOrderNo,
                    VehicleNo: element.VehicleNo,
                    VehicleAccount: element.VehicleAccount,
                    LotType: element.LotType,
                    FareAmount: element.FarePerTruck,
                    AssignmentDate: element.AssignmentDate
                };
                element.HistoryMaintained = true;
                xAssignList.push(dto);
            }
        });

        var xResult = CheckAssignmentDetails(req.body.AssignmentDetails);

        db.collection('CranJob').insertOne(req.body, {}, function(err, doc) {
            if (err) {
                throw err;
            }

            if (xResult) {

                var myquery = { "WorkOrderNo": req.body.WorkOrderNo };
                var newvalues = { $set: { JobDefined: true } };

                db.collection('CranWorkorder').updateOne(myquery, newvalues, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }

                    db.collection('CranAssignmentHistory').insertMany(xAssignList, {}, function(err, doc) {
                        if (err) {
                            throw err;
                        }
                        const response = JSON.stringify({ data: doc, status: 200 });
                        res.send(response);
                        res.end();
                    });
                });
            } else {
                db.collection('CranAssignmentHistory').insertMany(xAssignList, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }
                    const response = JSON.stringify({ data: doc, status: 200 });
                    res.send(response);
                    res.end();
                });
            }

        });
    });

    router.post('/update/:id', function(req, res, next) {
        delete req.body._id;
        objectId = new ObjectId(req.params.id);
        req.body.Customer = req.body.Customer;
        req.body.WorkOrderNo = req.body.WorkOrderNo;
        req.body.JobAssignDate = DateFormat(req.body.JobAssignDate);
        req.body.CreatedDate = DateFormat(req.body.CreatedDate);
        req.body.CreatedDate = dateFormat(req.body.CreatedDate, 'isoDateTime');
        if (req.body.ModifiedDate) {
            req.body.ModifiedDate = DateFormat(req.body.ModifiedDate);
        } else {
            req.body.ModifiedDate = dateFormat(new Date(), 'isoDateTime');
        }

        SetAssignedTrue(req.body.AssignmentDetails);

        var xResult = CheckAssignmentDetails(req.body.AssignmentDetails);

        var xAssignList = [];
        req.body.AssignmentDetails.forEach((element, i) => {
            if (element.IsAssigned && !element.HistoryMaintained) {
                var dto = {
                    WorkOrderNo: req.body.WorkOrderNo,
                    VehicleNo: element.VehicleNo,
                    VehicleAccount: element.VehicleAccount,
                    LotType: element.LotType,
                    FareAmount: element.FarePerTruck,
                    AssignmentDate: element.AssignmentDate
                };
                element.HistoryMaintained = true;
                xAssignList.push(dto);
            }
        });

        db.collection('CranJob').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
            if (err) {
                throw err;
            }
            if (xResult) {

                var myquery = { "WorkOrderNo": req.body.WorkOrderNo };
                var newvalues = { $set: { JobDefined: true } };

                db.collection('CranWorkorder').updateOne(myquery, newvalues, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }

                    if (xAssignList.length > 0) {
                        db.collection('CranAssignmentHistory').insertMany(xAssignList, {}, function(err, doc) {
                            if (err) {
                                throw err;
                            }
                            const response = JSON.stringify({ data: doc, status: 200 });
                            res.send(response);
                            res.end();
                        });
                    } else {
                        const response = JSON.stringify({ data: doc, status: 200 });
                        res.send(response);
                        res.end();
                    }
                });
            } else {
                if (xAssignList.length > 0) {
                    db.collection('CranAssignmentHistory').insertMany(xAssignList, {}, function(err, doc) {
                        if (err) {
                            throw err;
                        }
                        const response = JSON.stringify({ data: doc, status: 200 });
                        res.send(response);
                        res.end();
                    });
                } else {
                    const response = JSON.stringify({ data: doc, status: 200 });
                    res.send(response);
                    res.end();
                }
            }
        });
    });

    router.post('/delete/:id', function(req, res, next) {
        objectId = new ObjectId(req.params.id);
        db.collection('CranJob').deleteOne({ _id: objectId }, function(err, doc) {
            if (err) {
                throw err;
            }
            var myquery = { "WorkOrderNo": req.body.WorkOrderNo };
            var newvalues = { $set: { JobDefined: false } };
            db.collection('CranWorkorder').updateOne(myquery, newvalues, {}, function(err, doc) {
                if (err) {
                    throw err;
                }

                const response = JSON.stringify({ data: req.body, status: 200 });
                res.send(response);
                res.end();
            });
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