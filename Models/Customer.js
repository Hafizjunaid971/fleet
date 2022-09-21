var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let Customer = new Schema({
    Name: {
        type: String,
        trim: true,
        default: null
    },
    CompanyName: {
        type: String,
        trim: true,
        default: null
    },
    Phone: {
        type: String,
        trim: true,
        default: null
    },
    Email: {
        type: String,
        trim: true,
        default: null
    },
    Address: {
        type: String,
        trim: true,
        default: null
    },
    City: {
        type: String,
        trim: true,
        default: null
    },
    CreatedDate: {
        type: Date,
        default: null
    },
    CreatedBy: {
        type: String,
        trim: true,
        default: null
    },
    ModifiedBy: {
        type: String,
        trim: true,
        default: null
    },
    ModifiedDate: {
        type: Date,
        default: null
    }
});


module.exports = mongoose.model('IMS_CUSTOMERS', Customer);