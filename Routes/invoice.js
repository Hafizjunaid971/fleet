const express = require("express");
const router = express.Router({ mergeParams: true });
const mongodb = require("../Utilities/mongodb")
var ObjectId = require('mongodb').ObjectID;
var dateFormat = require('dateformat');
var moment = require('moment');

mongodb.connectDB(async err => {
    if (err) {
        logger.setErrorLog(err);
        throw err;
    }
    const db = mongodb.getDB();

    router.get('/getAllInvoice', function(req, res, next) {
        db.collection('SalesInvoice').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            data.forEach(element => {
                element.CreatedDate = dateFormat(element.CreatedDate, 'dd/mm/yyyy');
                element.InvoiceDate = dateFormat(element.InvoiceDate, 'dd/mm/yyyy');
                element.FromDate = dateFormat(element.FromDate, 'dd/mm/yyyy');
                element.ToDate = dateFormat(element.ToDate, 'dd/mm/yyyy');
                if (element.ModifiedDate)
                    element.ModifiedDate = dateFormat(element.ModifiedDate, 'dd/mm/yyyy');
            });
            res.send(data);
            res.end();
        });
    });

    router.get('/getSalesInvoiceFromHistory/:invoiceNumber', function(req, res, next) {
        db.collection('SalesInvoice_Payment_History').find({ InvoiceNumber: req.params.invoiceNumber }).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            data.forEach(element => {
                element.PaymentDate = dateFormat(element.PaymentDate, 'dd/mm/yyyy');
            });
            res.send(data);
            res.end();
        });
    });

    // yahn hanging kro add k method pe take 1st attemp pe apko 0 na rakhna pare 

    
    router.post('/add', async(req, res, next) => {
        req.body.PaymentDone = parseFloat(req.body.PaymentDone);

        req.body.InvoiceDate = DateFormat(req.body.InvoiceDate);
        req.body.ToDate = DateFormat(req.body.ToDate);
        req.body.FromDate = DateFormat(req.body.FromDate);
        req.body.CreatedDate = dateFormat(new Date(), 'isoDateTime');

        var WorkOrderNo = [];

        req.body.WorkOrderList.forEach(element => {
            WorkOrderNo.push(element.WorkOrderNo);
        });
        delete req.body.WorkOrder;
        db.collection('SalesInvoice').insertOne(req.body, {}, function(err, doc) {
            if (err) {
                throw err;
            }
            const response = JSON.stringify({ data: req.body, status: 200 });
            if (response) {

                var obj = {
                    InvoiceNumber: req.body.InvoiceNumber,
                    Date: req.body.CreatedDate,
                    Customer: req.body.Customer.Name,
                    Particulars: req.body.Particulars,
                    Amount: req.body.PaymentDone,
                    Flag: 'Quantity Out',
                }

                db.collection('CustomerLedger').insertOne(obj, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }

                    var payload = {
                        InvoiceNumber: req.body.InvoiceNumber,
                        PaymentDate: req.body.CreatedDate,
                        Customer: req.body.Customer,
			             // adding me
		                NetAmount:req.body.NetAmount,
                        PaymentDone: parseFloat(req.body.PaymentDone),
			             // ye mene comment kia we ha ye paymentdone:req.body.paymentdone,
                        //PaymentDone: req.body.PaymentDone,
                        PaymentDue: req.body.PaymentDue,
                        Receivable: req.body.Receivable
                    }
                    db.collection('SalesInvoice_Payment_History').insertOne(payload, {}, function(err, doc) {
                        if (err) {
                            throw err;
                        }

                        WorkOrderNo.forEach((element, i) => {
                            var myquery = { "WorkOrderNo": element };
                            var newvalues = { $set: { InvoiceCreated: true } };

                            const result = WorkOrderUpdate(myquery, newvalues);
                            if (result && WorkOrderNo.length - 1 == i) {
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
                                        Date: req.body.InvoiceDate,
                        
                                        CreditAmount: payload.PaymentDone,
                                        DebitAmount: 0,
                                        Balance: (CreditAmount + payload.PaymentDone) - DebitAmount,
                                        Type: "Sales Invoice",
                                        By: req.body.Customer.Name,
                                        VoucherNo: req.body.InvoiceNumber,
                                        Amount: payload.PaymentDone,
                                        Remarks: "Sales Invoice Created",
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
                            }
                        });
                    });
                });
            }
        });
    });

    async function WorkOrderUpdate(myquery, newvalues) {
        await db.collection('Workorder').updateOne(myquery, newvalues, {}, function(err, doc) {
            if (err) {
                throw err;
            }
        });
    }

    router.post('/update/:_id', function(req, res, next) {
        req.body.PaymentDone = parseFloat(req.body.PaymentDone);

        req.body.InvoiceDate = DateFormat(req.body.InvoiceDate);
        req.body.ToDate = DateFormat(req.body.ToDate);
        req.body.FromDate = DateFormat(req.body.FromDate);
        req.body.CreatedDate = DateFormat(req.body.CreatedDate);
        if (req.body.ModifiedDate) {
            req.body.ModifiedDate = DateFormat(req.body.ModifiedDate);
        } else {
            req.body.ModifiedDate = dateFormat(new Date(), 'isoDateTime');
        }

        objectId = new ObjectId(req.params._id);
        delete req.body._id;
        db.collection('SalesInvoice').updateOne({ _id: objectId }, { $set: req.body }, {}, function(err, doc) {
            if (err) {
                throw err;
            }

            var obj = {
                InvoiceNumber: req.body.InvoiceNumber,
                Date: req.body.ModifiedDate,
                Customer: req.body.Customer.Name,
                Particulars: req.body.Particulars,
                Amount: req.body.PaymentDone,
                Flag: 'Quantity Out',
            }

            db.collection('CustomerLedger').insertOne(obj, {}, function(err, doc) {
                if (err) {
                    throw err;
                }
                var payload = {
                    InvoiceNumber: req.body.InvoiceNumber,
                    PaymentDate: req.body.ModifiedDate,
                    Customer: req.body.Customer,
                    NetAmount: req.body.NetAmount,
                    PaymentDone: parseFloat(req.body.PaymentDone),
                    PaymentDue: req.body.PaymentDue,
                    Receivable: req.body.Receivable
                }
                db.collection('SalesInvoice_Payment_History').insertOne(payload, {}, function(err, doc) {
                    if (err) {
                        throw err;
                    }
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
                            Date: req.body.InvoiceDate,
                            CreditAmount: payload.PaymentDone,
                            DebitAmount: 0,
                            Balance: (CreditAmount + payload.PaymentDone) - DebitAmount,
                            Type: "Sales Invoice",
                            By: req.body.Customer.Name,
                            VoucherNo: req.body.InvoiceNumber,
                            Amount: payload.PaymentDone,
                            Remarks: "Update Sales Invoice",
                            CreatedBy: req.body.ModifiedBy,
                            CreatedDate: req.body.ModifiedDate
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
                });
            });
        });
    });

    router.post('/delete/:_id', function(req, res, next) {
        objectId = new ObjectId(req.params._id);
        db.collection('SalesInvoice').deleteOne({ _id: objectId }, function(err, doc) {
            if (err) {
                throw err;
            }
            const response = JSON.stringify({ data: req.body, status: 200 });
            res.send(response);
            res.end();
        });
    });

    router.get('/getPaymentDueStatus/:customer', function(req, res, next) {
        db.collection('SalesInvoice').findOne({ "Customer.Name": req.params.customer }, function(err, data) {
            if (err) {
                throw err;
            }
            res.send(data);
            res.end();
        });
    });

    router.get('/getAllCustomerFromWO', function(req, res, next) {
        db.collection('Workorder').find({}).toArray(function(err, data) {
            if (err) {
                throw err;
            }
            res.send(data);
            res.end();
        });
    });

    router.get('/getCustomerWorkOrder/:_id', function(req, res, next) {
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
                    ChargesDefined: 1
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
                $match: { "Customer._id": req.params._id, InvoiceCreated: false, JobDefined: true, ChargesDefined: true }
            }
        ]).toArray(function(err, data) {
            if (err) {
                throw err;
            }

            res.send(data);
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