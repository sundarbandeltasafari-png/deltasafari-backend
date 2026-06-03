
const asyncHandler = require('express-async-handler');
const md5 = require('md5');

var slugify = require('slugify');
const { getAllPermisionMainModel, insertPermisionRoute, insertGroup, getAllPermisionsModel, deletePermisionRouteModel, updateGroupModel } = require('../../../model/admin/user/adminPermisionModel');
const { urlDecode } = require('../../../helper/urlHelper');


const getPermisionMainRoute = asyncHandler(async (req, res, next) => {
    try {
        const routes = await getAllPermisionMainModel({ status: 1 });
        return res.status(200).json({ status: true, msg: 'All routes..', routes: routes })
    } catch (error) {
        next(error)
    }
});

const createPermision = asyncHandler(async (req, res, next) => {
    try {
        if (!req?.body?.group_name || !req?.body?.route) {
            const error = new Error('Please enter valid Post details.');
            res.status(401);
            next(error);
        }
        const group = await insertGroup({ name: req?.body?.group_name });

        if (!group.insertId) {
            const error = new Error('GRoup is not created, Please try again later.');
            res.status(401);
            next(error);
        };
        const routeKeys = Object.keys(req?.body?.route);
        const response = Promise.all(routeKeys.map(async (key, index) => {
            const routeInnerKeys = Object.keys(req?.body?.route[key]);
            const innerObj = {
                permision_group_id: group.insertId,
                route: Number(key.replace(/'/g, "")),
                view_route: routeInnerKeys.includes("'1'") ? 1 : 0,
                add_route: routeInnerKeys.includes("'2'") ? 1 : 0,
                edit_route: routeInnerKeys.includes("'3'") ? 1 : 0,
            }
            await insertPermisionRoute(innerObj)
        }))
        return res.status(200).json({ status: true, msg: 'Permision created successfully..' })
    } catch (error) {
        next(error)
    }
})

const getPermisions = asyncHandler(async (req, res, next) => {
    try {
        const permision = await getAllPermisionsModel({ 'permision_group.status': 1 });
        return res.status(200).json({ status: true, msg: 'Permision..', permision: permision })
    } catch (error) {
        next(error)
    }
})

const getParticularPermisions = asyncHandler(async (req, res, next) => {
    try {
        const permisionId = req?.query?.id;
        if (!permisionId) {
            const error = new Error('Permision Id is not valid.');
            res.status(401);
            next(error);
        }
        const permision = await getAllPermisionsModel({ 'permision_group.status': 1, 'permision_group.id': urlDecode(permisionId) });
        return res.status(200).json({ status: true, msg: 'Permision..', permision: permision.length > 0 ? permision[0] : [] })
    } catch (error) {
        next(error)
    }
})

const editPermision = asyncHandler(async (req, res, next) => {
    try {
        const groupName = req?.body?.group_name;
        const permisionRoute = req?.body?.route;
        const permisionId = req?.body?.permision_id;

        if (!groupName || !permisionRoute || !permisionId) {
            const error = new Error('Please enter valid Post details.');
            res.status(401);
            next(error);
        }
        await updateGroupModel({ name: groupName }, { id: permisionId });
        await deletePermisionRouteModel({ permision_group_id: permisionId });

        const routeKeys = Object.keys(permisionRoute);
        const response = Promise.all(routeKeys.map(async (key, index) => {
            const routeInnerKeys = Object.keys(permisionRoute[key]);
            const innerObj = {
                permision_group_id: permisionId,
                route: Number(key.replace(/'/g, "")),
                view_route: routeInnerKeys.includes("'1'") ? 1 : 0,
                add_route: routeInnerKeys.includes("'2'") ? 1 : 0,
                edit_route: routeInnerKeys.includes("'3'") ? 1 : 0,
            }
            await insertPermisionRoute(innerObj)
        }))

        return res.status(200).json({ status: true, msg: 'Permision created successfully..' })
    } catch (error) {
        next(error)
    }
})

module.exports = {
    getPermisionMainRoute,
    createPermision,
    getPermisions,
    getParticularPermisions,
    editPermision
}