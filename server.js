const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
var User = require('./Models/User')

// var mongoose1 = require('mongoose');

// const mongoose = require('./Utilities/mongooseConfig')();

const authRoute = require('./Routes/auth');
const customerRoute = require('./Routes/customer');
const transporterRoute = require('./Routes/transporter');
const vendorRoute = require('./Routes/vendor');
const expenseRoute = require('./Routes/expense');
const autoshopRoute = require('./Routes/autoshop');
const dashboardRoute = require('./Routes/dashboard');
const vehicleRoute = require('./Routes/vehicle');
const workorderRoute = require('./Routes/workorder');
const assignjobRoute = require('./Routes/assignjob');
const chargesRoute = require('./Routes/charges');
const workordersummaryRoute = require('./Routes/workordersummary');
const invoiceRoute = require('./Routes/invoice');
const accountLedgerRoute = require('./Routes/accountledger');
const expenseInvoiceRoute = require('./Routes/expenseinvoice');
const usermanagementRoute = require('./Routes/usermanagement');
const vehicleassignmenthistoryRoute = require('./Routes/vehicleassignmenthistory');
const transportPaymentRoute = require('./Routes/transportpayment');
const cashManagementRoute = require('./Routes/cashmanagement');
const crantruckRoutes = require('./Routes/crantruck');
const cranexpenseRoutes  = require('./Routes/cranexpense');
const craninvoiceRoute = require('./Routes/craninvoice');
const crancustomerRoute = require('./Routes/crancustomer')
const cranworkorderRoute = require('./Routes/cranworkorder')
const cranjobassignRoute = require('./Routes/cranjobassign')
const cranTransportRoute = require('./Routes/crantransporter')
const cranTransportPaymentRoute =require('./Routes/crantransporterpayment')
// const vendorledgerRoute = require('./Routes/vendorledger');
const config = require("./Utilities/config").config;

app.use(express.static(path.join(__dirname, '/dist/')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cors());

// app.use((err, req, res, next) => {
//     return res.send({
//         "statusCode": util.statusCode.ONE,
//         "statusMessage": util.statusMessage.SOMETHING_WRONG
//     });
// });


console.log("before route handler")
app.use('/auth', authRoute);
app.use('/dashboard', dashboardRoute);
app.use('/customer', customerRoute);
app.use('/transporter', transporterRoute);
app.use('/vendor', vendorRoute);
app.use('/expense', expenseRoute);
app.use('/autoshop', autoshopRoute);
app.use('/vehicle', vehicleRoute);
app.use('/workorder', workorderRoute);
app.use('/assignjob', assignjobRoute);
app.use('/charges', chargesRoute);
app.use('/workordersummary', workordersummaryRoute);
app.use('/invoice', invoiceRoute);
app.use('/accountledger', accountLedgerRoute);
app.use('/expenseinvoice', expenseInvoiceRoute);
app.use('/usermanagement', usermanagementRoute);
app.use('/vehicleassignmenthistory', vehicleassignmenthistoryRoute);
app.use('/transportPayment', transportPaymentRoute);
app.use('/cashManagement', cashManagementRoute);
app.use('/crantruck', crantruckRoutes);
app.use('/cranexpense', cranexpenseRoutes);
app.use('/cranexpenseinvoice', craninvoiceRoute);
app.use('/crancustomer', crancustomerRoute);
app.use('/cranworkorder', cranworkorderRoute);
app.use('/cranjobassign', cranjobassignRoute);
app.use('/crantransporter', cranTransportRoute);
app.use('/crantransportpayment', cranTransportPaymentRoute);
// catch 404 and forward to error handler
app.use((req, res, next) => {
    next();
});


app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/dist/index.html'));
});

/**
 * Start Express server.
 */
app.set('port', process.env.PORT );
var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + server.address().port);
});