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

    router.get('/getVehicleData/:VehicleNo', function(req, res, next) {

        VehicleNo = req.params.VehicleNo;
        db.collection('VehicleAssignmentHistory').find({ VehicleNo: VehicleNo }).toArray(function(err, data) {
            if (data.length > 0) {
                data.forEach(element => {
                    element.AssignmentToDate = dateFormat(element.AssignmentToDate, 'dd/mm/yyyy');
                    element.AssignmentFromDate = dateFormat(element.AssignmentFromDate, 'dd/mm/yyyy');
                });
                res.send(data);
                res.end();
            }
        });
    });
});

module.exports = router;