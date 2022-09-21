const express = require("express");
const router = express.Router({ mergeParams: true });
const mongodb = require("../Utilities/mongodb");
var dateFormat = require('dateformat');

mongodb.connectDB(async err => {
    if (err) {
        logger.setErrorLog(err);
        throw err;
    }
    const db = mongodb.getDB();

    router.get('/getDashboardData', function(req, res, next) {
        var list = [];

        db.collection("SalesInvoice").aggregate([{

            $group: {
                _id: 1,
                NetTotal: { $sum: "$NetTotal" },
                PaymentDone: { $sum: "$PaymentDone" },
                TotalCharges: { $sum: "$TotalCharges" },
                PaymentDue: { $sum: "$PaymentDue" }
            }


        }], { cursor: {} }, null).toArray(function(err, sum) {
            if (err) {
                throw err;
            }
            if (sum.length > 0) {

                var TotalReceivable = { TotalReceivable: (Math.round((sum[0].NetTotal) * 100) / 100).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') };
                var TotalReceivedAmount = { TotalReceivedAmount: (Math.round((sum[0].PaymentDone) * 100) / 100).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') };
                var TotalCharges = { TotalCharges: (Math.round((sum[0].TotalCharges) * 100) / 100).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') };
                var TotalAmountToBeRecovered = { TotalAmountToBeRecovered: (Math.round((sum[0].PaymentDue) * 100) / 100).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') };

                list.push(TotalReceivable);
                list.push(TotalReceivedAmount);
                list.push(TotalCharges);
                list.push(TotalAmountToBeRecovered);
            } else {
                var TotalReceivable = { TotalReceivable: '0.00' };
                var TotalReceivedAmount = { TotalReceivedAmount: '0.00' };
                var TotalCharges = { TotalCharges: '0.00' };
                var TotalAmountToBeRecovered = { TotalAmountToBeRecovered: '0.00' };

                list.push(TotalReceivable);
                list.push(TotalReceivedAmount);
                list.push(TotalCharges);
                list.push(TotalAmountToBeRecovered);
            }

            db.collection('SalesInvoice').estimatedDocumentCount(function(err, data) {
                if (err) {
                    console.log(err);
                    throw err;
                }

                var TotalInvoice = { TotalInvoice: data };
                list.push(TotalInvoice);

                db.collection('customersetup').estimatedDocumentCount(function(err, data) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }

                    var TotalCustomer = { TotalCustomer: data };
                    list.push(TotalCustomer);

                    db.collection('Workorder').estimatedDocumentCount(function(err, data) {
                        if (err) {
                            console.log(err);
                            throw err;
                        }

                        var TotalWorkorder = { TotalWorkorder: data };
                        list.push(TotalWorkorder);

                        db.collection('transportersetup').estimatedDocumentCount(function(err, data) {
                            if (err) {
                                console.log(err);
                                throw err;
                            }

                            var TotalTransporter = { TotalTransporter: data };
                            list.push(TotalTransporter);



                            db.collection('Vehicle').estimatedDocumentCount(function(err, data) {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                }

                                var TotalVehicle = { TotalVehicle: data };
                                list.push(TotalVehicle);

                                db.collection('users').estimatedDocumentCount(function(err, data) {
                                    if (err) {
                                        console.log(err);
                                        throw err;
                                    }

                                    var TotalUsers = { TotalUsers: data };
                                    list.push(TotalUsers);

                                    db.collection('ExpenseType').estimatedDocumentCount(function(err, data) {
                                        if (err) {
                                            console.log(err);
                                            throw err;
                                        }

                                        var TotalExpenseType = { TotalExpenseType: data };
                                        list.push(TotalExpenseType);

                                        db.collection("ExpenseInvoice").aggregate([{

                                            $group: {
                                                _id: 1,
                                                Total: { $sum: "$Total" },
                                            }


                                        }], { cursor: {} }, null).toArray(function(err, sum) {
                                            if (err) {
                                                throw err;
                                            }
                                            if (sum.length > 0) {

                                                var TotalExpense = { TotalExpense: (Math.round((sum[0].Total) * 100) / 100).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') };
                                                list.push(TotalExpense);
                                            } else {
                                                var TotalExpense = { TotalExpense: '0.00' };
                                                list.push(TotalExpense);
                                            }

                                            db.collection('SalesInvoice').find({}).sort({ _id: -1 }).limit(8).toArray(function(err, data) {
                                                if (err) {
                                                    console.log(err);
                                                    throw err;
                                                }

                                                data.forEach(element => {
                                                    element.InvoiceDate = dateFormat(element.InvoiceDate, 'dd/mm/yyyy');
                                                });

                                                var Invoice = { Invoice: data };
                                                list.push(Invoice);

                                                res.send(list);
                                                res.end();
                                            });

                                        });

                                        //new add  
                                //         db.collection('Crantruck').estimatedDocumentCount(function(err, data) {
                                //             if (err) {
                                //                 console.log(err);
                                //                 throw err;
                                //             }
                
                                //             var TotalCrantruck = { TotalCrantruck: data };
                                //             list.push(TotalCrantruck);
                                        

                                //         db.collection('Crantransportersetup').estimatedDocumentCount(function(err, data) {
                                //             if (err) {
                                //                 console.log(err);
                                //                 throw err;
                                //             }
                
                                //             var TotalCrantransportersetup = { TotalCrantransportersetup: data };
                                //             list.push(TotalCrantransportersetup);
                                
                                //     });
                                // });
                            });
                        });

                    });

                });
                
            });
                });
            });

        });

    });


});

module.exports = router;