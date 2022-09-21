var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let User = new Schema({
    Name: {
        type: String,
        trim: true,
        default: null,
        required: true
    },
    UserId: {
        type: String,
        trim: true,
        default: null
    },
    Password: {
        type: String,
        trim: true,
        select: false
    },
    Email: {
        type: String,
        trim: true,
        lowercase: true
    },
    IsActive: {
        type: Boolean,
        default: false
    },
    CreatedDate: {
        type: Date,
        default: Date.now()
    },
});


module.exports = mongoose.model('users', User);