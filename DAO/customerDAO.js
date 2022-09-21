"use strict";

var Models = require("../Models/Customer");

const getCustomer = criteria =>
    new Promise((resolve, reject) => {
        Models.find(criteria)
            .then(client => resolve(client))
            .catch(err => reject(err));
    });

const createCustomer = objToSave =>
    new Promise((resolve, reject) => {
        new Models(objToSave)
            .save()
            .then(client => resolve(client))
            .catch(err => {
                reject(err);
                console.log(err);
            });
    });

const updateCustomer = (criteria, dataToSet, options) =>
    new Promise((resolve, reject) => {
        Models.findOneAndUpdate(criteria, dataToSet, options)
            .then(client => resolve(client))
            .catch(err => reject(err));
    });

const deleteCustomer = criteria =>
    new Promise((resolve, reject) => {
        Models.findOneAndRemove(criteria)
            .exec()
            .then(client => resolve(client))
            .catch(err => reject(err));
    });

const getAllCustomer = criteria =>
    new Promise((resolve, reject) => {
        Models.find()
            .exec()
            .then(client => resolve(client))
            .catch(err => reject(err));
    });

module.exports = {
    getCustomer: getCustomer,
    createCustomer: createCustomer,
    updateCustomer: updateCustomer,
    deleteCustomer: deleteCustomer,
    getAllCustomer: getAllCustomer
};