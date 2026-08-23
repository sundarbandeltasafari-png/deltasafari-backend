
const asyncHandler = require('express-async-handler');
const md5 = require('md5');

var slugify = require('slugify');
const { 
    getAllPermisionMainModel, 
    insertPermisionRoute, 
    insertGroup, 
    getAllPermisionsModel, 
    deletePermisionRouteModel, 
    updateGroupModel,
    countUsersByPermissionGroupModel,
    deletePermisionGroupModel
} = require('../../../model/admin/user/adminPermisionModel');
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
            return res.status(400).json({ status: false, msg: 'Please enter valid details and select permissions.' });
        }
        const group = await insertGroup({ name: req?.body?.group_name, status: 1 });

        if (!group.insertId) {
            return res.status(400).json({ status: false, msg: 'Group could not be created, please try again.' });
        }
        const routeKeys = Object.keys(req?.body?.route);
        await Promise.all(routeKeys.map(async (key) => {
            const routeInnerKeys = Object.keys(req?.body?.route[key]);
            const innerObj = {
                permision_group_id: group.insertId,
                route: Number(key.replace(/'/g, "")),
                view_route: routeInnerKeys.some(k => k.includes('1')) ? 1 : 0,
                add_route: routeInnerKeys.some(k => k.includes('2')) ? 1 : 0,
                edit_route: routeInnerKeys.some(k => k.includes('3')) ? 1 : 0,
            };
            await insertPermisionRoute(innerObj);
        }));
        return res.status(200).json({ status: true, msg: 'Permission group created successfully.' });
    } catch (error) {
        next(error);
    }
});

const getPermisions = asyncHandler(async (req, res, next) => {
    try {
        const permision = await getAllPermisionsModel({ 'permision_group.status': 1 });
        return res.status(200).json({ status: true, msg: 'Permision..', permision: permision });
    } catch (error) {
        next(error);
    }
});

const getParticularPermisions = asyncHandler(async (req, res, next) => {
    try {
        const permisionId = req?.query?.id;
        if (!permisionId) {
            return res.status(400).json({ status: false, msg: 'Permission ID is not valid.' });
        }
        let targetId = permisionId;
        if (typeof permisionId === 'string' && isNaN(Number(permisionId))) {
            try {
                const decoded = urlDecode(permisionId);
                if (decoded && !isNaN(Number(decoded))) {
                    targetId = Number(decoded);
                }
            } catch (e) {
                targetId = permisionId;
            }
        } else {
            targetId = Number(permisionId);
        }
        const permision = await getAllPermisionsModel({ 'permision_group.status': 1, 'permision_group.id': targetId });
        return res.status(200).json({ status: true, msg: 'Permision..', permision: permision.length > 0 ? permision[0] : [] });
    } catch (error) {
        next(error);
    }
});

const editPermision = asyncHandler(async (req, res, next) => {
    try {
        const groupName = req?.body?.group_name;
        const permisionRoute = req?.body?.route;
        const permisionId = req?.body?.permision_id;

        if (!groupName || !permisionRoute || !permisionId) {
            return res.status(400).json({ status: false, msg: 'Please provide valid group details and permissions.' });
        }

        let targetId = permisionId;
        if (typeof permisionId === 'string' && isNaN(Number(permisionId))) {
            try {
                const decoded = urlDecode(permisionId);
                if (decoded && !isNaN(Number(decoded))) {
                    targetId = Number(decoded);
                }
            } catch (e) {
                targetId = permisionId;
            }
        } else {
            targetId = Number(permisionId);
        }

        await updateGroupModel({ name: groupName }, { id: targetId });
        await deletePermisionRouteModel({ permision_group_id: targetId });

        const routeKeys = Object.keys(permisionRoute);
        await Promise.all(routeKeys.map(async (key) => {
            const routeInnerKeys = Object.keys(permisionRoute[key]);
            const innerObj = {
                permision_group_id: targetId,
                route: Number(key.replace(/'/g, "")),
                view_route: routeInnerKeys.some(k => k.includes('1')) ? 1 : 0,
                add_route: routeInnerKeys.some(k => k.includes('2')) ? 1 : 0,
                edit_route: routeInnerKeys.some(k => k.includes('3')) ? 1 : 0,
            };
            await insertPermisionRoute(innerObj);
        }));

        return res.status(200).json({ status: true, msg: 'Permission group updated successfully.' });
    } catch (error) {
        next(error);
    }
});

const deletePermision = asyncHandler(async (req, res, next) => {
    try {
        const permisionId = req?.body?.id || req?.query?.id;
        if (!permisionId) {
            return res.status(400).json({ status: false, msg: 'Permission Group ID is required.' });
        }

        let targetId = permisionId;
        if (typeof permisionId === 'string' && isNaN(Number(permisionId))) {
            try {
                const decoded = urlDecode(permisionId);
                if (decoded && !isNaN(Number(decoded))) {
                    targetId = Number(decoded);
                }
            } catch (e) {
                targetId = permisionId;
            }
        } else {
            targetId = Number(permisionId);
        }

        // Check if any users are currently assigned to this permission group
        const assignedCount = await countUsersByPermissionGroupModel(targetId);
        if (assignedCount > 0) {
            return res.status(400).json({
                status: false,
                msg: `Cannot delete this permission group because it is currently assigned to ${assignedCount} user(s). Please reassign or remove the users first.`
            });
        }

        await deletePermisionGroupModel(targetId);
        return res.status(200).json({
            status: true,
            msg: 'Permission group deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    getPermisionMainRoute,
    createPermision,
    getPermisions,
    getParticularPermisions,
    editPermision,
    deletePermision
}