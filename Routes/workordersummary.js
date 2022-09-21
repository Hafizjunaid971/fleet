const express = require("express");
const router = express.Router({ mergeParams: true });
const mongodb = require("../Utilities/mongodb")
var dateFormat = require('dateformat');

mongodb.connectDB(async err => {
    if (err) {
        logger.setErrorLog(err);
        throw err;
    }
    const db = mongodb.getDB();

    router.get('/getWorkOrder/:WorkOrderNo', function(req, res, next) {
        db.collection('Workorder').aggregate([{
                $project: {
                    AssignJob: 1,
                    Charges: 1,
                    WorkOrderNo: 1,
                    WorkOrderDetails: 1,
                    ShipmentNo: 1,
                    WorkOrderDate: 1,
                    Type: 1,
                    BusinessCategory: 1,
                    Payable: 1,
                    Advance: 1,
                    Receivable: 1,
                    Customer: 1,
                    JobVoucherNo: 1,
                    JobAssignDate: 1,
                    ChargesDetail: 1,
                    ChargesTotal: 1,
                    ChargeNo: 1,
                    ChargesDate: 1,
                    InvoiceCreated: 1,
                    JobDefined: 1,
                    ChargesDefined: 1,
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
            },
            {
                $lookup: {
                    from: 'Charges',
                    localField: 'WorkOrderNo',
                    foreignField: 'WorkOrderNo',
                    as: 'Charges'
                }
            },
            {
                $match: { WorkOrderNo: req.params.WorkOrderNo }
            }
        ]).toArray(function(err, data) {
            if (err) {
                throw err;
            }

            if (data.length > 0) {
                data.forEach(element => {
                    element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                    element.WorkOrderDate = dateFormat(element.WorkOrderDate, 'dd/mm/yyyy');
                    if (element.ModifiedDate)
                        element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
                });

                data[0].AssignJob.forEach(element => {
                    element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                    element.JobAssignDate = dateFormat(element.JobAssignDate, 'dd/mm/yyyy');
                    if (element.ModifiedDate)
                        element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
                });

                data[0].Charges.forEach(element => {
                    element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                    element.ChargesDate = dateFormat(element.ChargesDate, 'dd/mm/yyyy');
                    if (element.ModifiedDate)
                        element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
                });

                res.send(data);
                res.end();
            }
        });
    });

});

module.exports = router;